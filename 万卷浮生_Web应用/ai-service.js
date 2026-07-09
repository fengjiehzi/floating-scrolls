// ai-service.js - AI服务核心模块
// 同时支持 OpenAI 兼容协议 与 Anthropic 原生协议（/v1/messages）

const { getProvider, getProviderBaseUrl, getProviderApiKeyEnv, getBaseUrlByProtocol } = require('./ai-model-presets');

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const REQUEST_TIMEOUT = 30000;
const ANTHROPIC_VERSION = '2023-06-01';

class AIService {
  constructor() {
    this.currentProvider = null;
    this.currentModel = null;
    this.apiKey = null;
    this.baseUrl = null;
    this.protocol = 'openai'; // 'openai' | 'anthropic'
    this._loadConfigFromEnv();
  }

  _loadConfigFromEnv() {
    const provider = process.env.AI_PROVIDER || 'deepseek';
    const model = process.env.AI_MODEL;
    this.setProvider(provider, model);
  }

  setProvider(providerId, customModel = null, protocol = null) {
    const provider = getProvider(providerId);
    if (!provider) {
      throw new Error(`不支持的AI服务商: ${providerId}`);
    }

    const envKey = getProviderApiKeyEnv(providerId);
    const apiKey = process.env[envKey] || process.env.OPENAI_API_KEY || '';

    this.currentProvider = providerId;
    this.apiKey = apiKey;
    let resolvedModel = customModel || provider.default_model;

    // 模型名纠错：若用户保存了 provider 已废弃/不存在的模型名，自动回退到 default_model
    // 典型场景：deepseek 早期预设误填 'deepseek-v4-pro'，官方实际只支持 deepseek-chat / deepseek-reasoner
    if (provider.models && provider.models.length > 0) {
      const knownIds = new Set(provider.models.map(m => m.id));
      if (!knownIds.has(resolvedModel)) {
        console.warn(`[AI] 模型名纠错：${providerId} 不识别模型 "${resolvedModel}"，回退到默认 "${provider.default_model}"`);
        resolvedModel = provider.default_model;
      }
    }

    this.currentModel = resolvedModel;

    // 协议选择：优先使用显式传入的 protocol，否则按供应商默认值
    if (protocol === 'anthropic' && provider.supports_anthropic) {
      this.protocol = 'anthropic';
    } else if (protocol === 'openai') {
      this.protocol = 'openai';
    } else if (provider.is_anthropic_native) {
      this.protocol = 'anthropic';
    } else {
      this.protocol = 'openai';
    }

    this.baseUrl = getBaseUrlByProtocol(providerId, this.protocol);

    return {
      provider: providerId,
      name: provider.name,
      model: this.currentModel,
      protocol: this.protocol,
      hasApiKey: !!apiKey
    };
  }

  setProtocol(protocol) {
    if (protocol !== 'openai' && protocol !== 'anthropic') {
      throw new Error(`不支持的协议类型: ${protocol}`);
    }
    this.protocol = protocol;
    if (this.currentProvider) {
      this.baseUrl = getBaseUrlByProtocol(this.currentProvider, protocol);
    }
  }

  getCurrentConfig() {
    const provider = getProvider(this.currentProvider);
    return {
      provider: this.currentProvider,
      providerName: provider ? provider.name : null,
      model: this.currentModel,
      baseUrl: this.baseUrl,
      protocol: this.protocol,
      hasApiKey: !!this.apiKey
    };
  }

  // OpenAI 兼容协议请求头
  _buildOpenAIHeaders(customApiKey = null) {
    const apiKey = customApiKey || this.apiKey;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }

  // Anthropic 原生协议请求头
  _buildAnthropicHeaders(customApiKey = null) {
    const apiKey = customApiKey || this.apiKey;
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    };
  }

  _buildHeaders(customApiKey = null) {
    // 向后兼容：根据当前协议选择对应头部
    return this.protocol === 'anthropic'
      ? this._buildAnthropicHeaders(customApiKey)
      : this._buildOpenAIHeaders(customApiKey);
  }

  // 将 OpenAI 风格的 messages 转换为 Anthropic 格式
  // Anthropic: system 单独提取为顶层字段，messages 只包含 user/assistant
  _convertToAnthropicMessages(messages) {
    let system = '';
    const converted = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system += (system ? '\n' : '') + (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
      } else {
        converted.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }

    return { system, messages: converted };
  }

  // 从 Anthropic 响应中提取文本内容
  _extractAnthropicContent(data) {
    if (!data || !Array.isArray(data.content)) return '';
    return data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');
  }

  // 统一请求方法：根据 protocol 选择头部
  // options.protocol 优先级最高；其次使用 this.protocol
  async _request(endpoint, body, options = {}) {
    const {
      customBaseUrl = null,
      customApiKey = null,
      timeout = REQUEST_TIMEOUT,
      protocol = null
    } = options;

    const usedProtocol = protocol || this.protocol;

    const baseUrl = customBaseUrl || this.baseUrl;
    if (!baseUrl) {
      throw new Error('未配置API基础地址');
    }

    const apiKey = customApiKey || this.apiKey;
    if (!apiKey && endpoint !== '/models') {
      throw new Error('未配置API密钥，请先在设置中配置API Key');
    }

    const headers = usedProtocol === 'anthropic'
      ? this._buildAnthropicHeaders(apiKey)
      : this._buildOpenAIHeaders(apiKey);

    const url = `${baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 先读取文本，再尝试解析 JSON，避免 "Unexpected token" 错误
      const text = await response.text();

      if (!text || text.trim().startsWith('<') || text.trim().startsWith('<!')) {
        // HTML 响应（通常是 404/500 错误页）
        const protoHint = usedProtocol === 'anthropic'
          ? 'Anthropic 兼容地址通常以 /anthropic 结尾，例如：https://api.example.com/anthropic'
          : 'OpenAI 兼容地址应以 /v1 结尾，例如：https://api.example.com/v1';
        const error = new Error(
          `接口地址错误或不可用（HTTP ${response.status}）。请检查接口地址是否正确，${protoHint}`
        );
        error.status = response.status;
        error.errorType = response.status === 404 ? 'not_found' : 'server_error';
        throw error;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        const snippet = text.substring(0, 200);
        const error = new Error(
          `接口返回了非 JSON 格式的响应（HTTP ${response.status}），可能是接口地址或协议类型不正确。响应内容: ${snippet}`
        );
        error.status = response.status;
        error.errorType = 'bad_response';
        throw error;
      }

      if (!response.ok) {
        const errorInfo = this._parseError(data, response.status);
        const error = new Error(errorInfo.message);
        error.status = response.status;
        error.provider = this.currentProvider;
        error.model = body.model;
        error.errorType = errorInfo.type;
        error.rawError = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('请求超时，请检查网络连接或稍后重试');
        timeoutErr.status = 408;
        timeoutErr.errorType = 'timeout';
        throw timeoutErr;
      }
      throw err;
    }
  }

  _parseError(data, status) {
    const error = data.error || data;
    const message = error.message || error.msg || JSON.stringify(data);

    let type = 'unknown';
    let userMessage = message;

    switch (status) {
      case 401:
      case 403:
        type = 'auth';
        userMessage = 'API密钥无效或已过期，请检查您的API Key配置';
        break;
      case 404:
        type = 'not_found';
        userMessage = `模型不存在或接口地址错误：${message}`;
        break;
      case 429:
        type = 'rate_limit';
        userMessage = '请求过于频繁，请稍后再试';
        break;
      case 400:
        type = 'bad_request';
        if (message.includes('model') && message.includes('not exist')) {
          userMessage = '模型名称不正确，请切换到该服务商支持的模型';
        }
        break;
      case 500:
      case 502:
      case 503:
        type = 'server_error';
        userMessage = 'AI服务暂时不可用，请稍后重试';
        break;
    }

    return { type, message: userMessage, rawMessage: message };
  }

  async chat(messages, options = {}) {
    const {
      model = this.currentModel,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      stream = false,
      customBaseUrl = null,
      customApiKey = null,
      customProvider = null,
      protocol = null
    } = options;

    let usedBaseUrl = customBaseUrl;
    let usedApiKey = customApiKey;
    let usedProtocol = protocol || this.protocol;

    if (customProvider) {
      const provider = getProvider(customProvider);
      if (provider) {
        const envKey = getProviderApiKeyEnv(customProvider);
        usedApiKey = usedApiKey || process.env[envKey];
        // 没有显式传入 base_url 时，按协议自动选择
        if (!usedBaseUrl) {
          usedBaseUrl = getBaseUrlByProtocol(customProvider, usedProtocol);
        }
        // 没有显式传入协议时，按供应商默认值
        if (!protocol) {
          usedProtocol = provider.is_anthropic_native ? 'anthropic' : usedProtocol;
          if (usedProtocol === 'anthropic' && !provider.supports_anthropic) {
            usedProtocol = 'openai';
          }
          usedBaseUrl = usedBaseUrl || getBaseUrlByProtocol(customProvider, usedProtocol);
        }
      }
    }

    if (usedProtocol === 'anthropic') {
      // === Anthropic 原生协议 ===
      const { system, messages: converted } = this._convertToAnthropicMessages(messages);
      const body = {
        model,
        max_tokens: maxTokens,
        messages: converted,
        stream
      };
      if (system) body.system = system;
      if (temperature !== undefined && temperature !== null) body.temperature = temperature;

      const data = await this._request('/v1/messages', body, {
        customBaseUrl: usedBaseUrl,
        customApiKey: usedApiKey,
        timeout: options.timeout,
        protocol: 'anthropic'
      });

      return {
        content: this._extractAnthropicContent(data),
        model: data.model,
        usage: data.usage,
        finishReason: data.stop_reason,
        raw: data
      };
    }

    // === OpenAI 兼容协议 ===
    const body = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    };

    const data = await this._request('/chat/completions', body, {
      customBaseUrl: usedBaseUrl,
      customApiKey: usedApiKey,
      timeout: options.timeout,
      protocol: 'openai'
    });

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
      finishReason: data.choices?.[0]?.finish_reason,
      raw: data
    };
  }

  async *chatStream(messages, options = {}) {
    const {
      model = this.currentModel,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      customBaseUrl = null,
      customApiKey = null,
      customProvider = null,
      protocol = null
    } = options;

    let usedBaseUrl = customBaseUrl;
    let usedApiKey = customApiKey;
    let usedProtocol = protocol || this.protocol;

    if (customProvider) {
      const provider = getProvider(customProvider);
      if (provider) {
        const envKey = getProviderApiKeyEnv(customProvider);
        usedApiKey = usedApiKey || process.env[envKey];
        if (!usedBaseUrl) {
          usedBaseUrl = getBaseUrlByProtocol(customProvider, usedProtocol);
        }
        if (!protocol) {
          usedProtocol = provider.is_anthropic_native ? 'anthropic' : usedProtocol;
          if (usedProtocol === 'anthropic' && !provider.supports_anthropic) {
            usedProtocol = 'openai';
          }
          usedBaseUrl = usedBaseUrl || getBaseUrlByProtocol(customProvider, usedProtocol);
        }
      }
    }

    const baseUrl = usedBaseUrl || this.baseUrl;
    const apiKey = usedApiKey || this.apiKey;

    if (!apiKey) {
      throw new Error('未配置API密钥');
    }

    const headers = usedProtocol === 'anthropic'
      ? this._buildAnthropicHeaders(apiKey)
      : this._buildOpenAIHeaders(apiKey);

    if (usedProtocol === 'anthropic') {
      // === Anthropic 流式响应 ===
      const { system, messages: converted } = this._convertToAnthropicMessages(messages);
      const body = {
        model,
        max_tokens: maxTokens,
        messages: converted,
        stream: true
      };
      if (system) body.system = system;
      if (temperature !== undefined && temperature !== null) body.temperature = temperature;

      const url = `${baseUrl}/v1/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        let errData;
        try { errData = JSON.parse(text); } catch (e) { errData = { error: { message: text.substring(0, 200) } }; }
        const errorInfo = this._parseError(errData, response.status);
        const error = new Error(errorInfo.message);
        error.status = response.status;
        error.errorType = errorInfo.type;
        throw error;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
              yield { content: data.delta.text, done: false, raw: data };
            } else if (data.type === 'message_stop') {
              yield { content: '', done: true, finishReason: 'stop', usage: data.usage };
            } else if (data.type === 'message_delta' && data.usage) {
              yield { content: '', done: false, usage: data.usage, raw: data };
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      return;
    }

    // === OpenAI 流式响应 ===
    const url = `${baseUrl}/chat/completions`;
    const body = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const data = await response.json();
      const errorInfo = this._parseError(data, response.status);
      const error = new Error(errorInfo.message);
      error.status = response.status;
      error.errorType = errorInfo.type;
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const jsonStr = trimmed.slice(6);
          const data = JSON.parse(jsonStr);
          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            yield { content, done: false, raw: data };
          }
          if (data.choices?.[0]?.finish_reason) {
            yield { content: '', done: true, finishReason: data.choices[0].finish_reason, usage: data.usage };
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  async extractCharacterFromNovel(novelText, characterName, options = {}) {
    const prompt = `你是一个专业的小说角色分析师。请从下面的小说文本中分析角色"${characterName}"，提取以下信息并以严格的JSON格式返回：

{
  "name": "角色名",
  "grade": "S/A/B/C 等级（根据角色战力强度评估）",
  "source": "出处（作品名）",
  "source_basis": "角色在原著中的身份地位简述（50字以内）",
  "gradient": "角色主色调（十六进制颜色，如 #FF6B6B）",
  "stats": {
    "power": 攻击力(0-10000),
    "speed": 速度(0-10000),
    "intelligence": 智力(0-10000),
    "defense": 防御力(0-10000),
    "special_ability": 特殊能力值(0-10000),
    "hp": 生命值(0-10000),
    "mp": 法力/能量(0-10000)
  },
  "skills": [
    {
      "name": "技能名",
      "type": "attack/buff/debuff/heal/special",
      "desc": "技能描述",
      "multiplier": 伤害倍率(如1.5),
      "mp_cost": 消耗法力值
    }
  ],
  "forms": [
    {
      "name": "形态名",
      "desc": "形态描述",
      "bonuses": {
        "power": 攻击加成比例(如0.2),
        "defense": 防御加成比例
      }
    }
  ]
}

要求：
1. stats 数值参考：S级角色主要属性8000-10000，A级6000-8000，B级4000-6000，C级2000-4000
2. skills 至少3个，最多5个，要有特色，符合角色设定
3. forms 至少1个，最多3个，是角色的进阶/变身形态
4. grade 根据角色在原著中的战力表现评定
5. 只返回JSON，不要有任何额外说明文字

小说文本：
${novelText.substring(0, 8000)}`;

    const result = await this.chat([
      { role: 'system', content: '你是一个严谨的小说角色数据分析师，只输出JSON格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 4000, temperature: 0.3 });

    try {
      const jsonStr = result.content.replace(/```json\s*/g, '').replace(/```/g, '').trim();
      const characterData = JSON.parse(jsonStr);
      return { character: characterData, raw: result.content };
    } catch (e) {
      const parseError = new Error('AI返回数据解析失败，请重试');
      parseError.errorType = 'parse_error';
      parseError.rawContent = result.content;
      throw parseError;
    }
  }

  async generateBattleNarration(battleData, options = {}) {
    const prompt = `你是一位古典小说风格的战斗解说员。请根据以下战斗数据，生成一段精彩的战斗旁白描述（100字以内）：

战斗回合：第${battleData.round}回合
进攻方：${battleData.attacker.name}
防守方：${battleData.defender.name}
使用技能：${battleData.skill?.name || '普通攻击'}
技能描述：${battleData.skill?.desc || ''}
造成伤害：${battleData.damage}
是否暴击：${battleData.isCritical ? '是' : '否'}
是否秒杀：${battleData.isInstantKill ? '是' : '否'}

要求：
- 用文言文或古典小说风格描述
- 突出战斗的紧张感和画面感
- 语言精炼，不超过100字
- 直接返回描述文字，不要加引号`;

    const result = await this.chat([
      { role: 'system', content: '你是一位擅长古典战争描写的评书先生。' },
      { role: 'user', content: prompt }
    ], { ...options, temperature: 0.8, maxTokens: 500 });

    return result.content.trim();
  }

  async generateCharacterDialogue(character, situation, options = {}) {
    const prompt = `请以角色"${character.name}"的身份，说一句话。

角色身份：${character.source_basis || '神秘角色'}
当前情境：${situation}

要求：
- 符合角色性格和身份
- 一句话，30字以内
- 直接说台词，不要加"xx说："之类的前缀`;

    const result = await this.chat([
      { role: 'system', content: '你是一个专业的角色配音演员。' },
      { role: 'user', content: prompt }
    ], { ...options, temperature: 0.9, maxTokens: 200 });

    return result.content.trim();
  }

  async testConnection(providerId, apiKey, model = null, customBaseUrl = null, protocol = null) {
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, error: '不支持的服务商' };
    }

    // 自定义供应商必须有 customBaseUrl
    if (provider.is_custom && !customBaseUrl) {
      return { success: false, error: '自定义供应商必须提供接口地址' };
    }

    // 确定使用的协议
    let usedProtocol = protocol || this.protocol;
    if (!protocol) {
      usedProtocol = provider.is_anthropic_native ? 'anthropic' : 'openai';
      // 如果协议是 anthropic 但供应商不支持，回退到 openai
      if (usedProtocol === 'anthropic' && !provider.supports_anthropic) {
        usedProtocol = 'openai';
      }
    } else if (protocol === 'anthropic' && !provider.supports_anthropic) {
      return { success: false, error: `服务商 ${provider.name} 不支持 Anthropic 协议` };
    }

    // 确定使用的 base url
    let usedBaseUrl = customBaseUrl;
    if (!usedBaseUrl) {
      usedBaseUrl = getBaseUrlByProtocol(providerId, usedProtocol);
    }

    try {
      const testModel = model || provider.default_model;
      if (!testModel) {
        return { success: false, error: '未指定测试模型' };
      }
      const result = await this.chat([
        { role: 'user', content: '请回复"连接成功"三个字。' }
      ], {
        customProvider: providerId,
        customApiKey: apiKey,
        customBaseUrl: usedBaseUrl,
        model: testModel,
        maxTokens: 50,
        temperature: 0,
        timeout: 15000,
        protocol: usedProtocol
      });

      return {
        success: true,
        model: result.model,
        protocol: usedProtocol,
        response: result.content,
        usage: result.usage
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        status: err.status,
        errorType: err.errorType,
        protocol: usedProtocol
      };
    }
  }

  async listModels(providerId, apiKey, protocol = null) {
    const provider = getProvider(providerId);
    if (!provider) {
      return { success: false, error: '不支持的服务商' };
    }

    // 确定使用的协议
    let usedProtocol = protocol || this.protocol;
    if (!protocol) {
      usedProtocol = provider.is_anthropic_native ? 'anthropic' : 'openai';
      if (usedProtocol === 'anthropic' && !provider.supports_anthropic) {
        usedProtocol = 'openai';
      }
    }

    try {
      const baseUrl = getBaseUrlByProtocol(providerId, usedProtocol);
      const headers = usedProtocol === 'anthropic'
        ? this._buildAnthropicHeaders(apiKey)
        : this._buildOpenAIHeaders(apiKey);
      const url = `${baseUrl}/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        return { success: false, error: `获取模型列表失败 (${response.status})` };
      }

      const data = await response.json();
      const models = (data.data || []).map(m => ({
        id: m.id,
        name: m.id,
        owned_by: m.owned_by,
        created: m.created
      }));

      return { success: true, models, protocol: usedProtocol };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ====== AI互动剧情相关 ======

  // 生成剧情章节
  async generateStoryChapter(bookContent, sessionData, options = {}) {
    const { chapterIndex, totalChapters, summary, previousChoices, character } = sessionData;
    const bookExcerpt = (bookContent || '').substring(0, 2000);

    // 角色信息段落：让 AI 以该角色视角生成剧情
    let characterSection = '';
    let charName = '主角';
    if (character) {
      charName = character.name;
      const skillsDesc = (character.skills || []).map(s => `${s.name}（${s.desc || ''}）`).join('、');
      characterSection = `
【玩家角色】
姓名：${character.name}（${character.grade}级角色）
出处：${character.source}
技能：${skillsDesc}
特征：${character.source_basis || ''}
请以"你"称呼玩家，让玩家代入${character.name}这一角色，剧情中可体现该角色的技能与性格特征。`;
    }

    const prompt = `你是一位擅长古典志怪小说的叙事大师。请根据以下信息生成第 ${chapterIndex} 章（共 ${totalChapters} 章）的剧情：

【书籍背景】
${bookExcerpt}
${characterSection}
【前情摘要】
${summary || '（这是第一章，尚无前情）'}

【玩家之前的选择】
${previousChoices && previousChoices.length > 0 ? previousChoices.map((c, i) => `第${i + 1}章：${c}`).join('\n') : '（无）'}

要求：
1. 生成约300-500字的剧情描述，要有古典小说的文风
2. 以"你"称呼玩家（${charName}），让玩家代入角色
3. 在剧情结尾给出3-4个选择选项，每个选项应有不同的风险和收益
4. 选项中应有探索、战斗、交际等不同类型
5. 以严格JSON格式返回（不要加markdown代码块标记）：
{
  "chapter_title": "章节标题",
  "story_text": "剧情正文",
  "choices": [
    {"id": "A", "text": "选项描述", "risk": "low", "hint": "提示信息"},
    {"id": "B", "text": "选项描述", "risk": "medium", "hint": "提示信息"},
    {"id": "C", "text": "选项描述", "risk": "high", "hint": "提示信息"}
  ],
  "chapter_summary": "本章剧情摘要"
}`;

    const result = await this.chat([
      { role: 'system', content: '你是一位擅长古典志怪小说的叙事大师，只输出JSON格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 3000, temperature: 0.8 });

    return this._parseStoryChapter(result);
  }

  _parseStoryChapter(raw) {
    try {
      let jsonStr = raw.trim();
      // 移除可能的markdown代码块标记
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      const data = JSON.parse(jsonStr);
      return {
        chapterTitle: data.chapter_title || '未知章节',
        storyText: data.story_text || '',
        choices: (data.choices || []).map(c => ({
          id: c.id || 'A',
          text: c.text || '',
          risk: c.risk || 'medium',
          hint: c.hint || ''
        })),
        chapterSummary: data.chapter_summary || ''
      };
    } catch (e) {
      return {
        chapterTitle: '剧情生成异常',
        storyText: raw,
        choices: [{ id: 'A', text: '继续前进', risk: 'low', hint: '' }],
        chapterSummary: ''
      };
    }
  }

  // 处理玩家选择，生成结果和奖励
  async processStoryChoice(bookContent, sessionData, choiceId, choiceText, options = {}) {
    const { chapterIndex, summary } = sessionData;
    const bookExcerpt = (bookContent || '').substring(0, 1500);

    const prompt = `玩家在第 ${chapterIndex} 章选择了选项 ${choiceId}：${choiceText}

【书籍背景】
${bookExcerpt}

【前情摘要】
${summary || ''}

请生成选择结果。注意：
1. 结果描述100-200字，古典风格
2. 约每3章获得1个角色（属性用0-10000的数值，HP约3000-8000，MP约200-800）
3. 约每2章获得1个道具
4. 每次获得经验值30-100

以严格JSON格式返回（不要加markdown代码块标记）：
{
  "result_text": "选择结果描述",
  "exp_gained": 50,
  "character_reward": null,
  "item_reward": null
}

如果获得角色，character_reward格式：
{
  "name": "角色名",
  "grade": "B",
  "source": "聊斋志异",
  "stats": {"power": 3000, "speed": 2500, "intelligence": 4000, "defense": 2800, "special_ability": 3500, "hp": 5000, "mp": 400},
  "skills": [
    {"name": "技能名", "type": "physical_attack", "multiplier": 1.3, "mp_cost": 0, "desc": "技能描述"},
    {"name": "技能名", "type": "magic_attack", "multiplier": 1.5, "mp_cost": 20, "desc": "技能描述"},
    {"name": "技能名", "type": "transform", "multiplier": 1.0, "mp_cost": 30, "desc": "技能描述"}
  ],
  "forms": [
    {"name": "基础", "bonuses": {}},
    {"name": "觉醒", "bonuses": {"power": 5, "speed": 3}}
  ],
  "source_basis": "原著依据"
}

如果获得道具，item_reward格式：
{
  "name": "道具名",
  "type": "weapon",
  "rarity": "rare",
  "description": "道具描述",
  "stats_bonus": {"power": 500, "defense": 200},
  "source_basis": "出处"
}`;

    const result = await this.chat([
      { role: 'system', content: '你是一位严谨的游戏数据生成器，只输出JSON格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 4000, temperature: 0.7 });

    return this._parseStoryChoice(result);
  }

  _parseStoryChoice(raw) {
    try {
      let jsonStr = raw.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      const data = JSON.parse(jsonStr);
      return {
        resultText: data.result_text || '',
        expGained: data.exp_gained || 0,
        characterReward: data.character_reward || null,
        itemReward: data.item_reward || null
      };
    } catch (e) {
      return {
        resultText: raw,
        expGained: 30,
        characterReward: null,
        itemReward: null
      };
    }
  }

  // 生成全书完结剧情
  async generateStoryEnding(bookContent, sessionData, options = {}) {
    const { summary, previousChoices } = sessionData;
    const bookExcerpt = (bookContent || '').substring(0, 1000);

    const prompt = `玩家已完成全书所有章节。请生成完结剧情：

【书籍背景】
${bookExcerpt}

【全书剧情摘要】
${summary || ''}

【玩家所有选择】
${previousChoices && previousChoices.length > 0 ? previousChoices.map((c, i) => `第${i + 1}章：${c}`).join('\n') : ''}

要求：
1. 生成200-400字的完结剧情，有始有终
2. 对玩家的全程表现做一个简短评价
3. 以严格JSON格式返回（不要加markdown代码块标记）：
{
  "ending_text": "完结剧情正文",
  "evaluation": "对玩家表现的评价",
  "final_exp": 200
}`;

    const result = await this.chat([
      { role: 'system', content: '你是一位擅长古典志怪小说的叙事大师，只输出JSON格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 2000, temperature: 0.8 });

    try {
      let jsonStr = result.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      const data = JSON.parse(jsonStr);
      return {
        endingText: data.ending_text || '',
        evaluation: data.evaluation || '',
        finalExp: data.final_exp || 200
      };
    } catch (e) {
      return {
        endingText: result,
        evaluation: '一段精彩的旅程',
        finalExp: 200
      };
    }
  }

  // ====== AI 动态剧情生成系统（DAG 兜底混合模式）======

  // 2.1 从书籍内容提取 3-5 个候选角色卡（不入库，由前端选择时再入库）
  async extractCharacterCardsFromBook(bookTitle, bookContent, options = {}) {
    const excerpt = (bookContent || '').substring(0, 4000);
    const prompt = `你是古典小说角色分析师。请从《${bookTitle}》文本中提取 3-5 个有戏份的角色作为玩家可选角色卡。

【书籍节选】
${excerpt}

要求严格输出 JSON 数组（不加 markdown 标记），每个元素结构如下：
[
  {
    "name": "角色名",
    "grade": "S/A/B/C 之一（按原著战力评定）",
    "source_basis": "角色在原著中的身份简述（30字内）",
    "gradient": "角色主色调（十六进制，如 #FF6B6B）",
    "stats": {
      "power": 0-10000, "speed": 0-10000, "intelligence": 0-10000,
      "defense": 0-10000, "special_ability": 0-10000, "hp": 0-10000, "mp": 0-10000
    },
    "skills": [
      {"name":"技能名","type":"attack/buff/debuff/heal/special","desc":"描述","multiplier":1.5,"mp_cost":20}
    ],
    "forms": [
      {"name":"形态名","desc":"描述","bonuses":{"power":0.2,"defense":0.1}}
    ]
  }
]

约束：
1. 数值参考：S级 8000-10000，A级 6000-8000，B级 4000-6000，C级 2000-4000
2. skills 至少 3 个最多 5 个；forms 至少 1 个最多 3 个
3. 优先选择原著中有名有姓、有剧情线的角色
4. 只返回 JSON 数组，不要任何额外说明`;

    const result = await this.chat([
      { role: 'system', content: '你是严谨的小说角色数据分析师，只输出 JSON 数组。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 3000, temperature: 0.4 });

    try {
      let jsonStr = result.content.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      // 容错：AI 可能在 JSON 前后加解释性文字，提取首个 [ 或 { 到对应结尾
      if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) {
        const startArr = jsonStr.indexOf('[');
        const startObj = jsonStr.indexOf('{');
        let start = -1, end = -1;
        if (startArr >= 0 && (startObj < 0 || startArr < startObj)) {
          start = startArr;
          end = jsonStr.lastIndexOf(']');
        } else if (startObj >= 0) {
          start = startObj;
          end = jsonStr.lastIndexOf('}');
        }
        if (start >= 0 && end > start) {
          jsonStr = jsonStr.substring(start, end + 1);
        }
      }
      const parsed = JSON.parse(jsonStr);
      const arr = Array.isArray(parsed) ? parsed : (parsed.characters || parsed.data || []);
      return { characters: arr, raw: result.content };
    } catch (e) {
      const err = new Error('AI 角色卡解析失败');
      err.errorType = 'parse_error';
      err.rawContent = result.content;
      throw err;
    }
  }

  // 2.1b 生成书籍摘要（300-500 字）：人物关系、核心冲突、风格基调
  // 用于替代 generateStoryNode prompt 中的原文节选，降低单次生成耗时
  // 失败时兜底返回书籍前 500 字作为摘要，不阻塞主流程
  async generateBookSummary(bookTitle, bookContent, options = {}) {
    const excerpt = (bookContent || '').substring(0, 4000);
    const prompt = `你是古典小说分析师。请为《${bookTitle}》生成一段 300-500 字的内容摘要，供后续剧情生成参考。

【书籍节选】
${excerpt}

要求摘要包含：
1. 核心人物关系与阵营
2. 主要冲突与故事主线
3. 风格基调（如志怪、武侠、权谋、言情等）
4. 关键场景或意象

只输出摘要正文，不要标题、不要分点编号、不要额外说明。`;

    try {
      const result = await this.chat([
        { role: 'system', content: '你是严谨的小说分析师，只输出摘要正文。' },
        { role: 'user', content: prompt }
      ], { ...options, maxTokens: 800, temperature: 0.3 });
      const summary = (result.content || '').trim();
      // 兜底：摘要过短或为空时回退到原文截取
      if (summary.length < 80) {
        return { summary: excerpt.substring(0, 500), raw: result.content };
      }
      return { summary, raw: result.content };
    } catch (e) {
      // AI 调用失败，兜底返回原文前 500 字
      console.error('[AI] 书籍摘要生成失败，回退原文截取:', e.message);
      return { summary: excerpt.substring(0, 500), raw: '', error: e.message };
    }
  }

  // 2.2 生成单个剧情节点（5 种类型之一：story/skill_unlock/form_unlock/battle/ending）
  async generateStoryNode(context, options = {}) {
    const {
      bookTitle, bookContent, character,
      nodeIndex = 0, maxNodes = 10,
      forceType = null, lastChoiceText = '',
      visitedNodes = [], statGrowth = {},
      unlockedSkills = [], unlockedForms = [],
      bookSummary = '',          // 书籍摘要（优先使用，替代原文节选）
      userDirection = '',        // 玩家开局方向（全程影响）
      userTurning = ''           // 本次关键转折输入（仅影响本节点）
    } = context;

    // 优先使用摘要；为空时回退到原文前 1500 字（向后兼容）
    const bookContext = bookSummary || (bookContent || '').substring(0, 1500);
    const bookContextLabel = bookSummary ? '书籍摘要' : '书籍节选';
    const charInfo = character ? `玩家角色：${character.name}（${character.grade}级，${character.source_basis || ''}）` : '玩家角色：默认主角';

    // 决定本节点是否强制为 ending
    const mustEnding = nodeIndex >= maxNodes || forceType === 'ending';
    const forbiddenEnding = !mustEnding && nodeIndex < maxNodes - 1;

    let typeConstraint;
    if (mustEnding) {
      typeConstraint = '本节点必须是 ending 类型（已达到节点数阈值），禁止 choices/enemy/effects/unlock 字段，必须有 ending_type（good/neutral/bad 之一）';
    } else if (forbiddenEnding) {
      typeConstraint = '本节点禁止 ending 类型；从 [story, skill_unlock, form_unlock, battle] 中选择一个';
    } else {
      typeConstraint = '从 [story, skill_unlock, form_unlock, battle, ending] 中选择一个';
    }

    const prompt = `你是古典志怪小说剧情生成师。为《${bookTitle}》生成第 ${nodeIndex + 1} 个剧情节点（最大 ${maxNodes} 节点）。

【${bookContextLabel}】
${bookContext}

【${charInfo}】
【已访问节点数】${visitedNodes.length}
【累计属性成长】${JSON.stringify(statGrowth)}
【已解锁技能】${unlockedSkills.map(s => s.name || s).join('、') || '无'}
【已解锁形态】${unlockedForms.map(f => f.name || f).join('、') || '无'}
【上个选择】${lastChoiceText || '（开局）'}
【玩家开局方向】${userDirection || '（未指定）'}
【本次转折输入】${userTurning || '（无）'}

【节点类型约束】${typeConstraint}

输出严格 JSON（不加 markdown 标记）：
{
  "id": "ai_node_${nodeIndex}",
  "type": "story|skill_unlock|form_unlock|battle|ending",
  "title": "节点标题（4-10字）",
  "chapter": "第X章",
  "description": "剧情正文（150-250字，第二人称'你'叙述）",
  "choices": [
    {"id":"c1","text":"选项文本（10-20字）","effects":{"power":2,"defense":1},"next":"ai_node_${nodeIndex + 1}"}
  ],
  "effects": {"power":2},
  "unlock": {"type":"skill|form","name":"名称","data":{...}},
  "enemy": {"name":"敌人名","grade":"A","stats":{...},"skills":[...],"forms":[{"name":"基础","bonuses":{}}]},
  "ending_type": "good|neutral|bad"
}

字段约束：
1. type='story'：必有 choices（2-3个，每个含 effects 1-5 范围）；可选 effects（进入节点生效）
2. type='skill_unlock'：必有 unlock.type='skill' 和 unlock.name + unlock.data（含 type/multiplier/mp_cost/desc）；必有 choices（2-3个）
3. type='form_unlock'：必有 unlock.type='form' 和 unlock.name + unlock.data（含 bonuses/desc）；必有 choices（2-3个）
4. type='battle'：必有 enemy 字段（含 name/grade/stats/skills/forms）；可选 choices（战斗前选项，2个）；battle 后胜利自动进下节点
5. type='ending'：必有 ending_type；禁止 choices/enemy/effects/unlock
6. effects 数值范围 1-5（整数）
7. 选项 effects 可为空对象 {}
8. 描述使用第二人称"你"叙述，贴合原著风格
9. 若【玩家开局方向】或【本次转折输入】非"未指定/无"，剧情走向需顺应用户意图
10. 只返回 JSON，不要额外说明`;

    const result = await this.chat([
      { role: 'system', content: '你是古典志怪小说剧情生成师，只输出 JSON 格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 2500, temperature: 0.7 });

    try {
      let jsonStr = result.content.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      // 容错：AI 可能在 JSON 前后加解释性文字，提取第一个 {...} 块
      if (!jsonStr.startsWith('{')) {
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        if (start >= 0 && end > start) {
          jsonStr = jsonStr.substring(start, end + 1);
        }
      }
      const node = JSON.parse(jsonStr);
      // 后端兜底：强制 ID 格式
      node.id = `ai_node_${nodeIndex}`;
      // 后端校验：effects 数值范围 1-5
      if (node.effects) {
        for (const k of Object.keys(node.effects)) {
          let v = Number(node.effects[k]);
          if (isNaN(v)) v = 1;
          v = Math.max(1, Math.min(5, Math.floor(v)));
          node.effects[k] = v;
        }
      }
      if (node.choices) {
        for (const c of node.choices) {
          if (c.effects) {
            for (const k of Object.keys(c.effects)) {
              let v = Number(c.effects[k]);
              if (isNaN(v)) v = 1;
              v = Math.max(1, Math.min(5, Math.floor(v)));
              c.effects[k] = v;
            }
          } else {
            c.effects = {};
          }
          if (!c.next) c.next = `ai_node_${nodeIndex + 1}`;
        }
      }
      return { node, raw: result.content };
    } catch (e) {
      const err = new Error('AI 剧情节点解析失败');
      err.errorType = 'parse_error';
      err.rawContent = result.content;
      throw err;
    }
  }

  // 2.3 战斗失败后生成 bad ending 节点
  async generateBadEnding(context, options = {}) {
    const { bookTitle, character, enemyName, nodeIndex = 0 } = context;
    const charName = character ? character.name : '主角';

    const prompt = `玩家在《${bookTitle}》第 ${nodeIndex + 1} 节点的战斗中被「${enemyName || '强敌'}」击败。请生成 bad ending 节点。

【角色】${charName}

输出严格 JSON（不加 markdown 标记）：
{
  "id": "ai_node_${nodeIndex}",
  "type": "ending",
  "title": "败北结局标题（4-8字）",
  "chapter": "终章",
  "description": "失败结局描述（150-300字，第二人称'你'叙述，体现败北的悲壮或遗憾）",
  "ending_type": "bad"
}

只返回 JSON，不要额外说明`;

    const result = await this.chat([
      { role: 'system', content: '你是古典志怪小说结局生成师，只输出 JSON 格式数据。' },
      { role: 'user', content: prompt }
    ], { ...options, maxTokens: 800, temperature: 0.7 });

    try {
      let jsonStr = result.content.trim();
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      const node = JSON.parse(jsonStr);
      node.id = `ai_node_${nodeIndex}`;
      node.type = 'ending';
      node.ending_type = 'bad';
      return { node, raw: result.content };
    } catch (e) {
      // 解析失败时返回兜底 bad ending
      return {
        node: {
          id: `ai_node_${nodeIndex}`,
          type: 'ending',
          title: '败北之路',
          chapter: '终章',
          description: `你在与强敌的交锋中落败，命途至此戛然而止。然志怪之道，败亦为机，来日方长，再战可期。`,
          ending_type: 'bad'
        },
        raw: result.content
      };
    }
  }
}

const aiService = new AIService();

module.exports = aiService;

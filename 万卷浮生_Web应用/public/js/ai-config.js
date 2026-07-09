// ai-config.js - 前端AI配置管理
const AIConfig = {
  currentProvider: 'deepseek',
  currentModel: '',
  currentProtocol: 'openai', // 'openai' | 'anthropic'
  providers: [],
  models: [],
  userConfig: null,

  async init() {
    await this.loadProviders();
    await this.loadUserConfig();
    this.bindEvents();
  },

  async loadProviders() {
    try {
      const res = await fetch('/api/ai/providers');
      const data = await res.json();
      this.providers = data.providers || [];
      this.renderProviderOptions();
    } catch (e) {
      console.error('加载服务商列表失败:', e);
    }
  },

  async loadUserConfig() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/ai/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user_config) {
        this.userConfig = data.user_config;
        this.currentProvider = data.user_config.provider || 'deepseek';
        this.currentModel = data.user_config.model || '';
        this.currentProtocol = data.user_config.protocol || 'openai';
      }
      this.updateConfigUI();
    } catch (e) {
      console.error('加载用户配置失败:', e);
    }
  },

  renderProviderOptions() {
    const select = document.getElementById('ai-provider-select');
    if (!select) return;

    select.innerHTML = '';
    this.providers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    if (this.currentProvider) {
      select.value = this.currentProvider;
      this.applyProviderState(this.currentProvider);
      this.loadModels(this.currentProvider);
    }
  },

  isCustomProvider(providerId) {
    const p = this.providers.find(x => x.id === providerId);
    return !!(p && p.is_custom);
  },

  // 检查指定供应商是否支持双协议
  supportsAnthropic(providerId) {
    const p = this.providers.find(x => x.id === providerId);
    return !!(p && p.supports_anthropic);
  },

  isAnthropicNative(providerId) {
    const p = this.providers.find(x => x.id === providerId);
    return !!(p && p.is_anthropic_native);
  },

  // 切换供应商时调用：决定协议选择器显隐与默认协议
  applyProviderState(providerId) {
    const protocolGroup = document.getElementById('ai-protocol-group');
    const openaiRadio = document.querySelector('input[name="ai-protocol"][value="openai"]');
    const anthropicRadio = document.querySelector('input[name="ai-protocol"][value="anthropic"]');

    const supportsAnthropic = this.supportsAnthropic(providerId);
    const isNative = this.isAnthropicNative(providerId);

    if (protocolGroup) {
      protocolGroup.style.display = supportsAnthropic ? '' : 'none';
    }

    // 默认协议：原生 Anthropic 供应商强制 anthropic；其他由当前选择决定
    if (isNative) {
      this.currentProtocol = 'anthropic';
    } else if (!supportsAnthropic) {
      this.currentProtocol = 'openai';
    }

    if (openaiRadio) openaiRadio.checked = (this.currentProtocol === 'openai');
    if (anthropicRadio) anthropicRadio.checked = (this.currentProtocol === 'anthropic');

    // 协议单选项的禁用状态：不支持 anthropic 时禁用对应单选项
    if (anthropicRadio) anthropicRadio.disabled = !supportsAnthropic;

    this.updateProtocolPillStyles();
    this.updateBaseUrlPlaceholder();
  },

  // 协议单选项选中态的高亮样式
  updateProtocolPillStyles() {
    const labels = document.querySelectorAll('.ai-protocol-option');
    labels.forEach(label => {
      const input = label.querySelector('input[type="radio"]');
      if (!input) return;
      if (input.checked) {
        label.style.borderColor = 'var(--old-gold-dark, #d4a574)';
        label.style.background = 'rgba(212, 165, 116, 0.12)';
        label.style.color = 'var(--text-primary)';
      } else {
        label.style.borderColor = 'var(--border-color)';
        label.style.background = 'transparent';
        label.style.color = 'var(--text-muted)';
      }
      label.style.opacity = input.disabled ? '0.5' : '1';
    });
  },

  // 根据协议更新 base_url 输入框的 placeholder 提示
  updateBaseUrlPlaceholder() {
    const baseUrlInput = document.getElementById('ai-custom-base-url');
    const baseUrlGroup = document.getElementById('ai-base-url-group');
    const baseUrlLabel = baseUrlGroup?.querySelector('.ai-form-label');
    if (!baseUrlInput) return;

    const isCustom = this.isCustomProvider(this.currentProvider);
    if (this.currentProtocol === 'anthropic') {
      if (baseUrlLabel) baseUrlLabel.textContent = isCustom ? 'Anthropic 接口地址（必填）' : '自定义 Anthropic 接口地址（可选）';
      baseUrlInput.placeholder = isCustom
        ? '例如：https://token-plan-cn.xiaomimimo.com/anthropic'
        : '留空使用默认 Anthropic 地址';
    } else {
      if (baseUrlLabel) baseUrlLabel.textContent = isCustom ? '接口地址（必填）' : '自定义接口地址（可选）';
      baseUrlInput.placeholder = isCustom
        ? '例如：https://token-plan-cn.xiaomimimo.com/v1'
        : '留空使用默认地址';
    }
  },

  toggleCustomProviderUI() {
    const isCustom = this.isCustomProvider(this.currentProvider);
    const modelSelectGroup = document.getElementById('ai-model-select-group');
    const customModelGroup = document.getElementById('ai-custom-model-group');

    if (modelSelectGroup) modelSelectGroup.style.display = isCustom ? 'none' : '';
    if (customModelGroup) customModelGroup.style.display = isCustom ? '' : 'none';

    this.updateBaseUrlPlaceholder();
  },

  async loadModels(providerId) {
    // 自定义供应商没有预设模型列表，直接切换UI
    if (this.isCustomProvider(providerId)) {
      this.models = [];
      this.toggleCustomProviderUI();
      return;
    }

    try {
      const res = await fetch(`/api/ai/providers/${providerId}/models`);
      const data = await res.json();
      this.models = data.models || [];
      this.renderModelOptions();
      this.toggleCustomProviderUI();
    } catch (e) {
      console.error('加载模型列表失败:', e);
    }
  },

  renderModelOptions() {
    const select = document.getElementById('ai-model-select');
    if (!select) return;

    select.innerHTML = '';
    if (this.models.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '该供应商暂无预设模型';
      select.appendChild(opt);
      return;
    }
    this.models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} - ${m.description}`;
      select.appendChild(opt);
    });

    if (this.currentModel) {
      select.value = this.currentModel;
    }
  },

  getCurrentModelValue() {
    if (this.isCustomProvider(this.currentProvider)) {
      return document.getElementById('ai-custom-model')?.value?.trim() || '';
    }
    return document.getElementById('ai-model-select')?.value || '';
  },

  getSelectedProtocol() {
    const checked = document.querySelector('input[name="ai-protocol"]:checked');
    return checked ? checked.value : 'openai';
  },

  updateConfigUI() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const customModelInput = document.getElementById('ai-custom-model');
    const customBaseUrl = document.getElementById('ai-custom-base-url');
    const apiKeyInput = document.getElementById('ai-api-key');
    const statusEl = document.getElementById('ai-config-status');

    if (providerSelect && this.currentProvider) {
      providerSelect.value = this.currentProvider;
      this.applyProviderState(this.currentProvider);
    }

    // 自定义供应商：填入自定义模型名；其他：填入下拉选择
    if (this.isCustomProvider(this.currentProvider)) {
      if (customModelInput && this.currentModel) {
        customModelInput.value = this.currentModel;
      }
    } else {
      if (modelSelect && this.currentModel) {
        modelSelect.value = this.currentModel;
      }
    }

    if (customBaseUrl && this.userConfig?.custom_base_url) {
      customBaseUrl.value = this.userConfig.custom_base_url;
    }
    if (apiKeyInput && this.userConfig?.has_api_key) {
      apiKeyInput.placeholder = '已保存（留空则不修改）';
    }
    if (statusEl && this.userConfig?.has_api_key) {
      statusEl.innerHTML = '<span style="color: var(--old-gold-dark);">✓ 已配置API Key</span>';
    }

    this.toggleCustomProviderUI();
  },

  bindEvents() {
    const providerSelect = document.getElementById('ai-provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.currentProvider = e.target.value;
        this.applyProviderState(e.target.value);
        this.loadModels(e.target.value);
      });
    }

    // 协议单选项切换
    const protocolRadios = document.querySelectorAll('input[name="ai-protocol"]');
    protocolRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentProtocol = e.target.value;
        this.updateProtocolPillStyles();
        this.updateBaseUrlPlaceholder();
      });
    });

    const saveBtn = document.getElementById('ai-save-config');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveConfig());
    }

    const testBtn = document.getElementById('ai-test-connection');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testConnection());
    }

    const fetchBtn = document.getElementById('ai-fetch-models-btn');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.fetchCustomModels());
    }

    // 从获取到的模型列表中选择时，同步到文本输入框
    const fetchedSelect = document.getElementById('ai-fetched-models');
    if (fetchedSelect) {
      fetchedSelect.addEventListener('change', (e) => {
        const textInput = document.getElementById('ai-custom-model');
        if (textInput && e.target.value) {
          textInput.value = e.target.value;
        }
      });
    }
  },

  async fetchCustomModels() {
    const token = localStorage.getItem('token');
    if (!token) {
      App.showToast('请先登录', 'error');
      return;
    }

    const baseUrl = document.getElementById('ai-custom-base-url')?.value?.trim();
    const apiKey = document.getElementById('ai-api-key')?.value?.trim() || '';
    const protocol = this.getSelectedProtocol();

    if (!baseUrl) {
      App.showToast('请先填写接口地址', 'error');
      return;
    }

    const btn = document.getElementById('ai-fetch-models-btn');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = '获取中...';
    btn.disabled = true;

    try {
      const res = await this._fetchWithTimeout('/api/ai/custom/fetch-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey, protocol })
      }, 30000);

      const data = await res.json();
      if (data.models && data.models.length > 0) {
        const select = document.getElementById('ai-fetched-models');
        if (select) {
          select.innerHTML = '<option value="">-- 选择获取到的模型 --</option>';
          data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.id}${m.description ? ' (' + m.description + ')' : ''}`;
            select.appendChild(opt);
          });
          select.style.display = '';

          // 如果文本输入框已有值，尝试选中匹配的模型
          const textInput = document.getElementById('ai-custom-model');
          if (textInput?.value) {
            select.value = textInput.value;
          }
        }
        App.showToast(`获取到 ${data.total} 个模型`, 'success');
      } else {
        App.showToast(data.error || '未获取到模型列表，请手动输入模型 ID', 'error');
      }
    } catch (e) {
      App.showToast('获取失败: ' + e.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },

  // 带超时的 fetch 封装：防止请求挂起导致按钮永远卡在"保存中"
  async _fetchWithTimeout(url, options, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  },

  async saveConfig() {
    const token = localStorage.getItem('token');
    if (!token) {
      App.showToast('请先登录', 'error');
      return;
    }

    const provider = document.getElementById('ai-provider-select')?.value;
    const model = this.getCurrentModelValue();
    const custom_base_url = document.getElementById('ai-custom-base-url')?.value?.trim() || '';
    const api_key = document.getElementById('ai-api-key')?.value || '';
    const protocol = this.getSelectedProtocol();

    if (!provider) {
      App.showToast('请选择AI服务商', 'error');
      return;
    }

    // 协议校验：选择 anthropic 时必须支持
    if (protocol === 'anthropic' && !this.supportsAnthropic(provider)) {
      App.showToast('该服务商不支持 Anthropic 协议，请切换为 OpenAI', 'error');
      return;
    }

    // 自定义供应商校验
    if (this.isCustomProvider(provider)) {
      if (!model) {
        App.showToast('请输入自定义模型名称', 'error');
        return;
      }
      if (!custom_base_url) {
        App.showToast('自定义供应商必须填写接口地址', 'error');
        return;
      }
    }

    const btn = document.getElementById('ai-save-config');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = '保存中...';
    btn.disabled = true;

    try {
      const res = await this._fetchWithTimeout('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider, model, custom_base_url, api_key, protocol })
      }, 15000);

      const data = await res.json();
      if (data.success) {
        App.showToast('配置保存成功', 'success');
        this.userConfig = { provider, model, custom_base_url, protocol, has_api_key: !!(api_key || this.userConfig?.has_api_key) };
        this.currentModel = model;
        this.currentProtocol = protocol;
        this.updateConfigUI();
        document.getElementById('ai-api-key').value = '';
      } else {
        App.showToast(data.error || '保存失败', 'error');
      }
    } catch (e) {
      const msg = e.name === 'AbortError' ? '保存超时，请检查网络后重试' : ('保存失败: ' + e.message);
      App.showToast(msg, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },

  async testConnection() {
    const token = localStorage.getItem('token');
    if (!token) {
      App.showToast('请先登录', 'error');
      return;
    }

    const provider = document.getElementById('ai-provider-select')?.value;
    const model = this.getCurrentModelValue();
    const custom_base_url = document.getElementById('ai-custom-base-url')?.value?.trim() || '';
    const api_key = document.getElementById('ai-api-key')?.value || '';
    const protocol = this.getSelectedProtocol();

    if (protocol === 'anthropic' && !this.supportsAnthropic(provider)) {
      App.showToast('该服务商不支持 Anthropic 协议，请切换为 OpenAI', 'error');
      return;
    }

    if (this.isCustomProvider(provider)) {
      if (!model) {
        App.showToast('请输入自定义模型名称', 'error');
        return;
      }
      if (!custom_base_url) {
        App.showToast('自定义供应商必须填写接口地址', 'error');
        return;
      }
    }

    const btn = document.getElementById('ai-test-connection');
    if (!btn) return;
    const originalText = btn.textContent;
    const statusEl = document.getElementById('ai-config-status');

    btn.textContent = '测试中...';
    btn.disabled = true;
    const protoLabel = protocol === 'anthropic' ? 'Anthropic' : 'OpenAI';
    statusEl.innerHTML = `<span style="color: var(--text-muted);">正在通过 ${protoLabel} 协议连接...</span>`;

    try {
      const res = await this._fetchWithTimeout('/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider, model, custom_base_url, api_key, protocol })
      }, 60000);

      const data = await res.json();
      if (data.success) {
        const usedProto = data.protocol || protocol;
        const usedProtoLabel = usedProto === 'anthropic' ? 'Anthropic' : 'OpenAI';
        statusEl.innerHTML = `<span style="color: #16a34a;">✓ ${usedProtoLabel} 协议连接成功！模型: ${data.model}</span>`;
        App.showToast(`${usedProtoLabel} 协议连接测试成功`, 'success');
      } else {
        let errorMsg = data.error || '连接失败';
        if (data.errorType === 'auth') {
          errorMsg = 'API密钥无效，请检查';
        } else if (data.errorType === 'not_found') {
          errorMsg = '模型不存在或接口地址错误';
        } else if (data.errorType === 'rate_limit') {
          errorMsg = '请求过于频繁，请稍后再试';
        } else if (data.errorType === 'timeout') {
          errorMsg = '请求超时，请检查网络';
        }
        statusEl.innerHTML = `<span style="color: var(--vermillion);">✗ ${errorMsg}</span>`;
        App.showToast(errorMsg, 'error');
      }
    } catch (e) {
      statusEl.innerHTML = `<span style="color: var(--vermillion);">✗ 网络错误</span>`;
      App.showToast('测试失败: ' + e.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  },

  async extractCharacterWithAI(text, characterName) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    const res = await fetch('/api/ai/extract-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text, character_name: characterName })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'AI提取失败');
    }

    return data.character;
  }
};

if (typeof window !== 'undefined') {
  window.AIConfig = AIConfig;
}

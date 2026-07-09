// ai-model-presets.js - 国内主流大模型预设配置
// 所有厂商同时支持 OpenAI 兼容协议和 Anthropic 原生协议（如官方提供）
// 2026 最新模型清单 + 双协议 Base URL + 自定义供应商

const MODEL_PRESETS = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek 深度求索',
    openai_base_url: 'https://api.deepseek.com/v1',
    anthropic_base_url: 'https://api.deepseek.com/anthropic',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'DEEPSEEK_API_KEY',
    default_model: 'deepseek-chat',
    supports_anthropic: true,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (chat)', type: 'chat', description: '官方通用对话模型，自动指向 V3 最新版' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (reasoner)', type: 'reasoning', description: '官方深度推理模型，自动指向 R1 最新版' }
    ],
    features: ['chat', 'reasoning']
  },

  zhipu: {
    id: 'zhipu',
    name: '智谱 AI (GLM)',
    openai_base_url: 'https://open.bigmodel.cn/api/paas/v4',
    anthropic_base_url: 'https://open.bigmodel.cn/api/anthropic',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    api_key_env: 'ZHIPU_API_KEY',
    default_model: 'glm-5.2',
    supports_anthropic: true,
    models: [
      { id: 'glm-5.2', name: 'GLM-5.2', type: 'chat', description: '最新旗舰模型，多模态全能' },
      { id: 'glm-5.1', name: 'GLM-5.1', type: 'chat', description: '上一代旗舰，Coding Agent优化' },
      { id: 'glm-5', name: 'GLM-5', type: 'chat', description: '5代通用模型' },
      { id: 'glm-5-turbo', name: 'GLM-5-Turbo', type: 'chat', description: '5代极速版' },
      { id: 'glm-5v-turbo', name: 'GLM-5V-Turbo', type: 'vision', description: '5代视觉多模态' },
      { id: 'glm-4.7', name: 'GLM-4.7', type: 'chat', description: '4.7代稳定版' },
      { id: 'glm-4.5', name: 'GLM-4.5', type: 'chat', description: '4.5代通用模型' },
      { id: 'glm-4.5-air', name: 'GLM-4.5-Air', type: 'chat', description: '高性价比轻量版' },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', type: 'chat', description: '4代增强版' },
      { id: 'glm-4-flash', name: 'GLM-4-Flash', type: 'chat', description: '免费版轻量模型' }
    ],
    features: ['chat', 'embedding', 'vision']
  },

  kimi: {
    id: 'kimi',
    name: '月之暗面 Kimi',
    openai_base_url: 'https://api.moonshot.cn/v1',
    anthropic_base_url: '',
    base_url: 'https://api.moonshot.cn/v1',
    api_key_env: 'KIMI_API_KEY',
    default_model: 'kimi-k2.6',
    supports_anthropic: false,
    models: [
      { id: 'kimi-k2.6', name: 'Kimi K2.6', type: 'chat', description: '最新旗舰模型，Agent与多模态理解' },
      { id: 'kimi-k2.5', name: 'Kimi K2.5', type: 'chat', description: '上一代主力模型' },
      { id: 'moonshot-v1-256k', name: 'Kimi V1 256K', type: 'chat', description: '256K 超大上下文' },
      { id: 'moonshot-v1-128k', name: 'Kimi V1 128K', type: 'chat', description: '128K 长上下文' },
      { id: 'moonshot-v1-32k', name: 'Kimi V1 32K', type: 'chat', description: '32K 标准上下文' },
      { id: 'moonshot-v1-8k', name: 'Kimi V1 8K', type: 'chat', description: '8K 日常对话' }
    ],
    features: ['chat', 'long_context']
  },

  qwen: {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    openai_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    anthropic_base_url: 'https://dashscope.aliyuncs.com/apps/anthropic',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'QWEN_API_KEY',
    default_model: 'qwen3.6-plus',
    supports_anthropic: true,
    models: [
      { id: 'qwen3.6-plus', name: 'Qwen3.6-Plus', type: 'chat', description: '最新均衡旗舰版，1M上下文' },
      { id: 'qwen3.5-122b-a10b', name: 'Qwen3.5-122B-A10B', type: 'chat', description: '旗舰 MoE 模型' },
      { id: 'qwen3.5-35b-a3b', name: 'Qwen3.5-35B-A3B', type: 'chat', description: '高性价比 MoE 模型' },
      { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', type: 'chat', description: '代码专用增强版' },
      { id: 'qwen-max', name: 'Qwen-Max', type: 'chat', description: '闭源旗舰版，能力最强' },
      { id: 'qwen-plus', name: 'Qwen-Plus', type: 'chat', description: '高阶增强版' },
      { id: 'qwen-turbo', name: 'Qwen-Turbo', type: 'chat', description: '快速响应版' },
      { id: 'qwen-long', name: 'Qwen-Long', type: 'chat', description: '超长上下文模型' }
    ],
    features: ['chat', 'vision', 'embedding']
  },

  minimax: {
    id: 'minimax',
    name: 'MiniMax 稀宇',
    openai_base_url: 'https://api.minimaxi.chat/v1',
    anthropic_base_url: '',
    base_url: 'https://api.minimaxi.chat/v1',
    api_key_env: 'MINIMAX_API_KEY',
    default_model: 'MiniMax-M3',
    supports_anthropic: false,
    models: [
      { id: 'MiniMax-M3', name: 'MiniMax-M3', type: 'chat', description: '最新旗舰模型，自我迭代能力' },
      { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', type: 'chat', description: '高性能版，1M上下文' },
      { id: 'MiniMax-M2.5', name: 'MiniMax-M2.5', type: 'chat', description: '上一代主力模型' },
      { id: 'abab6.5s', name: 'abab 6.5s', type: 'chat', description: '高速推理模型' },
      { id: 'abab6.5', name: 'abab 6.5', type: 'chat', description: '平衡型通用模型' }
    ],
    features: ['chat', 'voice', 'image_gen']
  },

  doubao: {
    id: 'doubao',
    name: '豆包 (Doubao)',
    openai_base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    anthropic_base_url: '',
    base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    api_key_env: 'DOUBAO_API_KEY',
    default_model: 'doubao-seed-2-0-pro',
    supports_anthropic: false,
    models: [
      { id: 'doubao-seed-2-0-pro', name: 'Doubao Seed 2.0 Pro', type: 'chat', description: '最新旗舰 Agent 模型，256K上下文' },
      { id: 'doubao-1-5-pro-256k', name: 'Doubao 1.5 Pro 256K', type: 'chat', description: '1.5旗舰版，256K上下文' },
      { id: 'doubao-1-5-pro-128k', name: 'Doubao 1.5 Pro 128K', type: 'chat', description: '1.5旗舰版，128K上下文' },
      { id: 'doubao-pro-32k', name: 'Doubao-Pro 32K', type: 'chat', description: '专业版 32K' },
      { id: 'doubao-pro-128k', name: 'Doubao-Pro 128K', type: 'chat', description: '专业版 128K' },
      { id: 'doubao-lite-32k', name: 'Doubao-Lite 32K', type: 'chat', description: '轻量版 32K' }
    ],
    features: ['chat', 'vision']
  },

  stepfun: {
    id: 'stepfun',
    name: '阶跃星辰 StepFun',
    openai_base_url: 'https://api.stepfun.com/v1',
    anthropic_base_url: '',
    base_url: 'https://api.stepfun.com/v1',
    api_key_env: 'STEPFUN_API_KEY',
    default_model: 'step-3.5',
    supports_anthropic: false,
    models: [
      { id: 'step-3.5', name: 'Step-3.5', type: 'chat', description: '最新增强版模型' },
      { id: 'step-3', name: 'Step-3', type: 'chat', description: '第三代主力模型' },
      { id: 'step-2', name: 'Step-2', type: 'chat', description: '第二代模型' },
      { id: 'step-1v', name: 'Step-1V', type: 'vision', description: '多模态视觉模型' }
    ],
    features: ['chat', 'vision']
  },

  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    openai_base_url: 'https://api.siliconflow.cn/v1',
    anthropic_base_url: '',
    base_url: 'https://api.siliconflow.cn/v1',
    api_key_env: 'SILICONFLOW_API_KEY',
    default_model: 'deepseek-ai/DeepSeek-V3',
    supports_anthropic: false,
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', type: 'chat', description: 'DeepSeek 通用对话旗舰' },
      { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5', type: 'chat', description: 'DeepSeek V2.5 稳定版' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', type: 'reasoning', description: 'DeepSeek 深度推理模型' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B', type: 'chat', description: '通义千问 72B 通用模型' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5 7B', type: 'chat', description: '通义千问 7B 高性价比版' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', type: 'chat', description: 'Meta Llama 3.3' }
    ],
    features: ['chat', 'image_gen', 'embedding']
  },

  openai: {
    id: 'openai',
    name: 'OpenAI 官方',
    openai_base_url: 'https://api.openai.com/v1',
    anthropic_base_url: '',
    base_url: 'https://api.openai.com/v1',
    api_key_env: 'OPENAI_API_KEY',
    default_model: 'gpt-5.5',
    supports_anthropic: false,
    models: [
      { id: 'gpt-5.5', name: 'GPT-5.5', type: 'chat', description: '最新旗舰模型，多模态全能' },
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat', description: '多模态旗舰模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', type: 'chat', description: '轻量高速模型' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat', description: 'GPT-4 Turbo 128K' },
      { id: 'o3', name: 'o3', type: 'reasoning', description: '新一代推理模型' },
      { id: 'o1', name: 'o1', type: 'reasoning', description: '推理模型' }
    ],
    features: ['chat', 'vision', 'image_gen', 'embedding']
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    openai_base_url: '',
    anthropic_base_url: 'https://api.anthropic.com',
    base_url: 'https://api.anthropic.com',
    api_key_env: 'ANTHROPIC_API_KEY',
    default_model: 'claude-sonnet-4-6',
    supports_anthropic: true,
    is_anthropic_native: true,
    models: [
      { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', type: 'chat', description: '最强通用旗舰，复杂推理与编码' },
      { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', type: 'chat', description: '上一代旗舰，强大推理能力' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', type: 'chat', description: '最新均衡模型，1M上下文' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', type: 'chat', description: '上一代均衡模型' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', type: 'chat', description: '轻量快速模型' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', type: 'chat', description: '4.5代旗舰模型' },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', type: 'chat', description: '经典3.5代' },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', type: 'chat', description: '经典3.5轻量版' }
    ],
    features: ['chat', 'vision', 'reasoning']
  },

  mimo: {
    id: 'mimo',
    name: '小米 MiMo',
    openai_base_url: 'https://token-plan-cn.xiaomimimo.com/v1',
    anthropic_base_url: 'https://token-plan-cn.xiaomimimo.com/anthropic',
    base_url: 'https://token-plan-cn.xiaomimimo.com/v1',
    api_key_env: 'MIMO_API_KEY',
    default_model: 'mimo-v2.5-pro',
    supports_anthropic: true,
    models: [
      { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', type: 'chat', description: '最新旗舰模型，1T参数+1M上下文，Agent优化' },
      { id: 'mimo-v2.5', name: 'MiMo-V2.5', type: 'chat', description: '原生全模态模型，支持文本/图像/视频/音频' },
      { id: 'mimo-v2-pro', name: 'MiMo-V2-Pro', type: 'chat', description: '上一代旗舰，42B激活参数，1M上下文' },
      { id: 'mimo-v2-omni', name: 'MiMo-V2-Omni', type: 'vision', description: '全模态Agent模型，文本/视觉/语音' }
    ],
    features: ['chat', 'vision', 'agent']
  },

  baidu: {
    id: 'baidu',
    name: '百度文心 (ERNIE)',
    openai_base_url: 'https://qianfan.baidubce.com/v2',
    anthropic_base_url: '',
    base_url: 'https://qianfan.baidubce.com/v2',
    api_key_env: 'BAIDU_API_KEY',
    default_model: 'ernie-5.0',
    supports_anthropic: false,
    models: [
      { id: 'ernie-5.0', name: 'ERNIE 5.0', type: 'chat', description: '最新原生全模态大模型，128K上下文' },
      { id: 'ernie-4.0-turbo-8k', name: 'ERNIE 4.0 Turbo 8K', type: 'chat', description: '4.0 Turbo版' },
      { id: 'ernie-4.0-turbo-128k', name: 'ERNIE 4.0 Turbo 128K', type: 'chat', description: '4.0 Turbo长上下文' },
      { id: 'ernie-speed-128k', name: 'ERNIE Speed 128K', type: 'chat', description: '极速版 128K' },
      { id: 'ernie-lite-8k', name: 'ERNIE Lite 8K', type: 'chat', description: '轻量版 8K' }
    ],
    features: ['chat', 'vision']
  },

  tencent: {
    id: 'tencent',
    name: '腾讯混元 (Hunyuan)',
    openai_base_url: 'https://hunyuan.tencentcloudapi.com/v1',
    anthropic_base_url: '',
    base_url: 'https://hunyuan.tencentcloudapi.com/v1',
    api_key_env: 'TENCENT_API_KEY',
    default_model: 'hunyuan-pro',
    supports_anthropic: false,
    models: [
      { id: 'hunyuan-pro', name: 'Hunyuan Pro', type: 'chat', description: '旗舰版模型' },
      { id: 'hunyuan-standard', name: 'Hunyuan Standard', type: 'chat', description: '标准版模型' },
      { id: 'hunyuan-lite', name: 'Hunyuan Lite', type: 'chat', description: '轻量版模型' },
      { id: 'hunyuan-vision', name: 'Hunyuan Vision', type: 'vision', description: '多模态视觉模型' }
    ],
    features: ['chat', 'vision']
  },

  ollama: {
    id: 'ollama',
    name: '本地 Ollama',
    openai_base_url: 'http://localhost:11434/v1',
    anthropic_base_url: '',
    base_url: 'http://localhost:11434/v1',
    api_key_env: 'OLLAMA_API_KEY',
    default_model: 'qwen3.5:14b',
    supports_anthropic: false,
    models: [
      { id: 'qwen3.5:14b', name: 'Qwen3.5 14B', type: 'chat', description: '通义千问最新本地版' },
      { id: 'qwen3.5:7b', name: 'Qwen3.5 7B', type: 'chat', description: '通义千问7B' },
      { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B', type: 'chat', description: 'DeepSeek 本地版' },
      { id: 'llama3.3:8b', name: 'Llama 3.3 8B', type: 'chat', description: 'Meta Llama 本地版' },
      { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B', type: 'reasoning', description: '本地推理模型' }
    ],
    features: ['chat', 'local']
  },

  custom: {
    id: 'custom',
    name: '自定义 (双协议兼容)',
    openai_base_url: '',
    anthropic_base_url: '',
    base_url: '',
    api_key_env: '',
    default_model: '',
    is_custom: true,
    supports_anthropic: true,
    models: [],
    features: ['chat']
  }
};

function getAllProviders() {
  return Object.values(MODEL_PRESETS).map(p => ({
    id: p.id,
    name: p.name,
    default_model: p.default_model,
    features: p.features,
    is_custom: !!p.is_custom,
    supports_anthropic: !!p.supports_anthropic,
    is_anthropic_native: !!p.is_anthropic_native,
    model_count: p.models.length
  }));
}

function getProvider(providerId) {
  return MODEL_PRESETS[providerId] || null;
}

function getModelsByProvider(providerId) {
  const provider = MODEL_PRESETS[providerId];
  return provider ? provider.models : [];
}

function getProviderBaseUrl(providerId) {
  const provider = MODEL_PRESETS[providerId];
  return provider ? provider.base_url : null;
}

function getProviderApiKeyEnv(providerId) {
  const provider = MODEL_PRESETS[providerId];
  return provider ? provider.api_key_env : null;
}

function isCustomProvider(providerId) {
  const provider = MODEL_PRESETS[providerId];
  return !!(provider && provider.is_custom);
}

// 根据协议类型获取对应的 base_url
function getBaseUrlByProtocol(providerId, protocol) {
  const provider = MODEL_PRESETS[providerId];
  if (!provider) return null;
  if (protocol === 'anthropic') {
    return provider.anthropic_base_url || provider.base_url;
  }
  return provider.openai_base_url || provider.base_url;
}

module.exports = {
  MODEL_PRESETS,
  getAllProviders,
  getProvider,
  getModelsByProvider,
  getProviderBaseUrl,
  getProviderApiKeyEnv,
  isCustomProvider,
  getBaseUrlByProtocol
};

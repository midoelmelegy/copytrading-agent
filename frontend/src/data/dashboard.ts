export interface VaultAgentSummary {
  id: string;
  name: string;
  model: string;
  modelId: string;
  vaultAddress: `0x${string}`;
  leaderAddress: `0x${string}`;
  logsUrl: string;
  dashboardUrl: string;
  /** If true, this model is not yet live and should be shown as Coming Soon */
  comingSoon?: boolean;
  /** If true, this model is an inverse of the leader */
  inverse?: boolean;
  risk_snapshot: RiskSnapshot;
}

export interface RiskSnapshot {
  copyRatio: number;
  maxLeverage: number;
  maxNotionalUsd: number;
  slippageBps: number;
  refreshAccountIntervalMs: number;
}

export const VAULT_AGENTS: VaultAgentSummary[] = [
  {
    id: "deepseek-chat-v3.1",
    name: "DeepSeek V3.1",
    model: "DeepSeek V3.1",
    modelId: "deepseek-chat-v3.1",
    vaultAddress: "0x07fd993f0fa3a185f7207adccd29f7a87404689d",
    leaderAddress: "0x2b804617c6f63c040377e95bb276811747006f4b",
    logsUrl: "https://userapi-compute.eigencloud.xyz/logs/0x4418BA3C4a1E52BBd8f1133fA136CCED3807c6f9",
    dashboardUrl: "https://nof1.ai/models/deepseek-chat-v3.1",
    risk_snapshot: {
      copyRatio: 1,
      maxLeverage: 10,
      maxNotionalUsd: 1_000_000,
      slippageBps: 25,
      refreshAccountIntervalMs: 60_000,
    }
  },
  {
    id: "qwen3-max",
    name: "Qwen3 Max",
    model: "Qwen3 Max",
    modelId: "qwen3-max",
    vaultAddress: "0xd6e56265890b76413d1d527eb9b75e334c0c5b42",
    leaderAddress: "0x2b804617c6f63c040377e95bb276811747006f4b",
    logsUrl: "https://userapi-compute.eigencloud.xyz/logs/0xfFE88cADD07B343C79d8e617853A1e140c695860",
    dashboardUrl: "https://nof1.ai/models/qwen3-max",
    risk_snapshot: {
      copyRatio: 1,
      maxLeverage: 10,
      maxNotionalUsd: 1_000_000,
      slippageBps: 25,
      refreshAccountIntervalMs: 60_000,
    }
  },
  {
    id: "grok-4",
    name: "Grok 4",
    model: "Grok 4",
    modelId: "grok-4",
    vaultAddress: "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303",
    leaderAddress: "0x677d831aef5328190852e24f13c46cac05f984e7",
    logsUrl: "https://userapi-compute.eigencloud.xyz/logs/0x9abb8630488a02Ec3410C26785f661fa49218140",
    dashboardUrl: "https://nof1.ai/models/grok-4",
    risk_snapshot: {
      copyRatio: 1,
      maxLeverage: 10,
      maxNotionalUsd: 1_000_000,
      slippageBps: 25,
      refreshAccountIntervalMs: 60_000,
    }
  },
  {
    id: "inverse-gpt-5",
    name: "Inverse GPT-5",
    model: "Inverse GPT-5",
    modelId: "gpt-5",
    vaultAddress: "0xba75577c834ed2abacc71ff9d0c18f30e9c34517",
    leaderAddress: "0x67293d914eafb26878534571add81f6bd2d9fe06",
    logsUrl: "https://userapi-compute.eigencloud.xyz/logs/0x0feaA0eb6004972CFAA5Ce99cBa705D283525f95",
    dashboardUrl: "https://nof1.ai/models/gpt-5",
    inverse: true,
    risk_snapshot: {
      copyRatio: 1,
      maxLeverage: 5,
      maxNotionalUsd: 1_000_000,
      slippageBps: 25,
      refreshAccountIntervalMs: 60_000,
    }
  },
  {
    id: "inverse-gemini",
    name: "Inverse Gemini",
    model: "Inverse Gemini 2.5 Pro",
    modelId: "inverse-gemini",
    vaultAddress: "0x4f1a910a1f4396043fced901b5f97e47544bb6c1",
    leaderAddress: "0x1b7a7d099a670256207a30dd0ae13d35f278010f",
    logsUrl: "https://userapi-compute.eigencloud.xyz/logs/0xfeC9Ac284FC46e5e67E69430889B7AAF5BF47C7e",
    dashboardUrl: "https://nof1.ai/models/gemini-2.5-pro",
    inverse: true,
    risk_snapshot: {
      copyRatio: 1,
      maxLeverage: 5,
      maxNotionalUsd: 1_000_000,
      slippageBps: 25,
      refreshAccountIntervalMs: 60_000,
    }
  },
];


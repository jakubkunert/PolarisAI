import {
  UserInput,
  AgentResponse,
  ModelConfig,
  Analysis,
  ActionStep,
  ActionPlan,
  Memory,
  LearningUpdate,
  AgentConfig,
  UserProfile,
  UserPreferences,
  PrivacySettings,
  SubscriptionInfo,
  ChatSession
} from '../types';

/**
 * Creates a UserInput with default values
 */
export const createUserInput = (overrides: Partial<UserInput> = {}): UserInput => ({
  id: `user-input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  content: '',
  timestamp: new Date(),
  type: 'text',
  metadata: {},
  ...overrides
});

/**
 * Creates an AgentResponse with default values
 */
export const createAgentResponse = (overrides: Partial<AgentResponse> = {}): AgentResponse => ({
  id: `agent-response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  agentId: 'default-agent',
  content: '',
  timestamp: new Date(),
  type: 'text',
  confidence: 0.5,
  metadata: {},
  ...overrides
});

/**
 * Creates a ModelConfig with default values
 */
export const createModelConfig = (overrides: Partial<ModelConfig> = {}): ModelConfig => ({
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.9,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  systemPrompt: 'You are a helpful assistant.',
  ...overrides
});

/**
 * Creates an Analysis with default values
 */
export const createAnalysis = (overrides: Partial<Analysis> = {}): Analysis => ({
  intent: 'general',
  confidence: 0.5,
  entities: {},
  context: {},
  previousConversation: [],
  ...overrides
});

/**
 * Creates an ActionStep with default values
 */
export const createActionStep = (overrides: Partial<ActionStep> = {}): ActionStep => ({
  id: `action-step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  action: 'default-action',
  parameters: {},
  dependencies: [],
  estimatedDuration: 1000,
  ...overrides
});

/**
 * Creates an ActionPlan with default values
 */
export const createActionPlan = (overrides: Partial<ActionPlan> = {}): ActionPlan => ({
  id: `action-plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  steps: [],
  estimatedDuration: 1000,
  requiresApproval: false,
  ...overrides
});

/**
 * Creates a Memory with default values
 */
export const createMemory = (overrides: Partial<Memory> = {}): Memory => ({
  id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  content: '',
  timestamp: new Date(),
  importance: 0.5,
  tags: [],
  embedding: undefined,
  ...overrides
});

/**
 * Creates a LearningUpdate with default values
 */
export const createLearningUpdate = (overrides: Partial<LearningUpdate> = {}): LearningUpdate => ({
  patterns: {},
  preferences: {},
  feedback: 'neutral',
  context: 'default',
  ...overrides
});

/**
 * Creates PrivacySettings with default values
 */
export const createPrivacySettings = (overrides: Partial<PrivacySettings> = {}): PrivacySettings => ({
  dataProcessingConsent: false,
  analyticsConsent: false,
  localProcessingOnly: true,
  shareWithAgents: false,
  ...overrides
});

/**
 * Creates UserPreferences with default values
 */
export const createUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  defaultModel: 'gpt-4',
  voiceEnabled: false,
  dataRetention: '30days',
  language: 'en',
  timezone: 'UTC',
  privacySettings: createPrivacySettings(),
  ...overrides
});

/**
 * Creates SubscriptionInfo with default values
 */
export const createSubscriptionInfo = (overrides: Partial<SubscriptionInfo> = {}): SubscriptionInfo => ({
  plan: 'free',
  status: 'active',
  expiresAt: undefined,
  features: [],
  ...overrides
});

/**
 * Creates an AgentConfig with default values
 */
export const createAgentConfig = (overrides: Partial<AgentConfig> = {}): AgentConfig => ({
  id: `agent-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Default Agent',
  description: 'A default agent configuration',
  systemPrompt: 'You are a helpful assistant.',
  modelProvider: 'openai',
  modelConfig: createModelConfig(),
  capabilities: ['question-answering'],
  tools: [],
  isActive: true,
  customSettings: {},
  ...overrides
});

/**
 * Creates a UserProfile with default values
 */
export const createUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  email: 'user@example.com',
  name: 'Test User',
  preferences: createUserPreferences(),
  apiKeys: {},
  agents: [],
  subscription: createSubscriptionInfo(),
  ...overrides
});

/**
 * Creates a ChatSession with default values
 */
export const createChatSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: `chat-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'default-user',
  agentId: 'default-agent',
  messages: [],
  startedAt: new Date(),
  lastActivity: new Date(),
  status: 'active',
  ...overrides
});

/**
 * Validates that a given object matches the expected type structure
 */
export const validateType = <T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: (keyof T)[]
): obj is T => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const typedObj = obj as T;
  return requiredFields.every(field => field in typedObj);
};

/**
 * Creates a deep clone of an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
};

/**
 * Merges two objects deeply
 */
export const deepMerge = <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
  const result = deepClone(target);

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !(sourceValue instanceof Date) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue) &&
        !(targetValue instanceof Date)
      ) {
        result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
};

/**
 * Creates a unique ID
 */
export const createUniqueId = (prefix = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitizes user input to prevent XSS and other security issues
 */
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats a timestamp to ISO string
 */
export const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toISOString();
};

/**
 * Parses a timestamp from ISO string
 */
export const parseTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

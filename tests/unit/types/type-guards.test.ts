import { describe, it, expect } from '@jest/globals';
import {
  UserInput,
  AgentResponse,
  ModelConfig,
  ModelProvider,
  Tool,
  Analysis,
  ActionPlan,
  ActionStep,
  LearningUpdate,
  LongTermMemory,
  Memory,
  TaskPlanner,
  ReasoningAgent,
  AgentConfig,
  UserProfile,
  UserPreferences,
  PrivacySettings,
  SubscriptionInfo,
  ChatSession,
  AgentOrchestrator
} from '@/core/types';

// Type guard functions
export const isUserInput = (obj: unknown): obj is UserInput => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as UserInput).id === 'string' &&
    typeof (obj as UserInput).content === 'string' &&
    (obj as UserInput).timestamp instanceof Date &&
    ['text', 'voice', 'image'].includes((obj as UserInput).type)
  );
};

export const isAgentResponse = (obj: unknown): obj is AgentResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AgentResponse).id === 'string' &&
    typeof (obj as AgentResponse).agentId === 'string' &&
    typeof (obj as AgentResponse).content === 'string' &&
    (obj as AgentResponse).timestamp instanceof Date &&
    ['text', 'voice', 'image', 'action'].includes((obj as AgentResponse).type) &&
    typeof (obj as AgentResponse).confidence === 'number' &&
    (obj as AgentResponse).confidence >= 0 &&
    (obj as AgentResponse).confidence <= 1
  );
};

export const isModelConfig = (obj: unknown): obj is ModelConfig => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ModelConfig).temperature === 'number' &&
    typeof (obj as ModelConfig).maxTokens === 'number' &&
    typeof (obj as ModelConfig).topP === 'number' &&
    typeof (obj as ModelConfig).frequencyPenalty === 'number' &&
    typeof (obj as ModelConfig).presencePenalty === 'number'
  );
};

export const isModelProvider = (obj: unknown): obj is ModelProvider => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ModelProvider).id === 'string' &&
    typeof (obj as ModelProvider).name === 'string' &&
    ['local', 'remote'].includes((obj as ModelProvider).type) &&
    typeof (obj as ModelProvider).authenticate === 'function' &&
    typeof (obj as ModelProvider).generateResponse === 'function' &&
    typeof (obj as ModelProvider).streamResponse === 'function' &&
    typeof (obj as ModelProvider).isAvailable === 'function' &&
    typeof (obj as ModelProvider).getStatus === 'function'
  );
};

export const isTool = (obj: unknown): obj is Tool => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Tool).id === 'string' &&
    typeof (obj as Tool).name === 'string' &&
    typeof (obj as Tool).description === 'string' &&
    typeof (obj as Tool).parameters === 'object' &&
    (obj as Tool).parameters !== null &&
    typeof (obj as Tool).execute === 'function'
  );
};

export const isAnalysis = (obj: unknown): obj is Analysis => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Analysis).intent === 'string' &&
    typeof (obj as Analysis).confidence === 'number' &&
    (obj as Analysis).confidence >= 0 &&
    (obj as Analysis).confidence <= 1 &&
    typeof (obj as Analysis).entities === 'object' &&
    (obj as Analysis).entities !== null &&
    typeof (obj as Analysis).context === 'object' &&
    (obj as Analysis).context !== null
  );
};

export const isActionStep = (obj: unknown): obj is ActionStep => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ActionStep).id === 'string' &&
    typeof (obj as ActionStep).action === 'string' &&
    typeof (obj as ActionStep).parameters === 'object' &&
    (obj as ActionStep).parameters !== null &&
    Array.isArray((obj as ActionStep).dependencies) &&
    typeof (obj as ActionStep).estimatedDuration === 'number'
  );
};

export const isActionPlan = (obj: unknown): obj is ActionPlan => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as ActionPlan).id === 'string' &&
    Array.isArray((obj as ActionPlan).steps) &&
    (obj as ActionPlan).steps.every(isActionStep) &&
    typeof (obj as ActionPlan).estimatedDuration === 'number' &&
    typeof (obj as ActionPlan).requiresApproval === 'boolean'
  );
};

export const isMemory = (obj: unknown): obj is Memory => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Memory).id === 'string' &&
    typeof (obj as Memory).content === 'string' &&
    (obj as Memory).timestamp instanceof Date &&
    typeof (obj as Memory).importance === 'number' &&
    Array.isArray((obj as Memory).tags) &&
    (obj as Memory).tags.every(tag => typeof tag === 'string')
  );
};

export const isLearningUpdate = (obj: unknown): obj is LearningUpdate => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as LearningUpdate).patterns === 'object' &&
    (obj as LearningUpdate).patterns !== null &&
    typeof (obj as LearningUpdate).preferences === 'object' &&
    (obj as LearningUpdate).preferences !== null &&
    ['positive', 'negative', 'neutral'].includes((obj as LearningUpdate).feedback) &&
    typeof (obj as LearningUpdate).context === 'string'
  );
};

export const isSubscriptionInfo = (obj: unknown): obj is SubscriptionInfo => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ['free', 'basic', 'premium'].includes((obj as SubscriptionInfo).plan) &&
    ['active', 'cancelled', 'expired'].includes((obj as SubscriptionInfo).status) &&
    Array.isArray((obj as SubscriptionInfo).features) &&
    (obj as SubscriptionInfo).features.every(feature => typeof feature === 'string')
  );
};

describe('Type Guards', () => {
  describe('isUserInput', () => {
    it('should return true for valid UserInput', () => {
      const validInput: UserInput = {
        id: 'test-id',
        content: 'Hello world',
        timestamp: new Date(),
        type: 'text',
        metadata: { test: 'value' }
      };

      expect(isUserInput(validInput)).toBe(true);
    });

    it('should return false for invalid UserInput', () => {
      const invalidInput = {
        id: 'test-id',
        content: 'Hello world',
        timestamp: 'not-a-date',
        type: 'text'
      };

      expect(isUserInput(invalidInput)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isUserInput(null)).toBe(false);
      expect(isUserInput(undefined)).toBe(false);
    });

    it('should return false for invalid type', () => {
      const invalidInput = {
        id: 'test-id',
        content: 'Hello world',
        timestamp: new Date(),
        type: 'invalid-type'
      };

      expect(isUserInput(invalidInput)).toBe(false);
    });
  });

  describe('isAgentResponse', () => {
    it('should return true for valid AgentResponse', () => {
      const validResponse: AgentResponse = {
        id: 'response-id',
        agentId: 'agent-id',
        content: 'Hello back',
        timestamp: new Date(),
        type: 'text',
        confidence: 0.85,
        metadata: { test: 'value' },
        reasoning: 'Test reasoning'
      };

      expect(isAgentResponse(validResponse)).toBe(true);
    });

    it('should return false for invalid confidence values', () => {
      const invalidResponse = {
        id: 'response-id',
        agentId: 'agent-id',
        content: 'Hello back',
        timestamp: new Date(),
        type: 'text',
        confidence: 1.5
      };

      expect(isAgentResponse(invalidResponse)).toBe(false);
    });

    it('should return false for invalid type', () => {
      const invalidResponse = {
        id: 'response-id',
        agentId: 'agent-id',
        content: 'Hello back',
        timestamp: new Date(),
        type: 'invalid-type',
        confidence: 0.85
      };

      expect(isAgentResponse(invalidResponse)).toBe(false);
    });
  });

  describe('isModelConfig', () => {
    it('should return true for valid ModelConfig', () => {
      const validConfig: ModelConfig = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2,
        systemPrompt: 'Test prompt'
      };

      expect(isModelConfig(validConfig)).toBe(true);
    });

    it('should return false for missing required fields', () => {
      const invalidConfig = {
        temperature: 0.7,
        maxTokens: 1000
        // Missing required fields
      };

      expect(isModelConfig(invalidConfig)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      const invalidConfig = {
        temperature: 'not-a-number',
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2
      };

      expect(isModelConfig(invalidConfig)).toBe(false);
    });
  });

  describe('isModelProvider', () => {
    it('should return true for valid ModelProvider', () => {
      const validProvider: ModelProvider = {
        id: 'test-provider',
        name: 'Test Provider',
        type: 'remote',
        authenticate: async () => true,
        generateResponse: async () => 'response',
        streamResponse: async function* () { yield 'chunk'; },
        isAvailable: async () => true,
        getStatus: () => ({ authenticated: true, available: true, id: 'test', name: 'Test' })
      };

      expect(isModelProvider(validProvider)).toBe(true);
    });

    it('should return false for invalid type', () => {
      const invalidProvider = {
        id: 'test-provider',
        name: 'Test Provider',
        type: 'invalid-type',
        authenticate: async () => true,
        generateResponse: async () => 'response',
        streamResponse: async function* () { yield 'chunk'; },
        isAvailable: async () => true,
        getStatus: () => ({ authenticated: true, available: true, id: 'test', name: 'Test' })
      };

      expect(isModelProvider(invalidProvider)).toBe(false);
    });
  });

  describe('isTool', () => {
    it('should return true for valid Tool', () => {
      const validTool: Tool = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool',
        parameters: { param1: 'value1' },
        execute: async () => ({ result: 'success' })
      };

      expect(isTool(validTool)).toBe(true);
    });

    it('should return false for missing execute function', () => {
      const invalidTool = {
        id: 'test-tool',
        name: 'Test Tool',
        description: 'A test tool',
        parameters: { param1: 'value1' }
        // Missing execute function
      };

      expect(isTool(invalidTool)).toBe(false);
    });
  });

  describe('isAnalysis', () => {
    it('should return true for valid Analysis', () => {
      const validAnalysis: Analysis = {
        intent: 'test-intent',
        confidence: 0.85,
        entities: { entity1: 'value1' },
        context: { context1: 'value1' },
        previousConversation: ['msg1', 'msg2']
      };

      expect(isAnalysis(validAnalysis)).toBe(true);
    });

    it('should return false for invalid confidence range', () => {
      const invalidAnalysis = {
        intent: 'test-intent',
        confidence: 1.5,
        entities: { entity1: 'value1' },
        context: { context1: 'value1' }
      };

      expect(isAnalysis(invalidAnalysis)).toBe(false);
    });
  });

  describe('isActionStep', () => {
    it('should return true for valid ActionStep', () => {
      const validStep: ActionStep = {
        id: 'step-1',
        action: 'test-action',
        parameters: { param1: 'value1' },
        dependencies: ['dep1', 'dep2'],
        estimatedDuration: 1000
      };

      expect(isActionStep(validStep)).toBe(true);
    });

    it('should return false for invalid dependencies', () => {
      const invalidStep = {
        id: 'step-1',
        action: 'test-action',
        parameters: { param1: 'value1' },
        dependencies: 'not-an-array',
        estimatedDuration: 1000
      };

      expect(isActionStep(invalidStep)).toBe(false);
    });
  });

  describe('isActionPlan', () => {
    it('should return true for valid ActionPlan', () => {
      const validStep: ActionStep = {
        id: 'step-1',
        action: 'test-action',
        parameters: { param1: 'value1' },
        dependencies: [],
        estimatedDuration: 1000
      };

      const validPlan: ActionPlan = {
        id: 'plan-1',
        steps: [validStep],
        estimatedDuration: 1000,
        requiresApproval: false
      };

      expect(isActionPlan(validPlan)).toBe(true);
    });

    it('should return false for invalid steps', () => {
      const invalidPlan = {
        id: 'plan-1',
        steps: [{ invalid: 'step' }],
        estimatedDuration: 1000,
        requiresApproval: false
      };

      expect(isActionPlan(invalidPlan)).toBe(false);
    });
  });

  describe('isMemory', () => {
    it('should return true for valid Memory', () => {
      const validMemory: Memory = {
        id: 'memory-1',
        content: 'Test memory content',
        timestamp: new Date(),
        importance: 0.8,
        tags: ['tag1', 'tag2'],
        embedding: [0.1, 0.2, 0.3]
      };

      expect(isMemory(validMemory)).toBe(true);
    });

    it('should return false for invalid tags', () => {
      const invalidMemory = {
        id: 'memory-1',
        content: 'Test memory content',
        timestamp: new Date(),
        importance: 0.8,
        tags: ['tag1', 123, 'tag2']
      };

      expect(isMemory(invalidMemory)).toBe(false);
    });
  });

  describe('isLearningUpdate', () => {
    it('should return true for valid LearningUpdate', () => {
      const validUpdate: LearningUpdate = {
        patterns: { pattern1: 'value1' },
        preferences: { pref1: 'value1' },
        feedback: 'positive',
        context: 'test-context'
      };

      expect(isLearningUpdate(validUpdate)).toBe(true);
    });

    it('should return false for invalid feedback', () => {
      const invalidUpdate = {
        patterns: { pattern1: 'value1' },
        preferences: { pref1: 'value1' },
        feedback: 'invalid-feedback',
        context: 'test-context'
      };

      expect(isLearningUpdate(invalidUpdate)).toBe(false);
    });
  });

  describe('isSubscriptionInfo', () => {
    it('should return true for valid SubscriptionInfo', () => {
      const validSubscription: SubscriptionInfo = {
        plan: 'premium',
        status: 'active',
        expiresAt: new Date(),
        features: ['feature1', 'feature2']
      };

      expect(isSubscriptionInfo(validSubscription)).toBe(true);
    });

    it('should return false for invalid plan', () => {
      const invalidSubscription = {
        plan: 'invalid-plan',
        status: 'active',
        features: ['feature1', 'feature2']
      };

      expect(isSubscriptionInfo(invalidSubscription)).toBe(false);
    });

    it('should return false for invalid status', () => {
      const invalidSubscription = {
        plan: 'premium',
        status: 'invalid-status',
        features: ['feature1', 'feature2']
      };

      expect(isSubscriptionInfo(invalidSubscription)).toBe(false);
    });
  });
});

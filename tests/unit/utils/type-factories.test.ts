import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createUserInput,
  createAgentResponse,
  createModelConfig,
  createAnalysis,
  createActionStep,
  createActionPlan,
  createMemory,
  createLearningUpdate,
  createPrivacySettings,
  createUserPreferences,
  createSubscriptionInfo,
  createAgentConfig,
  createUserProfile,
  createChatSession,
  validateType,
  deepClone,
  deepMerge,
  createUniqueId,
  sanitizeUserInput,
  isValidEmail,
  formatTimestamp,
  parseTimestamp
} from '@/core/utils/type-factories';
import {
  UserInput,
  AgentResponse,
  ModelConfig,
  Analysis,
  ActionStep,
  ActionPlan,
  Memory,
  LearningUpdate,
  PrivacySettings,
  UserPreferences,
  SubscriptionInfo,
  AgentConfig,
  UserProfile,
  ChatSession
} from '@/core/types';

// Skip Date.now mocking for Bun test compatibility

describe('Type Factory Functions', () => {
  describe('createUserInput', () => {
    it('should create a UserInput with default values', () => {
      const input = createUserInput();

      expect(input.id).toMatch(/^user-input-/);
      expect(input.content).toBe('');
      expect(input.timestamp).toBeInstanceOf(Date);
      expect(input.type).toBe('text');
      expect(input.metadata).toEqual({});
    });

    it('should accept overrides', () => {
      const overrides: Partial<UserInput> = {
        content: 'Hello world',
        type: 'voice',
        metadata: { test: 'value' }
      };
      const input = createUserInput(overrides);

      expect(input.content).toBe('Hello world');
      expect(input.type).toBe('voice');
      expect(input.metadata).toEqual({ test: 'value' });
    });

    it('should generate unique IDs', () => {
      const input1 = createUserInput();
      const input2 = createUserInput();

      expect(input1.id).not.toBe(input2.id);
    });
  });

  describe('createAgentResponse', () => {
    it('should create an AgentResponse with default values', () => {
      const response = createAgentResponse();

      expect(response.id).toMatch(/^agent-response-/);
      expect(response.agentId).toBe('default-agent');
      expect(response.content).toBe('');
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.type).toBe('text');
      expect(response.confidence).toBe(0.5);
      expect(response.metadata).toEqual({});
    });

    it('should accept overrides', () => {
      const overrides: Partial<AgentResponse> = {
        agentId: 'custom-agent',
        content: 'Response content',
        confidence: 0.9,
        reasoning: 'Test reasoning'
      };
      const response = createAgentResponse(overrides);

      expect(response.agentId).toBe('custom-agent');
      expect(response.content).toBe('Response content');
      expect(response.confidence).toBe(0.9);
      expect(response.reasoning).toBe('Test reasoning');
    });
  });

  describe('createModelConfig', () => {
    it('should create a ModelConfig with default values', () => {
      const config = createModelConfig();

      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(1000);
      expect(config.topP).toBe(0.9);
      expect(config.frequencyPenalty).toBe(0.0);
      expect(config.presencePenalty).toBe(0.0);
      expect(config.systemPrompt).toBe('You are a helpful assistant.');
    });

    it('should accept overrides', () => {
      const overrides: Partial<ModelConfig> = {
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: 'Custom prompt'
      };
      const config = createModelConfig(overrides);

      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(2000);
      expect(config.systemPrompt).toBe('Custom prompt');
    });
  });

  describe('createAnalysis', () => {
    it('should create an Analysis with default values', () => {
      const analysis = createAnalysis();

      expect(analysis.intent).toBe('general');
      expect(analysis.confidence).toBe(0.5);
      expect(analysis.entities).toEqual({});
      expect(analysis.context).toEqual({});
      expect(analysis.previousConversation).toEqual([]);
    });

    it('should accept overrides', () => {
      const overrides: Partial<Analysis> = {
        intent: 'specific-intent',
        confidence: 0.8,
        entities: { entity1: 'value1' },
        context: { context1: 'value1' }
      };
      const analysis = createAnalysis(overrides);

      expect(analysis.intent).toBe('specific-intent');
      expect(analysis.confidence).toBe(0.8);
      expect(analysis.entities).toEqual({ entity1: 'value1' });
      expect(analysis.context).toEqual({ context1: 'value1' });
    });
  });

  describe('createActionStep', () => {
    it('should create an ActionStep with default values', () => {
      const step = createActionStep();

      expect(step.id).toMatch(/^action-step-/);
      expect(step.action).toBe('default-action');
      expect(step.parameters).toEqual({});
      expect(step.dependencies).toEqual([]);
      expect(step.estimatedDuration).toBe(1000);
    });

    it('should accept overrides', () => {
      const overrides: Partial<ActionStep> = {
        action: 'custom-action',
        parameters: { param1: 'value1' },
        dependencies: ['dep1', 'dep2'],
        estimatedDuration: 2000
      };
      const step = createActionStep(overrides);

      expect(step.action).toBe('custom-action');
      expect(step.parameters).toEqual({ param1: 'value1' });
      expect(step.dependencies).toEqual(['dep1', 'dep2']);
      expect(step.estimatedDuration).toBe(2000);
    });
  });

  describe('createActionPlan', () => {
    it('should create an ActionPlan with default values', () => {
      const plan = createActionPlan();

      expect(plan.id).toMatch(/^action-plan-/);
      expect(plan.steps).toEqual([]);
      expect(plan.estimatedDuration).toBe(1000);
      expect(plan.requiresApproval).toBe(false);
    });

    it('should accept overrides', () => {
      const step = createActionStep();
      const overrides: Partial<ActionPlan> = {
        steps: [step],
        estimatedDuration: 5000,
        requiresApproval: true
      };
      const plan = createActionPlan(overrides);

      expect(plan.steps).toHaveLength(1);
      expect(plan.estimatedDuration).toBe(5000);
      expect(plan.requiresApproval).toBe(true);
    });
  });

  describe('createMemory', () => {
    it('should create a Memory with default values', () => {
      const memory = createMemory();

      expect(memory.id).toMatch(/^memory-/);
      expect(memory.content).toBe('');
      expect(memory.timestamp).toBeInstanceOf(Date);
      expect(memory.importance).toBe(0.5);
      expect(memory.tags).toEqual([]);
      expect(memory.embedding).toBeUndefined();
    });

    it('should accept overrides', () => {
      const overrides: Partial<Memory> = {
        content: 'Test memory',
        importance: 0.9,
        tags: ['tag1', 'tag2'],
        embedding: [0.1, 0.2, 0.3]
      };
      const memory = createMemory(overrides);

      expect(memory.content).toBe('Test memory');
      expect(memory.importance).toBe(0.9);
      expect(memory.tags).toEqual(['tag1', 'tag2']);
      expect(memory.embedding).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('createLearningUpdate', () => {
    it('should create a LearningUpdate with default values', () => {
      const update = createLearningUpdate();

      expect(update.patterns).toEqual({});
      expect(update.preferences).toEqual({});
      expect(update.feedback).toBe('neutral');
      expect(update.context).toBe('default');
    });

    it('should accept overrides', () => {
      const overrides: Partial<LearningUpdate> = {
        patterns: { pattern1: 'value1' },
        preferences: { pref1: 'value1' },
        feedback: 'positive',
        context: 'custom-context'
      };
      const update = createLearningUpdate(overrides);

      expect(update.patterns).toEqual({ pattern1: 'value1' });
      expect(update.preferences).toEqual({ pref1: 'value1' });
      expect(update.feedback).toBe('positive');
      expect(update.context).toBe('custom-context');
    });
  });

  describe('createPrivacySettings', () => {
    it('should create PrivacySettings with default values', () => {
      const settings = createPrivacySettings();

      expect(settings.dataProcessingConsent).toBe(false);
      expect(settings.analyticsConsent).toBe(false);
      expect(settings.localProcessingOnly).toBe(true);
      expect(settings.shareWithAgents).toBe(false);
    });

    it('should accept overrides', () => {
      const overrides: Partial<PrivacySettings> = {
        dataProcessingConsent: true,
        analyticsConsent: true,
        localProcessingOnly: false,
        shareWithAgents: true
      };
      const settings = createPrivacySettings(overrides);

      expect(settings.dataProcessingConsent).toBe(true);
      expect(settings.analyticsConsent).toBe(true);
      expect(settings.localProcessingOnly).toBe(false);
      expect(settings.shareWithAgents).toBe(true);
    });
  });

  describe('createUserPreferences', () => {
    it('should create UserPreferences with default values', () => {
      const preferences = createUserPreferences();

      expect(preferences.defaultModel).toBe('gpt-4');
      expect(preferences.voiceEnabled).toBe(false);
      expect(preferences.dataRetention).toBe('30days');
      expect(preferences.language).toBe('en');
      expect(preferences.timezone).toBe('UTC');
      expect(preferences.privacySettings).toBeDefined();
    });

    it('should accept overrides', () => {
      const overrides: Partial<UserPreferences> = {
        defaultModel: 'gpt-3.5',
        voiceEnabled: true,
        language: 'es',
        timezone: 'EST'
      };
      const preferences = createUserPreferences(overrides);

      expect(preferences.defaultModel).toBe('gpt-3.5');
      expect(preferences.voiceEnabled).toBe(true);
      expect(preferences.language).toBe('es');
      expect(preferences.timezone).toBe('EST');
    });
  });

  describe('createSubscriptionInfo', () => {
    it('should create SubscriptionInfo with default values', () => {
      const subscription = createSubscriptionInfo();

      expect(subscription.plan).toBe('free');
      expect(subscription.status).toBe('active');
      expect(subscription.expiresAt).toBeUndefined();
      expect(subscription.features).toEqual([]);
    });

    it('should accept overrides', () => {
      const expiresAt = new Date('2024-01-01');
      const overrides: Partial<SubscriptionInfo> = {
        plan: 'premium',
        status: 'active',
        expiresAt,
        features: ['feature1', 'feature2']
      };
      const subscription = createSubscriptionInfo(overrides);

      expect(subscription.plan).toBe('premium');
      expect(subscription.status).toBe('active');
      expect(subscription.expiresAt).toBe(expiresAt);
      expect(subscription.features).toEqual(['feature1', 'feature2']);
    });
  });

  describe('createAgentConfig', () => {
    it('should create AgentConfig with default values', () => {
      const config = createAgentConfig();

      expect(config.id).toMatch(/^agent-config-/);
      expect(config.name).toBe('Default Agent');
      expect(config.description).toBe('A default agent configuration');
      expect(config.systemPrompt).toBe('You are a helpful assistant.');
      expect(config.modelProvider).toBe('openai');
      expect(config.modelConfig).toBeDefined();
      expect(config.capabilities).toEqual(['question-answering']);
      expect(config.tools).toEqual([]);
      expect(config.isActive).toBe(true);
      expect(config.customSettings).toEqual({});
    });

    it('should accept overrides', () => {
      const customModelConfig = createModelConfig({ temperature: 0.3 });
      const overrides: Partial<AgentConfig> = {
        name: 'Custom Agent',
        description: 'A custom agent',
        modelProvider: 'ollama',
        modelConfig: customModelConfig,
        capabilities: ['custom-capability'],
        tools: ['tool1', 'tool2'],
        isActive: false
      };
      const config = createAgentConfig(overrides);

      expect(config.name).toBe('Custom Agent');
      expect(config.description).toBe('A custom agent');
      expect(config.modelProvider).toBe('ollama');
      expect(config.modelConfig.temperature).toBe(0.3);
      expect(config.capabilities).toEqual(['custom-capability']);
      expect(config.tools).toEqual(['tool1', 'tool2']);
      expect(config.isActive).toBe(false);
    });
  });

  describe('createUserProfile', () => {
    it('should create UserProfile with default values', () => {
      const profile = createUserProfile();

      expect(profile.id).toMatch(/^user-/);
      expect(profile.email).toBe('user@example.com');
      expect(profile.name).toBe('Test User');
      expect(profile.preferences).toBeDefined();
      expect(profile.apiKeys).toEqual({});
      expect(profile.agents).toEqual([]);
      expect(profile.subscription).toBeDefined();
    });

    it('should accept overrides', () => {
      const customPreferences = createUserPreferences({ language: 'fr' });
      const overrides: Partial<UserProfile> = {
        email: 'custom@example.com',
        name: 'Custom User',
        preferences: customPreferences,
        apiKeys: { openai: 'sk-123' },
        agents: [createAgentConfig()]
      };
      const profile = createUserProfile(overrides);

      expect(profile.email).toBe('custom@example.com');
      expect(profile.name).toBe('Custom User');
      expect(profile.preferences.language).toBe('fr');
      expect(profile.apiKeys).toEqual({ openai: 'sk-123' });
      expect(profile.agents).toHaveLength(1);
    });
  });

  describe('createChatSession', () => {
    it('should create ChatSession with default values', () => {
      const session = createChatSession();

      expect(session.id).toMatch(/^chat-session-/);
      expect(session.userId).toBe('default-user');
      expect(session.agentId).toBe('default-agent');
      expect(session.messages).toEqual([]);
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(session.status).toBe('active');
    });

    it('should accept overrides', () => {
      const userInput = createUserInput();
      const agentResponse = createAgentResponse();
      const overrides: Partial<ChatSession> = {
        userId: 'custom-user',
        agentId: 'custom-agent',
        messages: [userInput, agentResponse],
        status: 'completed'
      };
      const session = createChatSession(overrides);

      expect(session.userId).toBe('custom-user');
      expect(session.agentId).toBe('custom-agent');
      expect(session.messages).toHaveLength(2);
      expect(session.status).toBe('completed');
    });
  });
});

describe('Utility Functions', () => {
  describe('validateType', () => {
    it('should return true for valid object with required fields', () => {
      const obj = { field1: 'value1', field2: 'value2', field3: 'value3' };
      const requiredFields = ['field1', 'field2'];

      expect(validateType(obj, requiredFields)).toBe(true);
    });

    it('should return false for object missing required fields', () => {
      const obj = { field1: 'value1' };
      const requiredFields = ['field1', 'field2'];

      expect(validateType(obj, requiredFields)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(validateType(null, ['field1'])).toBe(false);
      expect(validateType(undefined, ['field1'])).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(validateType('string', ['field1'])).toBe(false);
      expect(validateType(123, ['field1'])).toBe(false);
      expect(validateType(true, ['field1'])).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should clone Date objects', () => {
      const date = new Date('2023-01-01');
      const cloned = deepClone(date);

      expect(cloned).toBeInstanceOf(Date);
      expect(cloned.getTime()).toBe(date.getTime());
      expect(cloned).not.toBe(date);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should handle nested structures', () => {
      const complex = {
        arr: [1, { nested: true }],
        date: new Date('2023-01-01'),
        obj: { deep: { value: 'test' } }
      };
      const cloned = deepClone(complex);

      expect(cloned).toEqual(complex);
      expect(cloned).not.toBe(complex);
      expect(cloned.arr).not.toBe(complex.arr);
      expect(cloned.date).not.toBe(complex.date);
      expect(cloned.obj.deep).not.toBe(complex.obj.deep);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source: Partial<typeof target> = { b: { c: 4 }, e: 5 } as any;
      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: { c: 4, d: 3 }, e: 5 });
      expect(result).not.toBe(target);
    });

    it('should handle arrays', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };
      const result = deepMerge(target, source);

      expect(result.arr).toEqual([4, 5]);
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');
      const target = { date: date1 };
      const source = { date: date2 };
      const result = deepMerge(target, source);

      expect(result.date).toBe(date2);
    });

        it('should not modify original objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source: Partial<typeof target> = { b: { d: 3 } } as any;
      const originalTarget = deepClone(target);

      deepMerge(target, source);

      expect(target).toEqual(originalTarget);
    });
  });

  describe('createUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = createUniqueId();
      const id2 = createUniqueId();

      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = createUniqueId();
      expect(id).toMatch(/^id-/);
    });

    it('should use custom prefix', () => {
      const id = createUniqueId('custom');
      expect(id).toMatch(/^custom-/);
    });

        it('should include timestamp and random parts', () => {
      const id = createUniqueId('test');
      const parts = id.split('-');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('test');
      expect(parts[1]).toMatch(/^\d+$/); // Should be a timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should remove HTML brackets', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeUserInput(input);

      expect(sanitized).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = sanitizeUserInput(input);

      expect(sanitized).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss") onmouseover=alert("xss")';
      const sanitized = sanitizeUserInput(input);

      expect(sanitized).toBe('alert("xss") alert("xss")');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const sanitized = sanitizeUserInput(input);

      expect(sanitized).toBe('hello world');
    });

    it('should handle empty string', () => {
      const sanitized = sanitizeUserInput('');
      expect(sanitized).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('user name@domain.com')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to ISO string', () => {
      const date = new Date('2023-01-01T12:34:56.789Z');
      const formatted = formatTimestamp(date);

      expect(formatted).toBe('2023-01-01T12:34:56.789Z');
    });

    it('should handle different timezones', () => {
      const date = new Date('2023-01-01T12:34:56.789Z');
      const formatted = formatTimestamp(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('parseTimestamp', () => {
    it('should parse ISO string to Date', () => {
      const isoString = '2023-01-01T12:34:56.789Z';
      const parsed = parseTimestamp(isoString);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(isoString);
    });

    it('should handle invalid date strings', () => {
      const parsed = parseTimestamp('invalid-date');

      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed.getTime())).toBe(true);
    });

    it('should handle various date formats', () => {
      const formats = [
        '2023-01-01',
        '2023/01/01',
        'January 1, 2023',
        '2023-01-01T12:34:56Z'
      ];

      formats.forEach(format => {
        const parsed = parseTimestamp(format);
        expect(parsed).toBeInstanceOf(Date);
      });
    });
  });
});

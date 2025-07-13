import { ModelManager } from '@/core/models/model-manager';
import { MockModelProvider, createMockModelConfig } from '../../utils/mocks';
import { mockFetch, mockFetchError } from '../../utils/mocks';

describe('ModelManager', () => {
  let manager: ModelManager;
  let mockProvider1: MockModelProvider;
  let mockProvider2: MockModelProvider;

  beforeEach(() => {
    manager = new ModelManager();
    mockProvider1 = new MockModelProvider('mock-1', 'Mock Provider 1');
    mockProvider2 = new MockModelProvider('mock-2', 'Mock Provider 2');
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with built-in providers', () => {
      const providers = manager.getProviders();

      expect(providers).toHaveLength(2);
      expect(providers.some(p => p.id === 'openai')).toBe(true);
      expect(providers.some(p => p.id === 'ollama')).toBe(true);
    });

    it('should set default provider', () => {
      const defaultProvider = manager.getDefaultProvider();

      expect(defaultProvider).toBeDefined();
      expect(defaultProvider?.id).toBe('openai');
    });
  });

  describe('Provider Registration', () => {
    it('should register new provider', () => {
      manager.registerProvider(mockProvider1);

      const provider = manager.getProvider('mock-1');
      expect(provider).toBe(mockProvider1);
    });

    it('should add to providers list', () => {
      const initialCount = manager.getProviders().length;
      manager.registerProvider(mockProvider1);

      expect(manager.getProviders()).toHaveLength(initialCount + 1);
    });

    it('should replace existing provider with same id', () => {
      manager.registerProvider(mockProvider1);

      const newProvider = new MockModelProvider('mock-1', 'New Mock Provider');
      manager.registerProvider(newProvider);

      const retrievedProvider = manager.getProvider('mock-1');
      expect(retrievedProvider).toBe(newProvider);
      expect(retrievedProvider?.name).toBe('New Mock Provider');
    });

    it('should set first registered provider as default if none exists', () => {
      // Create a fresh manager without built-in providers
      const freshManager = new (class extends ModelManager {
        constructor() {
          super();
          // Clear the providers map to simulate empty state
          (this as any).providers.clear();
          (this as any).defaultProvider = undefined;
        }
      })();

      freshManager.registerProvider(mockProvider1);

      const defaultProvider = freshManager.getDefaultProvider();
      expect(defaultProvider).toBe(mockProvider1);
    });
  });

  describe('Provider Retrieval', () => {
    beforeEach(() => {
      manager.registerProvider(mockProvider1);
      manager.registerProvider(mockProvider2);
    });

    it('should get provider by id', () => {
      const provider = manager.getProvider('mock-1');
      expect(provider).toBe(mockProvider1);
    });

    it('should return undefined for non-existent provider', () => {
      const provider = manager.getProvider('non-existent');
      expect(provider).toBeUndefined();
    });

    it('should get all providers', () => {
      const providers = manager.getProviders();

      expect(providers).toContain(mockProvider1);
      expect(providers).toContain(mockProvider2);
    });

    it('should get available providers', () => {
      const providers = manager.getAvailableProviders();

      // Should include both local and remote providers
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.every(p => p.type === 'local' || p.type === 'remote')).toBe(true);
    });
  });

  describe('Provider Authentication', () => {
    beforeEach(() => {
      manager.registerProvider(mockProvider1);
      manager.registerProvider(mockProvider2);
    });

    it('should authenticate provider successfully', async () => {
      const result = await manager.authenticateProvider('mock-1', 'test-key');

      expect(result).toBe(true);
      expect(mockProvider1.getStatus().authenticated).toBe(true);
    });

    it('should fail authentication for non-existent provider', async () => {
      const result = await manager.authenticateProvider('non-existent', 'test-key');

      expect(result).toBe(false);
    });

    it('should get authenticated providers', async () => {
      await manager.authenticateProvider('mock-1', 'test-key');
      mockProvider2.setAuthenticated(false);

      const authenticated = await manager.getAuthenticatedProviders();

      expect(authenticated).toContain(mockProvider1);
      expect(authenticated).not.toContain(mockProvider2);
    });

    it('should handle authentication errors gracefully', async () => {
      mockProvider1.setAvailability(false);

      const result = await manager.authenticateProvider('mock-1', 'test-key');

      expect(result).toBe(false);
    });
  });

  describe('Response Generation', () => {
    beforeEach(async () => {
      manager.registerProvider(mockProvider1);
      await manager.authenticateProvider('mock-1', 'test-key');
    });

    it('should generate response using specified provider', async () => {
      mockProvider1.setResponses(['Test response']);

      const config = createMockModelConfig();
      const result = await manager.generateResponse('mock-1', 'Test prompt', config);

      expect(result).toBe('Test response');
      expect(mockProvider1.getCallCount()).toBe(1);
    });

    it('should throw error for non-existent provider', async () => {
      const config = createMockModelConfig();

      await expect(
        manager.generateResponse('non-existent', 'Test prompt', config)
      ).rejects.toThrow('Provider not found');
    });

    it('should throw error for unauthenticated provider', async () => {
      manager.registerProvider(mockProvider2);

      const config = createMockModelConfig();

      await expect(
        manager.generateResponse('mock-2', 'Test prompt', config)
      ).rejects.toThrow('Provider not authenticated');
    });

    it('should validate model configuration', async () => {
      const invalidConfig = createMockModelConfig({ temperature: 2.5 });

      await expect(
        manager.generateResponse('mock-1', 'Test prompt', invalidConfig)
      ).rejects.toThrow('Invalid model configuration');
    });
  });

  describe('Streaming Response', () => {
    beforeEach(async () => {
      manager.registerProvider(mockProvider1);
      await manager.authenticateProvider('mock-1', 'test-key');
    });

    it('should stream response using specified provider', async () => {
      const config = createMockModelConfig();
      const stream = await manager.streamResponse('mock-1', 'Test prompt', config);

      expect(stream).toBeDefined();

      // Test that we can iterate over the stream
      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
        break; // Just test first chunk
      }

      expect(chunks.length).toBe(1);
    });

    it('should throw error for non-existent provider', async () => {
      const config = createMockModelConfig();

      await expect(
        manager.streamResponse('non-existent', 'Test prompt', config)
      ).rejects.toThrow('Provider not found');
    });
  });

  describe('Best Available Provider', () => {
    beforeEach(() => {
      manager.registerProvider(mockProvider1);
      manager.registerProvider(mockProvider2);
    });

    it('should return authenticated provider when available', async () => {
      await manager.authenticateProvider('mock-1', 'test-key');

      const provider = await manager.getBestAvailableProvider();

      expect(provider).toBe(mockProvider1);
    });

    it('should return available provider when no authenticated providers', async () => {
      mockProvider1.setAvailability(true);
      mockProvider2.setAvailability(false);

      const provider = await manager.getBestAvailableProvider();

      expect(provider).toBe(mockProvider1);
    });

    it('should return null when no providers available', async () => {
      mockProvider1.setAvailability(false);
      mockProvider2.setAvailability(false);

      const provider = await manager.getBestAvailableProvider();

      expect(provider).toBeNull();
    });

    it('should prefer authenticated over non-authenticated', async () => {
      await manager.authenticateProvider('mock-2', 'test-key');

      const provider = await manager.getBestAvailableProvider();

      expect(provider).toBe(mockProvider2);
    });
  });

  describe('Default Provider Management', () => {
    beforeEach(() => {
      manager.registerProvider(mockProvider1);
      manager.registerProvider(mockProvider2);
    });

    it('should set default provider', () => {
      manager.setDefaultProvider('mock-1');

      const defaultProvider = manager.getDefaultProvider();
      expect(defaultProvider).toBe(mockProvider1);
    });

    it('should throw error when setting non-existent provider as default', () => {
      expect(() => {
        manager.setDefaultProvider('non-existent');
      }).toThrow('Provider not found');
    });

    it('should return current default provider', () => {
      const defaultProvider = manager.getDefaultProvider();

      expect(defaultProvider).toBeDefined();
      expect(defaultProvider?.id).toBe('openai');
    });
  });

  describe('Provider Status', () => {
    beforeEach(async () => {
      manager.registerProvider(mockProvider1);
      manager.registerProvider(mockProvider2);
      await manager.authenticateProvider('mock-1', 'test-key');
    });

    it('should get status of all providers', async () => {
      const status = await manager.getProvidersStatus();

      expect(status).toHaveProperty('mock-1');
      expect(status).toHaveProperty('mock-2');
      expect(status['mock-1']).toHaveProperty('authenticated', true);
      expect(status['mock-2']).toHaveProperty('authenticated', false);
    });

    it('should include provider availability in status', async () => {
      mockProvider1.setAvailability(false);

      const status = await manager.getProvidersStatus();

      expect(status['mock-1']).toHaveProperty('available', false);
    });
  });

  describe('Model Configuration', () => {
    it('should provide default model configuration', () => {
      const config = manager.getDefaultModelConfig();

      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('topP');
      expect(config).toHaveProperty('frequencyPenalty');
      expect(config).toHaveProperty('presencePenalty');
    });

    it('should validate model configuration', () => {
      const validConfig = createMockModelConfig();
      const result = manager.validateModelConfig(validConfig);

      expect(result).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = createMockModelConfig({ temperature: 2.5 });
      const result = manager.validateModelConfig(invalidConfig);

      expect(result).toBe(false);
    });

    it('should validate temperature range', () => {
      const configs = [
        createMockModelConfig({ temperature: -0.1 }),
        createMockModelConfig({ temperature: 2.1 }),
      ];

      configs.forEach(config => {
        expect(manager.validateModelConfig(config)).toBe(false);
      });
    });

    it('should validate maxTokens range', () => {
      const configs = [
        createMockModelConfig({ maxTokens: 0 }),
        createMockModelConfig({ maxTokens: -1 }),
      ];

      configs.forEach(config => {
        expect(manager.validateModelConfig(config)).toBe(false);
      });
    });

    it('should validate topP range', () => {
      const configs = [
        createMockModelConfig({ topP: -0.1 }),
        createMockModelConfig({ topP: 1.1 }),
      ];

      configs.forEach(config => {
        expect(manager.validateModelConfig(config)).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      manager.registerProvider(mockProvider1);
      await manager.authenticateProvider('mock-1', 'test-key');

      // Simulate provider error
      mockProvider1.setAvailability(false);

      const config = createMockModelConfig();

      await expect(
        manager.generateResponse('mock-1', 'Test prompt', config)
      ).rejects.toThrow('Mock provider is not available');
    });

    it('should handle authentication failures', async () => {
      manager.registerProvider(mockProvider1);
      mockProvider1.setAvailability(false);

      const result = await manager.authenticateProvider('mock-1', 'test-key');

      expect(result).toBe(false);
    });

    it('should handle provider status errors', async () => {
      manager.registerProvider(mockProvider1);

      // Mock a provider that throws on getStatus
      const faultyProvider = new MockModelProvider('faulty', 'Faulty Provider');
      faultyProvider.getStatus = jest.fn().mockImplementation(() => {
        throw new Error('Status error');
      });

      manager.registerProvider(faultyProvider);

      const status = await manager.getProvidersStatus();

      expect(status['faulty']).toHaveProperty('error');
    });
  });
});

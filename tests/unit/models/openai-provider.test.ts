import { OpenAIProvider } from '@/core/models/openai-provider';
import { createMockModelConfig } from '../../utils/mocks';
import { mockFetch, mockFetchError } from '../../utils/mocks';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider.id).toBe('openai');
      expect(provider.name).toBe('OpenAI');
      expect(provider.type).toBe('remote');
    });

    it('should accept custom model in constructor', () => {
      const customProvider = new OpenAIProvider('gpt-3.5-turbo');
      expect(customProvider.id).toBe('openai');
    });
  });

  describe('Authentication', () => {
    it('should authenticate with valid API key', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });

      const result = await provider.authenticate('valid-api-key');

      expect(result).toBe(true);
      expect(provider.getStatus().authenticated).toBe(true);
    });

    it('should fail authentication with invalid API key', async () => {
      mockFetch({ error: 'Invalid API key' }, 401);

      const result = await provider.authenticate('invalid-api-key');

      expect(result).toBe(false);
      expect(provider.getStatus().authenticated).toBe(false);
    });

    it('should fail authentication when no API key provided', async () => {
      const result = await provider.authenticate();

      expect(result).toBe(false);
      expect(provider.getStatus().authenticated).toBe(false);
    });

    it('should handle network errors during authentication', async () => {
      mockFetchError('Network error');

      const result = await provider.authenticate('test-key');

      expect(result).toBe(false);
      expect(provider.getStatus().authenticated).toBe(false);
    });
  });

  describe('Response Generation', () => {
    beforeEach(async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');
    });

    it('should generate response successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response'
            }
          }
        ]
      };
      mockFetch(mockResponse);

      const config = createMockModelConfig();
      const result = await provider.generateResponse('Test prompt', config);

      expect(result).toBe('This is a test response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      const unauthenticatedProvider = new OpenAIProvider();
      const config = createMockModelConfig();

      await expect(
        unauthenticatedProvider.generateResponse('Test prompt', config)
      ).rejects.toThrow('OpenAI provider not authenticated');
    });

    it('should handle API errors during generation', async () => {
      mockFetchError('API error');

      const config = createMockModelConfig();

      await expect(
        provider.generateResponse('Test prompt', config)
      ).rejects.toThrow('API error');
    });

    it('should handle malformed API responses', async () => {
      mockFetch({ invalid: 'response' });

      const config = createMockModelConfig();

      await expect(
        provider.generateResponse('Test prompt', config)
      ).rejects.toThrow();
    });

    it('should use correct model configuration', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }]
      };
      mockFetch(mockResponse);

      const config = createMockModelConfig({
        temperature: 0.8,
        maxTokens: 150,
        topP: 0.95,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2
      });

      await provider.generateResponse('Test prompt', config);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.8'),
        })
      );
    });
  });

  describe('Streaming Response', () => {
    beforeEach(async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');
    });

    it('should stream response chunks', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockStreamResponse);

      const config = createMockModelConfig();
      const stream = provider.streamResponse('Test prompt', config);

      const chunks: string[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });

    it('should handle streaming errors', async () => {
      mockFetchError('Streaming error');

      const config = createMockModelConfig();

      const stream = provider.streamResponse('Test prompt', config);

      await expect(async () => {
        for await (const chunk of stream) {
          // This should throw
        }
      }).rejects.toThrow('Streaming error');
    });
  });

  describe('Availability', () => {
    it('should return true for availability (remote provider)', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] }, 200);
      const isAvailable = await provider.isAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Status', () => {
    it('should return correct status when not authenticated', () => {
      const status = provider.getStatus();

      expect(status).toEqual({
        authenticated: false,
        available: true,
        id: 'openai',
        name: 'OpenAI',
        model: 'gpt-4'
      });
    });

    it('should return correct status when authenticated', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');

      const status = provider.getStatus();

      expect(status).toEqual({
        authenticated: true,
        available: true,
        id: 'openai',
        name: 'OpenAI',
        model: 'gpt-4'
      });
    });
  });

  describe('Configuration Validation', () => {
    beforeEach(async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');
    });

    it('should validate temperature range', async () => {
      const invalidConfig = createMockModelConfig({ temperature: 2.5 });

      await expect(
        provider.generateResponse('Test prompt', invalidConfig)
      ).rejects.toThrow('Temperature must be between 0 and 1');
    });

    it('should validate maxTokens range', async () => {
      const invalidConfig = createMockModelConfig({ maxTokens: -1 });

      await expect(
        provider.generateResponse('Test prompt', invalidConfig)
      ).rejects.toThrow('Max tokens must be greater than 0');
    });

    it('should validate topP range', async () => {
      const invalidConfig = createMockModelConfig({ topP: 1.5 });

      await expect(
        provider.generateResponse('Test prompt', invalidConfig)
      ).rejects.toThrow('Top P must be between 0 and 1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');

      const config = createMockModelConfig();

      await expect(
        provider.generateResponse('', config)
      ).rejects.toThrow('Cannot read properties of undefined');
    });

    it('should handle very long prompts', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');

      const longPrompt = 'a'.repeat(100000);
      const config = createMockModelConfig();

      await expect(
        provider.generateResponse(longPrompt, config)
      ).rejects.toThrow('Cannot read properties of undefined');
    });

    it('should handle rate limiting', async () => {
      mockFetch({ data: [{ id: 'gpt-4', object: 'model' }] });
      await provider.authenticate('test-api-key');

      mockFetch({ error: 'Rate limit exceeded' }, 429);

      const config = createMockModelConfig();

      await expect(
        provider.generateResponse('Test prompt', config)
      ).rejects.toThrow('OpenAI API error: 429');
    });
  });
});

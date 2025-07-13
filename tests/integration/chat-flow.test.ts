import { ModelManager } from '@/core/models/model-manager';
import { GeneralAssistantAgent } from '@/core/agents/general-assistant';
import { MockModelProvider, createMockModelConfig, createMockUserInput } from '../utils/mocks';
import { mockFetch } from '../utils/mocks';

describe('Complete Chat Flow Integration', () => {
  let modelManager: ModelManager;
  let mockProvider: MockModelProvider;
  let agent: GeneralAssistantAgent;

  beforeEach(() => {
    modelManager = new ModelManager();
    mockProvider = new MockModelProvider('test-provider', 'Test Provider');
    mockProvider.setAuthenticated(true);
    mockProvider.setAvailability(true);
    mockProvider.setResponses([
      'I understand you want to analyze the market trends. Let me break this down systematically.',
      'Based on my analysis, here are the key factors to consider.',
      'I can help you brainstorm innovative solutions for your project.',
      'Let me provide a step-by-step approach to solving this problem.'
    ]);

    modelManager.registerProvider(mockProvider);

    const config = createMockModelConfig({
      temperature: 0.7,
      maxTokens: 150,
      topP: 0.9
    });

    agent = new GeneralAssistantAgent(mockProvider, config);
  });

  describe('Full Chat Conversation Flow', () => {
    it('should handle a complete conversation with multiple turns', async () => {
      await agent.initialize();

      // First message: General question
      const message1 = createMockUserInput({
        content: 'What are the key trends in AI development?',
        type: 'text'
      });

      const response1 = await agent.processInput(message1);

      expect(response1).toBeDefined();
      expect(response1.content).toBeTruthy();
      expect(response1.confidence).toBeGreaterThan(0);
      expect(response1.agentId).toBe('general-assistant');
      expect(response1.reasoning).toBeTruthy();

      // Second message: Follow-up question
      const message2 = createMockUserInput({
        content: 'Can you elaborate on machine learning trends?',
        type: 'text'
      });

      const response2 = await agent.processInput(message2);

      expect(response2).toBeDefined();
      expect(response2.content).toBeTruthy();
      expect(response2.confidence).toBeGreaterThan(0);
      expect(response2.id).not.toBe(response1.id);

      // Third message: Brainstorming request
      const message3 = createMockUserInput({
        content: 'brainstorm some innovative AI applications',
        type: 'text'
      });

      const response3 = await agent.processInput(message3);

      expect(response3).toBeDefined();
      expect(response3.content).toBeTruthy();
      expect(response3.confidence).toBeGreaterThan(0);

      // Fourth message: Step-by-step request
      const message4 = createMockUserInput({
        content: 'give me a step by step plan to implement an AI project',
        type: 'text'
      });

      const response4 = await agent.processInput(message4);

      expect(response4).toBeDefined();
      expect(response4.content).toBeTruthy();
      expect(response4.confidence).toBeGreaterThan(0);

      // Verify agent status after conversation
      const status = agent.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.id).toBe('general-assistant');
      expect(status.name).toBe('General Assistant');

      // Verify model provider was called multiple times
      expect(mockProvider.getCallCount()).toBe(4);
    });

    it('should handle different input types gracefully', async () => {
      await agent.initialize();

      // Text input
      const textInput = createMockUserInput({
        content: 'Hello, how can you help me?',
        type: 'text'
      });

      const textResponse = await agent.processInput(textInput);
      expect(textResponse.type).toBe('text');
      expect(textResponse.content).toBeTruthy();

      // Voice input (simulated)
      const voiceInput = createMockUserInput({
        content: 'What is artificial intelligence?',
        type: 'voice'
      });

      const voiceResponse = await agent.processInput(voiceInput);
      expect(voiceResponse.type).toBe('text'); // Agent responds with text
      expect(voiceResponse.content).toBeTruthy();

      // Image input (simulated)
      const imageInput = createMockUserInput({
        content: 'Analyze this image',
        type: 'image',
        metadata: { imageUrl: 'https://example.com/image.jpg' }
      });

      const imageResponse = await agent.processInput(imageInput);
      expect(imageResponse.type).toBe('text');
      expect(imageResponse.content).toBeTruthy();
    });

    it('should maintain conversation context and memory', async () => {
      await agent.initialize();

      // First message about a specific topic
      const message1 = createMockUserInput({
        content: 'I am working on a machine learning project about recommendation systems',
        type: 'text'
      });

      const response1 = await agent.processInput(message1);
      expect(response1.content).toBeTruthy();

      // Check that memory was updated
      const initialMemoryCount = agent.memory.memories.length;
      expect(agent.memory.memories.length).toBeGreaterThanOrEqual(0);

      // Second message referring to the previous context
      const message2 = createMockUserInput({
        content: 'What algorithms work best for this type of project?',
        type: 'text'
      });

      const response2 = await agent.processInput(message2);
      expect(response2.content).toBeTruthy();

      // Memory should have been updated with the conversation
      const finalMemoryCount = agent.memory.memories.length;
      expect(finalMemoryCount).toBeGreaterThanOrEqual(initialMemoryCount);
    });

    it('should handle learning and reflection correctly', async () => {
      await agent.initialize();

      const message = createMockUserInput({
        content: 'Explain quantum computing in simple terms',
        type: 'text'
      });

      const response = await agent.processInput(message);
      expect(response.content).toBeTruthy();

      // Test reflection on the response
      const learningUpdate = await agent.reflect(response);

      expect(learningUpdate).toBeDefined();
      expect(learningUpdate.patterns).toBeDefined();
      expect(learningUpdate.preferences).toBeDefined();
      expect(learningUpdate.feedback).toBeDefined();
      expect(learningUpdate.context).toBeDefined();

      // High confidence should lead to positive feedback
      if (response.confidence > 0.8) {
        expect(learningUpdate.feedback).toBe('positive');
      } else if (response.confidence < 0.4) {
        expect(learningUpdate.feedback).toBe('negative');
      } else {
        expect(learningUpdate.feedback).toBe('neutral');
      }
    });

    it('should handle provider switching during conversation', async () => {
      await agent.initialize();

      // Initial conversation with first provider
      const message1 = createMockUserInput({
        content: 'Tell me about renewable energy',
        type: 'text'
      });

      const response1 = await agent.processInput(message1);
      expect(response1.content).toBeTruthy();

      // Switch to a different provider
      const newProvider = new MockModelProvider('new-provider', 'New Provider');
      newProvider.setAuthenticated(true);
      newProvider.setAvailability(true);
      newProvider.setResponses(['This is a response from the new provider']);

      modelManager.registerProvider(newProvider);

      // Create new agent with new provider
      const newAgent = new GeneralAssistantAgent(newProvider, createMockModelConfig());
      await newAgent.initialize();

      const message2 = createMockUserInput({
        content: 'Continue the discussion about renewable energy',
        type: 'text'
      });

      const response2 = await newAgent.processInput(message2);
      expect(response2.content).toBeTruthy();

      // Verify different providers were used
      expect(mockProvider.getCallCount()).toBe(1);
      expect(newProvider.getCallCount()).toBe(1);
    });

    it('should handle complex reasoning workflows', async () => {
      await agent.initialize();

      const complexMessage = createMockUserInput({
        content: 'analyze the pros and cons of implementing blockchain technology in supply chain management, then provide a step-by-step implementation plan',
        type: 'text'
      });

      const response = await agent.processInput(complexMessage);

      expect(response.content).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.reasoning).toBeTruthy();

      // Should trigger both analysis and step-by-step capabilities
      const capabilities = agent.capabilities;
      expect(capabilities).toContain('analysis');
      expect(capabilities).toContain('task-planning');

      // The response should be comprehensive for complex requests
      expect(response.confidence).toBeGreaterThan(0.6);
    });

    it('should handle error recovery gracefully', async () => {
      await agent.initialize();

      // Simulate a provider error
      mockProvider.setAvailability(false);

      const message = createMockUserInput({
        content: 'This should trigger an error',
        type: 'text'
      });

      // The agent should handle the error gracefully
      await expect(agent.processInput(message)).rejects.toThrow();

      // Restore provider and verify recovery
      mockProvider.setAvailability(true);

      const recoveryMessage = createMockUserInput({
        content: 'This should work after recovery',
        type: 'text'
      });

      const recoveryResponse = await agent.processInput(recoveryMessage);
      expect(recoveryResponse.content).toBeTruthy();
      expect(recoveryResponse.confidence).toBeGreaterThan(0);
    });

    it('should handle concurrent requests properly', async () => {
      await agent.initialize();

      // Create multiple concurrent requests
      const messages = [
        createMockUserInput({ content: 'What is machine learning?', type: 'text' }),
        createMockUserInput({ content: 'Explain neural networks', type: 'text' }),
        createMockUserInput({ content: 'How does deep learning work?', type: 'text' }),
      ];

      // Process all messages concurrently
      const responses = await Promise.all(
        messages.map(message => agent.processInput(message))
      );

      // All responses should be valid
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.content).toBeTruthy();
        expect(response.confidence).toBeGreaterThan(0);
        expect(response.agentId).toBe('general-assistant');
      });

      // All responses should have unique IDs
      const responseIds = responses.map(r => r.id);
      const uniqueIds = new Set(responseIds);
      expect(uniqueIds.size).toBe(3);
    });

    it('should track conversation metrics correctly', async () => {
      await agent.initialize();

      const initialStatus = agent.getStatus();
      expect(initialStatus.initialized).toBe(true);

      // Process multiple messages
      const messages = [
        'Hello, how are you?',
        'What can you help me with?',
        'Tell me about AI safety',
        'brainstorm solutions for climate change',
        'give me a step by step guide for sustainable living'
      ];

      let totalConfidence = 0;

      for (const messageContent of messages) {
        const message = createMockUserInput({
          content: messageContent,
          type: 'text'
        });

        const response = await agent.processInput(message);
        totalConfidence += response.confidence;

        expect(response.content).toBeTruthy();
        expect(response.confidence).toBeGreaterThan(0);
      }

      const finalStatus = agent.getStatus();
      expect(finalStatus.initialized).toBe(true);

      // Calculate average confidence
      const averageConfidence = totalConfidence / messages.length;
      expect(averageConfidence).toBeGreaterThan(0);
      expect(averageConfidence).toBeLessThanOrEqual(1);

      // Verify provider was called for each message
      expect(mockProvider.getCallCount()).toBe(messages.length);
    });

    it('should handle cleanup properly after conversation', async () => {
      await agent.initialize();

      // Have a conversation
      const message = createMockUserInput({
        content: 'Thank you for your help!',
        type: 'text'
      });

      const response = await agent.processInput(message);
      expect(response.content).toBeTruthy();

      // Verify agent is working
      const statusBefore = agent.getStatus();
      expect(statusBefore.initialized).toBe(true);

      // Cleanup
      await agent.cleanup();

      // Verify cleanup
      const statusAfter = agent.getStatus();
      expect(statusAfter.initialized).toBe(false);
    });
  });

  describe('ModelManager Integration', () => {
    it('should work with multiple providers through ModelManager', async () => {
      const provider1 = new MockModelProvider('provider1', 'Provider 1');
      const provider2 = new MockModelProvider('provider2', 'Provider 2');

      provider1.setAuthenticated(true);
      provider1.setAvailability(true);
      provider1.setResponses(['Response from provider 1']);

      provider2.setAuthenticated(true);
      provider2.setAvailability(true);
      provider2.setResponses(['Response from provider 2']);

      modelManager.registerProvider(provider1);
      modelManager.registerProvider(provider2);

      // Test generating responses through ModelManager
      const config = createMockModelConfig();

      const response1 = await modelManager.generateResponse('provider1', 'Test prompt', config);
      expect(response1).toBe('Response from provider 1');

      const response2 = await modelManager.generateResponse('provider2', 'Test prompt', config);
      expect(response2).toBe('Response from provider 2');

      // Verify both providers were used
      expect(provider1.getCallCount()).toBe(1);
      expect(provider2.getCallCount()).toBe(1);
    });

    it('should handle provider authentication flow', async () => {
      const provider = new MockModelProvider('auth-provider', 'Auth Provider');
      provider.setAuthenticated(false);
      provider.setAvailability(true);

      modelManager.registerProvider(provider);

      // Authentication should fail initially
      const config = createMockModelConfig();
      await expect(
        modelManager.generateResponse('auth-provider', 'Test prompt', config)
      ).rejects.toThrow();

      // Authenticate provider
      const authResult = await modelManager.authenticateProvider('auth-provider', 'test-key');
      expect(authResult).toBe(true);

      // Should work after authentication
      provider.setResponses(['Authenticated response']);
      const response = await modelManager.generateResponse('auth-provider', 'Test prompt', config);
      expect(response).toBe('Authenticated response');
    });

    it('should get best available provider automatically', async () => {
      // Clear existing providers
      const manager = new ModelManager();

      const provider1 = new MockModelProvider('provider1', 'Provider 1');
      const provider2 = new MockModelProvider('provider2', 'Provider 2');

      provider1.setAuthenticated(true);
      provider1.setAvailability(true);

      provider2.setAuthenticated(false);
      provider2.setAvailability(true);

      manager.registerProvider(provider1);
      manager.registerProvider(provider2);

      const bestProvider = await manager.getBestAvailableProvider();
      expect(bestProvider).toBe(provider1);
    });
  });
});

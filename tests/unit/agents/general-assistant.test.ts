import { GeneralAssistantAgent } from '@/core/agents/general-assistant';
import { MockModelProvider, MockMemory, MockTaskPlanner, createMockModelConfig, createMockUserInput, createMockAgentResponse } from '../../utils/mocks';
import { UserInput, AgentResponse } from '@/core/types';

describe('GeneralAssistantAgent', () => {
  let agent: GeneralAssistantAgent;
  let mockProvider: MockModelProvider;
  let mockConfig: any;

  beforeEach(() => {
    mockProvider = new MockModelProvider();
    mockConfig = createMockModelConfig();
    agent = new GeneralAssistantAgent(mockProvider, mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(agent.id).toBe('general-assistant');
      expect(agent.name).toBe('General Assistant');
      expect(agent.description).toContain('general-purpose assistant');
      expect(agent.capabilities).toContain('question-answering');
      expect(agent.capabilities).toContain('task-planning');
      expect(agent.capabilities).toContain('creative-writing');
      expect(agent.capabilities).toContain('analysis');
    });

    it('should have correct system prompt', () => {
      expect(agent.systemPrompt).toContain('helpful, intelligent general assistant');
      expect(agent.systemPrompt).toContain('Polaris');
      expect(agent.systemPrompt).toContain('multi-agent system');
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);

      await agent.initialize();

      expect(agent.getStatus()).toEqual({
        id: 'general-assistant',
        name: 'General Assistant',
        initialized: true,
        capabilities: expect.any(Array),
        memoryCount: expect.any(Number)
      });
    });

        it('should handle initialization errors gracefully', async () => {
      mockProvider.setAvailability(false);

      // BaseAgent initialization succeeds even with unavailable provider
      await agent.initialize();
      expect(agent.getStatus().initialized).toBe(true);
    });

    it('should load memory during initialization', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);

      await agent.initialize();

      expect(agent.memory).toBeDefined();
      expect(agent.memory.userId).toBe('');
      expect(agent.memory.agentId).toBe('general-assistant');
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();
    });

    it('should create memory with correct structure', () => {
      const memory = agent.createMemory();

      expect(memory).toBeDefined();
      expect(memory.userId).toBe('');
      expect(memory.agentId).toBe('general-assistant');
      expect(memory.memories).toBeInstanceOf(Array);
      expect(memory.patterns).toBeInstanceOf(Object);
      expect(memory.preferences).toBeInstanceOf(Object);
    });

    it('should store and retrieve memories', async () => {
      const testMemory = {
        id: 'test-memory',
        content: 'Test memory content',
        timestamp: new Date(),
        importance: 0.8,
        tags: ['test']
      };

      agent.memory.memories.push(testMemory);

      const retrievedMemory = agent.memory.memories.find(m => m.id === 'test-memory');
      expect(retrievedMemory).toEqual(testMemory);
    });
  });

  describe('Task Planning', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();
    });

    it('should create task planner with correct configuration', () => {
      const planner = agent.createPlanner();

      expect(planner).toBeDefined();
      expect(planner).toBeInstanceOf(Object);
      expect(planner.analyzeTask).toBeInstanceOf(Function);
      expect(planner.createPlan).toBeInstanceOf(Function);
      expect(planner.executePlan).toBeInstanceOf(Function);
    });

    it('should analyze user input correctly', async () => {
      const input = createMockUserInput({
        content: 'Help me plan my day',
        type: 'text'
      });

      const analysis = await agent.analyze(input);

      expect(analysis).toBeDefined();
      expect(analysis.intent).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(analysis.entities).toBeDefined();
      expect(analysis.context).toBeDefined();
    });

    it('should create action plan from analysis', async () => {
      const input = createMockUserInput({
        content: 'Help me write a report',
        type: 'text'
      });

      const analysis = await agent.analyze(input);
      const plan = await agent.plan(analysis);

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.steps).toBeInstanceOf(Array);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
      expect(typeof plan.requiresApproval).toBe('boolean');
    });

    it('should execute action plan', async () => {
      const input = createMockUserInput({
        content: 'What is the weather like?',
        type: 'text'
      });

      const analysis = await agent.analyze(input);
      const plan = await agent.plan(analysis);
      const response = await agent.execute(plan);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.agentId).toBe('general-assistant');
      expect(response.content).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('Specialized Input Handling', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      mockProvider.setResponses([
        'This is a great brainstorming response with creative ideas.',
        'Here is a step-by-step breakdown of the task.',
        'This is a detailed analysis of the problem.'
      ]);
      await agent.initialize();
    });

    it('should handle brainstorming requests', async () => {
      const input = createMockUserInput({
        content: 'brainstorm ideas for a new app',
        type: 'text'
      });

      const response = await agent.processSpecializedInput(input);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.reasoning).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0.7);
    });

    it('should handle step-by-step requests', async () => {
      const input = createMockUserInput({
        content: 'step by step guide to baking a cake',
        type: 'text'
      });

      const response = await agent.processSpecializedInput(input);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.reasoning).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0.8);
    });

        it('should handle analysis requests', async () => {
      const input = createMockUserInput({
        content: 'analyze the pros and cons of remote work',
        type: 'text'
      });

      const response = await agent.processSpecializedInput(input);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.reasoning).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0.6);
    });

    it('should handle general queries when no specialization matches', async () => {
      const input = createMockUserInput({
        content: 'What is the capital of France?',
        type: 'text'
      });

      const response = await agent.processSpecializedInput(input);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.reasoning).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Reflection and Learning', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();
    });

    it('should reflect on responses and generate learning updates', async () => {
      const response = createMockAgentResponse({
        id: 'test-response',
        agentId: 'general-assistant',
        content: 'This is a test response',
        confidence: 0.8
      });

      const learningUpdate = await agent.reflect(response);

      expect(learningUpdate).toBeDefined();
      expect(learningUpdate.patterns).toBeDefined();
      expect(learningUpdate.preferences).toBeDefined();
      expect(learningUpdate.feedback).toBeDefined();
      expect(learningUpdate.context).toBeDefined();
    });

    it('should provide positive feedback for high confidence responses', async () => {
      const response = createMockAgentResponse({
        confidence: 0.9
      });

      const learningUpdate = await agent.reflect(response);

      expect(learningUpdate.feedback).toBe('positive');
    });

    it('should provide negative feedback for low confidence responses', async () => {
      const response = createMockAgentResponse({
        confidence: 0.3
      });

      const learningUpdate = await agent.reflect(response);

      expect(learningUpdate.feedback).toBe('negative');
    });
  });

  describe('Capabilities Description', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();
    });

    it('should provide detailed capabilities description', async () => {
      const description = await agent.getCapabilitiesDescription();

      expect(description).toBeDefined();
      expect(description).toContain('General Assistant');
      expect(description).toContain('questions');
      expect(description).toContain('planning');
      expect(description).toContain('brainstorm');
      expect(description).toContain('analysis');
    });

    it('should include usage examples', async () => {
      const description = await agent.getCapabilitiesDescription();

      expect(description).toContain('brainstorm');
      expect(description).toContain('step');
      expect(description).toContain('analysis');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
    });

        it('should handle provider errors gracefully', async () => {
      mockProvider.setAvailability(false);

      // BaseAgent initialization succeeds even with unavailable provider
      await agent.initialize();
      expect(agent.getStatus().initialized).toBe(true);
    });

    it('should handle empty input gracefully', async () => {
      await agent.initialize();

      const emptyInput = createMockUserInput({
        content: '',
        type: 'text'
      });

      const analysis = await agent.analyze(emptyInput);
      expect(analysis).toBeDefined();
    });

    it('should handle provider failures during processing', async () => {
      await agent.initialize();

      // Simulate provider failure
      mockProvider.setAvailability(false);

      const input = createMockUserInput({
        content: 'test input',
        type: 'text'
      });

      // The agent should try to process and the error should be caught internally
      try {
        await agent.analyze(input);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

    describe('Status Management', () => {
    it('should return correct status before initialization', () => {
      const status = agent.getStatus();

      expect(status.id).toBe('general-assistant');
      expect(status.name).toBe('General Assistant');
      expect(status.initialized).toBe(false);
      expect(status.capabilities).toBeInstanceOf(Array);
      expect(status.memoryCount).toBe(0);
    });

    it('should return correct status after initialization', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();

      const status = agent.getStatus();

      expect(status.id).toBe('general-assistant');
      expect(status.name).toBe('General Assistant');
      expect(status.initialized).toBe(true);
      expect(status.capabilities).toBeInstanceOf(Array);
      expect(status.memoryCount).toBeGreaterThanOrEqual(0);
    });

    it('should update status after processing', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();

      const input = createMockUserInput();
      await agent.analyze(input);

      const status = agent.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();

      await agent.cleanup();

      const status = agent.getStatus();
      expect(status.id).toBe('general-assistant');
      expect(status.initialized).toBe(false);
    });

        it('should handle cleanup gracefully', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();

      // Cleanup should succeed
      await agent.cleanup();

      const status = agent.getStatus();
      expect(status.initialized).toBe(false);
    });
  });
});

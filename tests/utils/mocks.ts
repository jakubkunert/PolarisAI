import {
  ModelProvider,
  ModelConfig,
  AgentResponse,
  ActionStep,
  Tool,
  LongTermMemory,
  TaskPlanner,
  ReasoningAgent,
  UserInput,
  Analysis,
  ActionPlan,
  Memory,
  LearningUpdate
} from '@/core/types';

// Mock Model Provider
export class MockModelProvider implements ModelProvider {
  private _responses: string[] = [];
  private _responseIndex = 0;
  private _callCount = 0;
  private _authenticated = false;
  private _available = true;

  constructor(
    public id: string = 'mock-provider',
    public name: string = 'Mock Provider',
    public type: 'local' | 'remote' = 'remote'
  ) {}

  async authenticate(apiKey?: string): Promise<boolean> {
    if (!this._available) {
      this._authenticated = false;
      return false;
    }
    this._authenticated = !!apiKey;
    return this._authenticated;
  }

  async generateResponse(prompt: string, config: ModelConfig): Promise<string> {
    if (!this._available) {
      throw new Error('Mock provider is not available');
    }

    // Check if this is a JSON request (for planner)
    if (prompt.includes('JSON format') || prompt.includes('Return only the JSON') || prompt.includes('analyze the following user input')) {
      if (prompt.includes('analyze the following user input') || prompt.includes('analyzeTask')) {
        return JSON.stringify({
          intent: 'mock-intent',
          confidence: 0.8,
          entities: { mockEntity: 'mockValue' },
          context: { domain: 'general', complexity: 'medium', urgency: 'medium' }
        });
      } else if (prompt.includes('createPlan') || prompt.includes('Create a detailed action plan')) {
        return JSON.stringify({
          id: `plan-${Date.now()}`,
          steps: [
            {
              id: `step-${Date.now()}`,
              action: 'mock-action',
              parameters: { mockParam: 'mockValue' },
              dependencies: [],
              estimatedDuration: 1000
            }
          ],
          estimatedDuration: 1000,
          requiresApproval: false
        });
      }
    }

    this._callCount++;
    const response = this._responses[this._responseIndex] || `Mock response to: ${prompt}`;
    this._responseIndex = (this._responseIndex + 1) % (this._responses.length || 1);
    return response;
  }

  async *streamResponse(prompt: string, config: ModelConfig): AsyncIterable<string> {
    const response = await this.generateResponse(prompt, config);
    const chunks = response.split(' ');
    for (const chunk of chunks) {
      yield chunk + ' ';
    }
  }

  async isAvailable(): Promise<boolean> {
    return this._available;
  }

  getStatus(): { authenticated: boolean; available: boolean; id: string; name: string; [key: string]: unknown } {
    return {
      authenticated: this._authenticated,
      available: this._available,
      id: this.id,
      name: this.name,
      models: ['mock-model-1', 'mock-model-2'],
      error: this._available ? undefined : 'Mock provider unavailable'
    };
  }

  // Test utilities
  setResponses(responses: string[]): void {
    this._responses = responses;
    this._responseIndex = 0;
  }

  setAvailability(available: boolean): void {
    this._available = available;
  }

  setAuthenticated(authenticated: boolean): void {
    this._authenticated = authenticated;
  }

  getCallCount(): number {
    return this._callCount;
  }
}

// Mock Memory System
export class MockMemory implements LongTermMemory {
  constructor(
    public userId: string = 'test-user',
    public agentId: string = 'mock-agent',
    public memories: Memory[] = [],
    public patterns: Record<string, unknown> = {},
    public preferences: Record<string, unknown> = {}
  ) {}

  // Test utilities
  addMemory(memory: Memory): void {
    this.memories.push(memory);
  }

  clearMemories(): void {
    this.memories = [];
  }

  setPatterns(patterns: Record<string, unknown>): void {
    this.patterns = patterns;
  }

  setPreferences(preferences: Record<string, unknown>): void {
    this.preferences = preferences;
  }
}

// Mock Tool
export class MockTool implements Tool {
  constructor(
    public id: string = 'mock-tool',
    public name: string = 'Mock Tool',
    public description: string = 'Mock tool for testing',
    public parameters: Record<string, unknown> = {},
    private _response: unknown = 'Mock tool response'
  ) {}

  async execute(params: Record<string, unknown>): Promise<unknown> {
    return this._response;
  }

  setResponse(response: unknown): void {
    this._response = response;
  }
}

// Mock Task Planner
export class MockTaskPlanner implements TaskPlanner {
  private _analysis: Analysis | null = null;
  private _plan: ActionPlan | null = null;
  private _response: AgentResponse | null = null;

  async analyzeTask(input: UserInput): Promise<Analysis> {
    if (this._analysis) {
      return this._analysis;
    }

    return {
      intent: 'mock-intent',
      confidence: 0.8,
      entities: { mockEntity: 'mockValue' },
      context: { mockContext: 'mockValue' },
      previousConversation: []
    };
  }

  async createPlan(analysis: Analysis): Promise<ActionPlan> {
    if (this._plan) {
      return this._plan;
    }

    return {
      id: `plan-${Date.now()}`,
      steps: [
        {
          id: `step-${Date.now()}`,
          action: 'mock-action',
          parameters: { mockParam: 'mockValue' },
          dependencies: [],
          estimatedDuration: 1000
        }
      ],
      estimatedDuration: 1000,
      requiresApproval: false
    };
  }

  async executePlan(plan: ActionPlan): Promise<AgentResponse> {
    if (this._response) {
      return this._response;
    }

    return {
      id: `response-${Date.now()}`,
      agentId: 'mock-agent',
      content: 'Mock execution response',
      timestamp: new Date(),
      type: 'text',
      confidence: 0.8,
      reasoning: 'Mock reasoning'
    };
  }

  // Test utilities
  setAnalysis(analysis: Analysis): void {
    this._analysis = analysis;
  }

  setPlan(plan: ActionPlan): void {
    this._plan = plan;
  }

  setResponse(response: AgentResponse): void {
    this._response = response;
  }
}

// Mock Agent
export class MockAgent implements ReasoningAgent {
  public planner: TaskPlanner;
  public memory: LongTermMemory;
  public tools: Tool[];

  private _initialized = false;
  private _responses: AgentResponse[] = [];
  private _responseIndex = 0;

  constructor(
    public id: string = 'mock-agent',
    public name: string = 'Mock Agent',
    public description: string = 'Mock agent for testing',
    public capabilities: string[] = ['mock-capability'],
    public systemPrompt: string = 'You are a mock agent'
  ) {
    this.planner = new MockTaskPlanner();
    this.memory = new MockMemory('mock-user', this.id);
    this.tools = [];
  }

  async analyze(input: UserInput): Promise<Analysis> {
    return this.planner.analyzeTask(input);
  }

  async plan(analysis: Analysis): Promise<ActionPlan> {
    return this.planner.createPlan(analysis);
  }

  async execute(plan: ActionPlan): Promise<AgentResponse> {
    return this.planner.executePlan(plan);
  }

  async reflect(response: AgentResponse): Promise<LearningUpdate> {
    return {
      patterns: { mockPattern: 'mockValue' },
      preferences: { mockPreference: 'mockValue' },
      feedback: 'positive',
      context: 'mock-context'
    };
  }

  async initialize(): Promise<void> {
    this._initialized = true;
  }

  async cleanup(): Promise<void> {
    this._initialized = false;
  }

  // Test utilities
  isInitialized(): boolean {
    return this._initialized;
  }

  setResponses(responses: AgentResponse[]): void {
    this._responses = responses;
    this._responseIndex = 0;
  }

  getResponseCount(): number {
    return this._responseIndex;
  }

  addTool(tool: Tool): void {
    this.tools.push(tool);
  }
}

// Test Data Factories
export const createMockUserInput = (
  overrides: Partial<UserInput> = {}
): UserInput => ({
  id: `input-${Date.now()}`,
  content: 'Test input',
  timestamp: new Date(),
  type: 'text',
  metadata: {},
  ...overrides
});

export const createMockAgentResponse = (
  overrides: Partial<AgentResponse> = {}
): AgentResponse => ({
  id: `response-${Date.now()}`,
  agentId: 'mock-agent',
  content: 'Mock agent response',
  timestamp: new Date(),
  type: 'text',
  confidence: 0.8,
  reasoning: 'Mock agent reasoning',
  metadata: {},
  ...overrides
});

export const createMockActionStep = (
  overrides: Partial<ActionStep> = {}
): ActionStep => ({
  id: `step-${Date.now()}`,
  action: 'mock-action',
  parameters: { mockParam: 'mockValue' },
  dependencies: [],
  estimatedDuration: 1000,
  ...overrides
});

export const createMockMemory = (
  overrides: Partial<Memory> = {}
): Memory => ({
  id: `memory-${Date.now()}`,
  content: 'Mock memory content',
  timestamp: new Date(),
  importance: 0.5,
  tags: ['mock-tag'],
  embedding: [0.1, 0.2, 0.3],
  ...overrides
});

export const createMockModelConfig = (
  overrides: Partial<ModelConfig> = {}
): ModelConfig => ({
  temperature: 0.7,
  maxTokens: 100,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: 'You are a helpful assistant',
  ...overrides
});

export const createMockAnalysis = (
  overrides: Partial<Analysis> = {}
): Analysis => ({
  intent: 'mock-intent',
  confidence: 0.8,
  entities: { mockEntity: 'mockValue' },
  context: { mockContext: 'mockValue' },
  previousConversation: [],
  ...overrides
});

export const createMockActionPlan = (
  overrides: Partial<ActionPlan> = {}
): ActionPlan => ({
  id: `plan-${Date.now()}`,
  steps: [createMockActionStep()],
  estimatedDuration: 1000,
  requiresApproval: false,
  ...overrides
});

export const createMockLearningUpdate = (
  overrides: Partial<LearningUpdate> = {}
): LearningUpdate => ({
  patterns: { mockPattern: 'mockValue' },
  preferences: { mockPreference: 'mockValue' },
  feedback: 'positive',
  context: 'mock-context',
  ...overrides
});

// HTTP Mock helpers
export const mockFetch = (response: unknown, status = 200) => {
  const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
  fetchMock.mockResolvedValueOnce({
    ok: status < 400,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  } as Response);
};

export const mockFetchError = (error: string) => {
  const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
  fetchMock.mockRejectedValueOnce(new Error(error));
};

// Async test utilities
export const waitForAsync = (ms = 0): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await waitForAsync(interval);
  }
  if (!condition()) {
    throw new Error('Condition not met within timeout');
  }
};

import { 
  ReasoningAgent, 
  UserInput, 
  Analysis, 
  ActionPlan, 
  AgentResponse, 
  LearningUpdate, 
  TaskPlanner, 
  LongTermMemory, 
  Tool, 
  ModelConfig,
  ModelProvider 
} from '../types';

export abstract class BaseAgent implements ReasoningAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly capabilities: string[];
  public readonly systemPrompt: string;
  
  protected modelProvider: ModelProvider;
  protected modelConfig: ModelConfig;
  protected isInitialized = false;
  
  public planner: TaskPlanner;
  public memory: LongTermMemory;
  public tools: Tool[];
  
  constructor(
    id: string,
    name: string,
    description: string,
    capabilities: string[],
    systemPrompt: string,
    modelProvider: ModelProvider,
    modelConfig: ModelConfig
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.systemPrompt = systemPrompt;
    this.modelProvider = modelProvider;
    this.modelConfig = modelConfig;
    this.tools = [];
    
    // Initialize memory and planner
    this.memory = this.createMemory();
    this.planner = this.createPlanner();
  }
  
  abstract createMemory(): LongTermMemory;
  abstract createPlanner(): TaskPlanner;
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Initialize model provider if not already authenticated
      if (!this.modelProvider.getStatus().authenticated) {
        console.warn(`Model provider ${this.modelProvider.id} not authenticated`);
      }
      
      // Initialize tools
      await this.initializeTools();
      
      // Load agent memory
      await this.loadMemory();
      
      this.isInitialized = true;
      console.log(`Agent ${this.id} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize agent ${this.id}:`, error);
      throw error;
    }
  }
  
  protected async initializeTools(): Promise<void> {
    // Override in subclasses to add specific tools
  }
  
  protected async loadMemory(): Promise<void> {
    // Override in subclasses to load specific memory patterns
  }
  
  async analyze(input: UserInput): Promise<Analysis> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.planner.analyzeTask(input);
  }
  
  async plan(analysis: Analysis): Promise<ActionPlan> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.planner.createPlan(analysis);
  }
  
  async execute(plan: ActionPlan): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.planner.executePlan(plan);
  }
  
  async reflect(response: AgentResponse): Promise<LearningUpdate> {
    // Analyze the response and generate learning updates
    const patterns: Record<string, any> = {};
    const preferences: Record<string, any> = {};
    
    // Basic reflection logic - can be overridden by subclasses
    const feedback = response.confidence > 0.8 ? 'positive' : 
                    response.confidence < 0.4 ? 'negative' : 'neutral';
    
    // Update memory with this interaction
    await this.updateMemory(response);
    
    return {
      patterns,
      preferences,
      feedback,
      context: `Agent ${this.id} processed request with confidence ${response.confidence}`
    };
  }
  
  protected async updateMemory(response: AgentResponse): Promise<void> {
    // Add to memory system
    this.memory.memories.push({
      id: `memory_${Date.now()}`,
      content: response.content,
      timestamp: response.timestamp,
      importance: response.confidence,
      tags: ['response', this.id],
      embedding: undefined // Would be populated with actual embeddings
    });
    
    // Keep only recent memories (simple implementation)
    if (this.memory.memories.length > 100) {
      this.memory.memories = this.memory.memories
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 100);
    }
  }
  
  async processInput(input: UserInput): Promise<AgentResponse> {
    try {
      // Full reasoning pipeline
      const analysis = await this.analyze(input);
      const plan = await this.plan(analysis);
      const response = await this.execute(plan);
      
      // Learn from this interaction
      await this.reflect(response);
      
      return response;
    } catch (error) {
      console.error(`Error processing input in agent ${this.id}:`, error);
      
      // Return error response
      return {
        id: `error_${Date.now()}`,
        agentId: this.id,
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        type: 'text',
        confidence: 0,
        metadata: { error: true },
        reasoning: 'Error occurred during processing'
      };
    }
  }
  
  async cleanup(): Promise<void> {
    // Cleanup resources
    console.log(`Agent ${this.id} cleaning up`);
    this.isInitialized = false;
  }
  
  getStatus(): { id: string; name: string; initialized: boolean; capabilities: string[]; memoryCount: number } {
    return {
      id: this.id,
      name: this.name,
      initialized: this.isInitialized,
      capabilities: this.capabilities,
      memoryCount: this.memory.memories.length
    };
  }
  
  addTool(tool: Tool): void {
    this.tools.push(tool);
  }
  
  getTool(id: string): Tool | undefined {
    return this.tools.find(tool => tool.id === id);
  }
  
  protected async generateResponse(prompt: string): Promise<string> {
    const fullPrompt = `${this.systemPrompt}\n\n${prompt}`;
    return await this.modelProvider.generateResponse(fullPrompt, this.modelConfig);
  }
  
  protected async streamResponse(prompt: string): Promise<AsyncIterable<string>> {
    const fullPrompt = `${this.systemPrompt}\n\n${prompt}`;
    return this.modelProvider.streamResponse(fullPrompt, this.modelConfig);
  }
} 
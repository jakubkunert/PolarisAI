import { BaseAgent } from './base-agent';
import { BasicTaskPlanner } from './basic-planner';
import {
  LongTermMemory,
  TaskPlanner,
  ModelProvider,
  ModelConfig,
  UserInput,
  AgentResponse
} from '../types';

export class GeneralAssistantAgent extends BaseAgent {
  constructor(modelProvider: ModelProvider, modelConfig: ModelConfig) {
    const systemPrompt = `
You are a helpful, intelligent general assistant named Polaris. You are part of a multi-agent system designed to help users with various tasks and questions.

Your core capabilities include:
- General question answering and information retrieval
- Task planning and problem-solving
- Creative writing and brainstorming
- Basic analysis and reasoning
- Friendly conversation and support

Key principles:
1. Be helpful, accurate, and honest
2. Break down complex problems into manageable steps
3. Ask clarifying questions when needed
4. Provide reasoning for your responses
5. Acknowledge when you don't know something
6. Be respectful and supportive
7. Focus on being genuinely useful to the user

When analyzing tasks:
- Identify the user's primary intent
- Consider the complexity and urgency
- Think about what information or steps are needed
- Plan your response accordingly

When planning actions:
- Break complex tasks into clear steps
- Consider dependencies between steps
- Estimate time requirements realistically
- Determine if user approval is needed for any actions

When executing plans:
- Follow your planned steps systematically
- Provide clear, actionable responses
- Include your reasoning process
- Be specific and detailed where helpful
- Maintain a friendly, professional tone

Remember: You're designed to be a reasoning agent that thinks through problems systematically, not just a simple chatbot.
`;

    super(
      'general-assistant',
      'General Assistant',
      'A helpful general-purpose assistant that can help with a wide variety of tasks and questions',
      [
        'question-answering',
        'task-planning',
        'problem-solving',
        'creative-writing',
        'conversation',
        'analysis',
        'reasoning'
      ],
      systemPrompt,
      modelProvider,
      modelConfig
    );
  }

  createMemory(): LongTermMemory {
    return {
      userId: '', // Will be set when user context is available
      agentId: this.id,
      memories: [],
      patterns: {
        preferredResponseStyle: 'detailed',
        commonTopics: [],
        userExpertise: 'general',
        interactionHistory: []
      },
      preferences: {
        responseLength: 'medium',
        technicalLevel: 'moderate',
        includeExamples: true,
        showReasoning: true
      }
    };
  }

  createPlanner(): TaskPlanner {
    return new BasicTaskPlanner(
      this.modelProvider,
      this.modelConfig,
      this.id,
      this.systemPrompt
    );
  }

  protected async initializeTools(): Promise<void> {
    // Add general-purpose tools
    this.addTool({
      id: 'text-analysis',
      name: 'Text Analysis',
      description: 'Analyze text for sentiment, key points, and insights',
      parameters: {
        text: { type: 'string', required: true },
        analysisType: { type: 'string', enum: ['sentiment', 'summary', 'keywords'] }
      },
      execute: async (params) => {
        const { text, analysisType } = params;
        const prompt = `Analyze the following text for ${analysisType}: "${text}"`;
        return await this.generateResponse(prompt);
      }
    });

    this.addTool({
      id: 'brainstorming',
      name: 'Brainstorming',
      description: 'Generate creative ideas and suggestions',
      parameters: {
        topic: { type: 'string', required: true },
        quantity: { type: 'number', default: 5 }
      },
      execute: async (params) => {
        const { topic, quantity } = params;
        const prompt = `Generate ${quantity} creative ideas for: ${topic}`;
        return await this.generateResponse(prompt);
      }
    });

    this.addTool({
      id: 'step-by-step',
      name: 'Step-by-Step Guide',
      description: 'Break down complex tasks into manageable steps',
      parameters: {
        task: { type: 'string', required: true },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
      },
      execute: async (params) => {
        const { task, difficulty } = params;
        const prompt = `Create a ${difficulty} step-by-step guide for: ${task}`;
        return await this.generateResponse(prompt);
      }
    });
  }

  protected async loadMemory(): Promise<void> {
    // Load user-specific patterns and preferences
    // In a real implementation, this would load from a database
    console.log(`Loading memory for general assistant ${this.id}`);
  }

  async processSpecializedInput(input: UserInput): Promise<AgentResponse> {
    // Handle specialized input types or patterns
    const content = input.content.toLowerCase();

    // Check for common patterns
    if (content.includes('brainstorm') || content.includes('ideas')) {
      return this.handleBrainstorming(input);
    }

    if (content.includes('step by step') || content.includes('how to')) {
      return this.handleStepByStep(input);
    }

    if (content.includes('analyze') || content.includes('analysis')) {
      return this.handleAnalysis(input);
    }

    // Default to normal processing
    return this.processInput(input);
  }

  private async handleBrainstorming(input: UserInput): Promise<AgentResponse> {
    const brainstormTool = this.getTool('brainstorming');
    if (!brainstormTool) {
      return this.processInput(input);
    }

    try {
      const ideas = await brainstormTool.execute({
        topic: input.content,
        quantity: 5
      });

      return {
        id: `brainstorm_${Date.now()}`,
        agentId: this.id,
        content: typeof ideas === 'string' ? ideas : String(ideas),
        timestamp: new Date(),
        type: 'text',
        confidence: 0.8,
        metadata: { tool: 'brainstorming', specialized: true },
        reasoning: 'Detected brainstorming request, used specialized brainstorming tool'
      };
    } catch (_error) {
      return this.processInput(input);
    }
  }

  private async handleStepByStep(input: UserInput): Promise<AgentResponse> {
    const stepTool = this.getTool('step-by-step');
    if (!stepTool) {
      return this.processInput(input);
    }

    try {
      const guide = await stepTool.execute({
        task: input.content,
        difficulty: 'intermediate'
      });

      return {
        id: `steps_${Date.now()}`,
        agentId: this.id,
        content: typeof guide === 'string' ? guide : String(guide),
        timestamp: new Date(),
        type: 'text',
        confidence: 0.85,
        metadata: { tool: 'step-by-step', specialized: true },
        reasoning: 'Detected step-by-step request, used specialized planning tool'
      };
    } catch (_error) {
      return this.processInput(input);
    }
  }

  private async handleAnalysis(input: UserInput): Promise<AgentResponse> {
    const analysisTool = this.getTool('text-analysis');
    if (!analysisTool) {
      return this.processInput(input);
    }

    try {
      const analysis = await analysisTool.execute({
        text: input.content,
        analysisType: 'summary'
      });

      return {
        id: `analysis_${Date.now()}`,
        agentId: this.id,
        content: typeof analysis === 'string' ? analysis : String(analysis),
        timestamp: new Date(),
        type: 'text',
        confidence: 0.75,
        metadata: { tool: 'text-analysis', specialized: true },
        reasoning: 'Detected analysis request, used specialized analysis tool'
      };
    } catch (_error) {
      return this.processInput(input);
    }
  }

  async getCapabilitiesDescription(): Promise<string> {
    return `
I'm your General Assistant, part of the Polaris AI system. Here's what I can help you with:

**Core Capabilities:**
• Answer questions and provide information
• Help with problem-solving and analysis
• Break down complex tasks into manageable steps
• Generate creative ideas and brainstorm solutions
• Assist with planning and organization
• Provide explanations and reasoning

**Special Features:**
• Reasoning-based responses (I think through problems systematically)
• Tool integration for specialized tasks
• Memory of our conversation context
• Confidence scoring for my responses
• Detailed explanations of my thought process

**How I Work:**
1. **Analyze** your request to understand your intent
2. **Plan** the best approach to help you
3. **Execute** the plan with appropriate tools and reasoning
4. **Reflect** on the interaction to improve future responses

Just ask me anything, and I'll do my best to help! I'm designed to be thoughtful, accurate, and genuinely useful.
`;
  }

  async streamUserInput(input: UserInput): Promise<AsyncIterable<string>> {
    // Create a simple prompt for streaming
    const prompt = `User: ${input.content}`;
    return this.streamResponse(prompt);
  }
}

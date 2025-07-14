import { ReasoningAgent, ModelProvider, ModelConfig } from '../types';
import { GeneralAssistantAgent } from './general-assistant';
import { NutritionAgent } from './nutrition-agent';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  category: string;
  icon: string;
}

export class AgentRegistry {
  private agents: Map<string, ReasoningAgent> = new Map();
  private agentFactories: Map<string, (provider: ModelProvider, config: ModelConfig) => ReasoningAgent> = new Map();

  constructor() {
    this.registerAgentFactories();
  }

  private registerAgentFactories(): void {
    // Register available agent types
    this.agentFactories.set('general-assistant', (provider, config) =>
      new GeneralAssistantAgent(provider, config)
    );

    this.agentFactories.set('nutrition-agent', (provider, config) =>
      new NutritionAgent(provider, config)
    );
  }

  /**
   * Get list of available agent types
   */
  getAvailableAgents(): AgentInfo[] {
    return [
      {
        id: 'general-assistant',
        name: 'General Assistant',
        description: 'Versatile AI assistant for general tasks, questions, and conversations',
        capabilities: [
          'question-answering',
          'task-planning',
          'creative-writing',
          'analysis',
          'brainstorming',
          'step-by-step-guides'
        ],
        category: 'General',
        icon: '🤖'
      },
      {
        id: 'nutrition-agent',
        name: 'Dr. Nutri',
        description: 'Specialized nutrition expert for meal planning and dietary guidance',
        capabilities: [
          'meal-planning',
          'nutrition-analysis',
          'macro-calculation',
          'weight-management',
          'sports-nutrition',
          'dietary-restrictions',
          'recipe-suggestions',
          'shopping-lists'
        ],
        category: 'Health & Wellness',
        icon: '🥗'
      }
    ];
  }

  /**
   * Get or create an agent instance
   */
  async getAgent(
    agentId: string,
    provider: ModelProvider,
    config: ModelConfig
  ): Promise<ReasoningAgent> {
    // Check if we already have an initialized agent
    const existing = this.agents.get(agentId);
    if (existing) {
      return existing;
    }

    // Create new agent instance
    const factory = this.agentFactories.get(agentId);
    if (!factory) {
      throw new Error(`Unknown agent type: ${agentId}`);
    }

    const agent = factory(provider, config);
    await agent.initialize();

    // Store the initialized agent
    this.agents.set(agentId, agent);

    return agent;
  }

  /**
   * Get agent info by ID
   */
  getAgentInfo(agentId: string): AgentInfo | undefined {
    return this.getAvailableAgents().find(agent => agent.id === agentId);
  }

  /**
   * Clear all initialized agents (useful when switching providers)
   */
  clearAgents(): void {
    this.agents.clear();
  }

  /**
   * Get currently active agent IDs
   */
  getActiveAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Check if an agent type is available
   */
  isAgentAvailable(agentId: string): boolean {
    return this.agentFactories.has(agentId);
  }

  /**
   * Get default agent ID
   */
  getDefaultAgentId(): string {
    return 'general-assistant';
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();

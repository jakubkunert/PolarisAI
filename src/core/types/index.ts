// Core types for PolarisAI multi-agent system

export interface UserInput {
  id: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image';
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image' | 'action';
  confidence: number;
  metadata?: Record<string, unknown>;
  reasoning?: string;
}

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  type: 'local' | 'remote';
  authenticate(apiKey?: string): Promise<boolean>;
  generateResponse(prompt: string, config: ModelConfig): Promise<string>;
  streamResponse(prompt: string, config: ModelConfig): AsyncIterable<string>;
  isAvailable(): Promise<boolean>;
  getStatus(): { authenticated: boolean; available: boolean; id: string; name: string; [key: string]: unknown };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(params: Record<string, unknown>): Promise<unknown>;
}

export interface Analysis {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  context: Record<string, unknown>;
  previousConversation?: string[];
}

export interface ActionPlan {
  id: string;
  steps: ActionStep[];
  estimatedDuration: number;
  requiresApproval: boolean;
}

export interface ActionStep {
  id: string;
  action: string;
  parameters: Record<string, unknown>;
  dependencies: string[];
  estimatedDuration: number;
}

export interface LearningUpdate {
  patterns: Record<string, unknown>;
  preferences: Record<string, unknown>;
  feedback: 'positive' | 'negative' | 'neutral';
  context: string;
}

export interface LongTermMemory {
  userId: string;
  agentId: string;
  memories: Memory[];
  patterns: Record<string, unknown>;
  preferences: Record<string, unknown>;
}

export interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  importance: number;
  tags: string[];
  embedding?: number[];
}

export interface TaskPlanner {
  analyzeTask(input: UserInput): Promise<Analysis>;
  createPlan(analysis: Analysis): Promise<ActionPlan>;
  executePlan(plan: ActionPlan): Promise<AgentResponse>;
}

export interface ReasoningAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;

  // Core components
  planner: TaskPlanner;
  memory: LongTermMemory;
  tools: Tool[];

  // Reasoning process
  analyze(input: UserInput): Promise<Analysis>;
  plan(analysis: Analysis): Promise<ActionPlan>;
  execute(plan: ActionPlan): Promise<AgentResponse>;
  reflect(response: AgentResponse): Promise<LearningUpdate>;

  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelProvider: string;
  modelConfig: ModelConfig;
  capabilities: string[];
  tools: string[];
  isActive: boolean;
  customSettings: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  apiKeys: Record<string, string>; // encrypted
  agents: AgentConfig[];
  subscription: SubscriptionInfo;
}

export interface UserPreferences {
  defaultModel: string;
  voiceEnabled: boolean;
  dataRetention: string;
  language: string;
  timezone: string;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  dataProcessingConsent: boolean;
  analyticsConsent: boolean;
  localProcessingOnly: boolean;
  shareWithAgents: boolean;
}

export interface SubscriptionInfo {
  plan: 'free' | 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  expiresAt?: Date;
  features: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  agentId: string;
  messages: (UserInput | AgentResponse)[];
  startedAt: Date;
  lastActivity: Date;
  status: 'active' | 'paused' | 'completed';
}

export interface AgentOrchestrator {
  agents: Map<string, ReasoningAgent>;
  activeSession: ChatSession | null;

  registerAgent(agent: ReasoningAgent): void;
  routeMessage(input: UserInput): Promise<AgentResponse>;
  coordinateAgents(task: string): Promise<AgentResponse[]>;
  getAgentStatus(agentId: string): Promise<'active' | 'inactive' | 'error'>;
}

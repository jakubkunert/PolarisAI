import { ModelProvider, ModelConfig } from '../types';

export abstract class BaseModelProvider implements ModelProvider {
  public readonly id: string;
  public readonly name: string;
  public readonly type: 'local' | 'remote';
  
  protected apiKey?: string;
  protected isAuthenticated = false;
  
  constructor(id: string, name: string, type: 'local' | 'remote') {
    this.id = id;
    this.name = name;
    this.type = type;
  }
  
  abstract authenticate(apiKey?: string): Promise<boolean>;
  abstract generateResponse(prompt: string, config: ModelConfig): Promise<string>;
  abstract streamResponse(prompt: string, config: ModelConfig): AsyncIterable<string>;
  abstract isAvailable(): Promise<boolean>;
  
  protected validateConfig(config: ModelConfig): void {
    if (config.temperature < 0 || config.temperature > 1) {
      throw new Error('Temperature must be between 0 and 1');
    }
    if (config.maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }
    if (config.topP < 0 || config.topP > 1) {
      throw new Error('Top P must be between 0 and 1');
    }
  }
  
  protected buildSystemPrompt(basePrompt: string, config: ModelConfig): string {
    const systemPrompt = config.systemPrompt || '';
    return systemPrompt ? `${systemPrompt}\n\n${basePrompt}` : basePrompt;
  }
  
  getStatus(): { authenticated: boolean; available: boolean; id: string; name: string } {
    return {
      authenticated: this.isAuthenticated,
      available: false, // Will be overridden by subclasses
      id: this.id,
      name: this.name
    };
  }
} 
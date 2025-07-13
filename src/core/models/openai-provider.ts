import { BaseModelProvider } from './base-provider';
import { ModelConfig } from '../types';

export class OpenAIProvider extends BaseModelProvider {
  private baseUrl = 'https://api.openai.com/v1';
  private defaultModel = 'gpt-4';
  
  constructor(model: string = 'gpt-4') {
    super('openai', 'OpenAI', 'remote');
    this.defaultModel = model;
  }
  
  async authenticate(apiKey?: string): Promise<boolean> {
    if (!apiKey) {
      this.isAuthenticated = false;
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        this.apiKey = apiKey;
        this.isAuthenticated = true;
        return true;
      }
      
      this.isAuthenticated = false;
      return false;
    } catch (error) {
      console.error('OpenAI authentication error:', error);
      this.isAuthenticated = false;
      return false;
    }
  }
  
  async generateResponse(prompt: string, config: ModelConfig): Promise<string> {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error('OpenAI provider not authenticated');
    }
    
    this.validateConfig(config);
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
  
  async* streamResponse(prompt: string, config: ModelConfig): AsyncIterable<string> {
    if (!this.isAuthenticated || !this.apiKey) {
      throw new Error('OpenAI provider not authenticated');
    }
    
    this.validateConfig(config);
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stream: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.isAuthenticated && this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`,
        } : {},
      });
      
      return response.status !== 500;
    } catch (error) {
      return false;
    }
  }
  
  getStatus() {
    return {
      ...super.getStatus(),
      available: true,
      model: this.defaultModel,
    };
  }
} 
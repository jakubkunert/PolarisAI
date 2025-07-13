import { BaseModelProvider } from './base-provider';
import { ModelConfig } from '../types';

export class OllamaProvider extends BaseModelProvider {
  private baseUrl = 'http://localhost:11434';
  private defaultModel = 'llama3.2';

  constructor(model: string = 'llama3.2', baseUrl?: string) {
    super('ollama', 'Ollama', 'local');
    this.defaultModel = model;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  async authenticate(_apiKey?: string): Promise<boolean> {
    // Ollama doesn't require authentication for local instances
    // Just check if the service is available
    try {
      const available = await this.isAvailable();
      this.isAuthenticated = available;
      return available;
    } catch (_error) {
      return false;
    }
  }

  async generateResponse(prompt: string, config: ModelConfig): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Ollama provider not available');
    }

    this.validateConfig(config);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        prompt: prompt,
        options: {
          temperature: config.temperature,
          top_p: config.topP,
          num_predict: config.maxTokens,
          repeat_penalty: config.frequencyPenalty + 1, // Ollama uses different scale
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  async* streamResponse(prompt: string, config: ModelConfig): AsyncIterable<string> {
    if (!this.isAuthenticated) {
      throw new Error('Ollama provider not available');
    }

    this.validateConfig(config);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        prompt: prompt,
        options: {
          temperature: config.temperature,
          top_p: config.topP,
          num_predict: config.maxTokens,
          repeat_penalty: config.frequencyPenalty + 1,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              yield parsed.response;
            }

            // Check if generation is complete
            if (parsed.done === true) {
              return;
            }
          } catch (_e) {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        // Check if our model is available
        const models = data.models || [];
        return models.some((model: { name: string }) => model.name === this.defaultModel);
      }

      return false;
    } catch (_error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (response.ok) {
        const data = await response.json();
        return data.models?.map((model: { name: string }) => model.name) || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error pulling Ollama model:', error);
      return false;
    }
  }

  getStatus() {
    return {
      ...super.getStatus(),
      available: this.isAuthenticated,
      model: this.defaultModel,
      baseUrl: this.baseUrl,
    };
  }
}

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

      if (available) {
        console.log(
          `Ollama authenticated successfully using model: ${this.defaultModel}`
        );
      } else {
        console.error(
          'Ollama authentication failed: Service not available or no models found'
        );
      }

      return available;
    } catch (error) {
      console.error('Ollama authentication error:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  private cleanResponse(response: string): string {
    // Remove thinking process tags
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Remove internal execution details
    cleaned = cleaned.replace(/\*\*Plan ID:.*?\*\*/g, '');
    cleaned = cleaned.replace(/\*\*Steps to execute:.*?\*\*/g, '');
    cleaned = cleaned.replace(/\*\*Estimated Duration:.*?\*\*/g, '');
    cleaned = cleaned.replace(/\*\*Requires Approval:.*?\*\*/g, '');
    cleaned = cleaned.replace(/\*\*Reasoning Process:.*?\*\*/g, '');

    // Remove excessive internal structure
    cleaned = cleaned.replace(/- Step:.*?\n/g, '');
    cleaned = cleaned.replace(/- Parameters:.*?\n/g, '');
    cleaned = cleaned.replace(/\*\*Response:\*\*/g, '');
    cleaned = cleaned.replace(/\*\*Conclusion:\*\*/g, '');

    // Clean up extra whitespace and formatting
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.trim();

    return cleaned;
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
          repeat_penalty: config.frequencyPenalty + 1,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const rawResponse = data.response || '';

    // Clean the response before returning
    return this.cleanResponse(rawResponse);
  }

  async *streamResponse(
    prompt: string,
    config: ModelConfig
  ): AsyncIterable<string> {
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
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let insideThinking = false;

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
              const chunkContent = parsed.response;
              fullResponse += chunkContent;

              // Simple thinking tag filtering for streaming
              // If we encounter <think>, start filtering
              if (chunkContent.includes('<think>')) {
                insideThinking = true;
              }

              // If we encounter </think>, stop filtering
              if (chunkContent.includes('</think>')) {
                insideThinking = false;
                // Skip this chunk as it likely contains the closing tag
                continue;
              }

              // Only yield content if we're not inside thinking tags
              if (!insideThinking && chunkContent.trim()) {
                yield chunkContent;
              }
            }

            // Check if generation is complete
            if (parsed.done === true) {
              // At the end, clean the full response and yield any remaining content
              const cleaned = this.cleanResponse(fullResponse);
              const alreadyStreamed = fullResponse.replace(
                /<think>[\s\S]*?<\/think>/g,
                ''
              );

              // Only yield additional content if cleaning revealed more than what was streamed
              if (cleaned.length > alreadyStreamed.length) {
                const remaining = cleaned.slice(alreadyStreamed.length);
                if (remaining.trim()) {
                  yield remaining;
                }
              }
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
        const models = data.models || [];

        if (models.length === 0) {
          return false; // No models available
        }

        // Check if our preferred model is available
        const hasPreferredModel = models.some(
          (model: { name: string }) => model.name === this.defaultModel
        );

        if (hasPreferredModel) {
          return true;
        }

        // If preferred model not available, use the first available model
        const firstModel = models[0];
        if (firstModel && firstModel.name) {
          console.log(
            `Ollama: Preferred model '${this.defaultModel}' not found. Using '${firstModel.name}' instead.`
          );
          this.defaultModel = firstModel.name;
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Ollama availability check failed:', error);
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

  setModel(modelName: string): void {
    this.defaultModel = modelName;
  }

  getCurrentModel(): string {
    return this.defaultModel;
  }
}

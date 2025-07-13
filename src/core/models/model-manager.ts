import { ModelProvider, ModelConfig } from '../types';
import { OpenAIProvider } from './openai-provider';
import { OllamaProvider } from './ollama-provider';

export class ModelManager {
  private providers: Map<string, ModelProvider> = new Map();
  private defaultProvider?: ModelProvider;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Register built-in providers
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new OllamaProvider());
  }

  registerProvider(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);

    // Set the first provider as default if none is set
    if (!this.defaultProvider) {
      this.defaultProvider = provider;
    }
  }

  getProvider(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  getProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailableProviders(): ModelProvider[] {
    return this.getProviders().filter(provider => {
      // For local providers, check if they're available
      // For remote providers, just return them (authentication is separate)
      return provider.type === 'remote' || provider.type === 'local';
    });
  }

  async getAuthenticatedProviders(): Promise<ModelProvider[]> {
    const authenticated: ModelProvider[] = [];

    for (const provider of this.providers.values()) {
      try {
        const isAuth = await this.isProviderAuthenticated(provider);
        if (isAuth) {
          authenticated.push(provider);
        }
      } catch (error) {
        console.error(
          `Error checking authentication for ${provider.id}:`,
          error
        );
      }
    }

    return authenticated;
  }

  private async isProviderAuthenticated(
    provider: ModelProvider
  ): Promise<boolean> {
    try {
      // For local providers, check if they're available
      if (provider.type === 'local') {
        return await provider.isAvailable();
      }

      // For remote providers, check their authentication status
      const status = provider.getStatus();
      return status.authenticated;
    } catch (_error) {
      return false;
    }
  }

  async authenticateProvider(id: string, apiKey?: string): Promise<boolean> {
    const provider = this.getProvider(id);
    if (!provider) {
      return false;
    }

    try {
      return await provider.authenticate(apiKey);
    } catch (error) {
      console.error(`Authentication failed for provider ${id}:`, error);
      return false;
    }
  }

  async generateResponse(
    providerId: string,
    prompt: string,
    config: ModelConfig
  ): Promise<string> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Validate configuration
    if (!this.validateModelConfig(config)) {
      throw new Error('Invalid model configuration');
    }

    // Check if provider is authenticated (for remote providers)
    if (
      provider.type === 'remote' &&
      !(await this.isProviderAuthenticated(provider))
    ) {
      throw new Error('Provider not authenticated');
    }

    return await provider.generateResponse(prompt, config);
  }

  async streamResponse(
    providerId: string,
    prompt: string,
    config: ModelConfig
  ): Promise<AsyncIterable<string>> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return provider.streamResponse(prompt, config);
  }

  async getBestAvailableProvider(): Promise<ModelProvider | null> {
    // First try to get authenticated providers
    const authenticatedProviders = await this.getAuthenticatedProviders();

    if (authenticatedProviders.length > 0) {
      // Prioritize local providers for privacy
      const localProviders = authenticatedProviders.filter(
        p => p.type === 'local'
      );
      if (localProviders.length > 0) {
        return localProviders[0];
      }
      // Fall back to remote providers
      return authenticatedProviders[0];
    }

    // If no authenticated providers, fall back to available providers
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      return null;
    }

    // Filter to only those that are actually available
    const actuallyAvailable = [];
    for (const provider of availableProviders) {
      try {
        if (await provider.isAvailable()) {
          actuallyAvailable.push(provider);
        }
      } catch (_error) {
        // Skip providers that throw errors
      }
    }

    if (actuallyAvailable.length === 0) {
      return null;
    }

    // Prioritize local providers for privacy
    const localProviders = actuallyAvailable.filter(p => p.type === 'local');
    if (localProviders.length > 0) {
      return localProviders[0];
    }

    // Fall back to remote providers
    return actuallyAvailable[0];
  }

  setDefaultProvider(id: string): void {
    const provider = this.getProvider(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }

    this.defaultProvider = provider;
  }

  getDefaultProvider(): ModelProvider | undefined {
    return this.defaultProvider;
  }

  async getProvidersStatus(): Promise<Record<string, unknown>> {
    const status: Record<string, unknown> = {};

    for (const [id, provider] of this.providers.entries()) {
      try {
        const isAvailable = await provider.isAvailable();
        const providerStatus = provider.getStatus();
        status[id] = {
          ...providerStatus,
          available: isAvailable,
        };
      } catch (error) {
        try {
          const providerStatus = provider.getStatus();
          status[id] = {
            ...providerStatus,
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        } catch (_statusError) {
          // If even getStatus() fails, provide minimal info
          status[id] = {
            id: provider.id,
            name: provider.name,
            authenticated: false,
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    }

    return status;
  }

  getDefaultModelConfig(): ModelConfig {
    return {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };
  }

  validateModelConfig(config: ModelConfig): boolean {
    try {
      if (config.temperature < 0 || config.temperature > 1) return false;
      if (config.maxTokens < 1) return false;
      if (config.topP < 0 || config.topP > 1) return false;
      if (config.frequencyPenalty < -2 || config.frequencyPenalty > 2)
        return false;
      if (config.presencePenalty < -2 || config.presencePenalty > 2)
        return false;

      return true;
    } catch (_error) {
      return false;
    }
  }
}

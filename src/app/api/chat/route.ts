import { NextRequest, NextResponse } from 'next/server';
import { ModelManager } from '@/core/models/model-manager';
import { agentRegistry } from '@/core/agents/agent-registry';
import { UserInput, ReasoningAgent } from '@/core/types';
import { BaseAgent } from '@/core/agents/base-agent';
import { OllamaProvider } from '@/core/models/ollama-provider';
import { OpenAIProvider } from '@/core/models/openai-provider';

// Initialize the model manager
const modelManager = new ModelManager();

// Initialize authentication for local providers
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await modelManager.initialize();
    isInitialized = true;
  }
}

// Cache for initialized agents
const agentCache = new Map<string, ReasoningAgent>();

async function initializeAgent(
  providerId?: string,
  apiKey?: string,
  selectedOllamaModel?: string,
  selectedOpenAIModel?: string,
  agentId?: string
) {
  const selectedAgentId = agentId || agentRegistry.getDefaultAgentId();
  const cacheKey = `${selectedAgentId}-${providerId || 'default'}`;

  // Reset cache if we're switching providers
  if (providerId) {
    agentCache.clear();
    agentRegistry.clearAgents();
  }

  // Check if we have a cached agent
  const cachedAgent = agentCache.get(cacheKey);
  if (cachedAgent) {
    return cachedAgent;
  }
    let provider;

    if (providerId) {
      // Use specific provider
      provider = modelManager.getProvider(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      // Authenticate if API key is provided
      if (apiKey) {
        const success = await modelManager.authenticateProvider(
          providerId,
          apiKey
        );
        if (!success) {
          throw new Error(`Failed to authenticate with ${providerId}`);
        }
      }

      // Set Ollama model if provided
      if (providerId === 'ollama' && selectedOllamaModel) {
        const ollamaProvider = provider as OllamaProvider;
        ollamaProvider.setModel(selectedOllamaModel);
      }

      // Set OpenAI model if provided
      if (providerId === 'openai' && selectedOpenAIModel) {
        const openaiProvider = provider as OpenAIProvider;
        openaiProvider.setModel(selectedOpenAIModel);
      }
    } else {
      // Try to get an already authenticated provider
      provider = await modelManager.getBestAvailableProvider();

      if (!provider) {
        // If no authenticated provider, get any available provider
        const availableProviders = modelManager.getAvailableProviders();
        if (availableProviders.length === 0) {
          throw new Error('No model providers available');
        }
        provider = availableProviders[0]; // Use first available provider
      }
    }

    // Check if provider is authenticated (for remote providers)
    if (provider.type === 'remote' && !provider.getStatus().authenticated) {
      throw new Error(
        `Provider ${provider.id} requires authentication. Please provide an API key.`
      );
    }

    const config = modelManager.getDefaultModelConfig();
    const agent = await agentRegistry.getAgent(selectedAgentId, provider, config);

    // Store provider info with agent for later reference
    (agent as any).modelProvider = provider;
    (agent as any).modelConfig = config;
    (agent as any).selectedOllamaModel = selectedOllamaModel;
    (agent as any).selectedOpenAIModel = selectedOpenAIModel;

    // Cache the agent
    agentCache.set(cacheKey, agent);

    return agent;
}

// Helper function to create streaming response
async function* streamAgentResponse(
  agent: ReasoningAgent,
  userInput: UserInput
): AsyncIterable<string> {
  try {
        // Get the streaming response from the agent
    const baseAgent = agent as BaseAgent;
    // For now, use fallback streaming if agent doesn't have streamUserInput
    const stream = (baseAgent as any).streamUserInput ?
      await (baseAgent as any).streamUserInput(userInput) :
      await (baseAgent as any).streamResponse(userInput.content);

    // Track the full response for metadata
    let fullResponse = '';

        // Yield the initial message metadata
    const modelProvider = (agent as any).modelProvider;
    let currentModel = 'Default';

    // Get the correct model name based on provider type
    if (modelProvider) {
      if (modelProvider.id === 'ollama') {
        const ollamaProvider = modelProvider as OllamaProvider;
        currentModel = ollamaProvider.getCurrentModel();
      } else if (modelProvider.id === 'openai') {
        const openaiProvider = modelProvider as OpenAIProvider;
        currentModel = openaiProvider.getCurrentModel();
      } else {
        currentModel = modelProvider.id || 'Default';
      }
    }

    yield JSON.stringify({
      type: 'start',
      id: `response_${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      modelProvider: modelProvider?.name || 'Unknown',
      modelName: currentModel,
      timestamp: new Date().toISOString(),
    }) + '\n';

    // Stream the content
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield JSON.stringify({
        type: 'content',
        content: chunk,
      }) + '\n';
    }

    // Yield the final metadata
    yield JSON.stringify({
      type: 'end',
      fullContent: fullResponse,
      confidence: 0.9, // Default confidence for streaming
      metadata: {
        streaming: true,
        timestamp: new Date().toISOString(),
      },
    }) + '\n';
  } catch (error) {
    yield JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }) + '\n';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure model manager is initialized
    await ensureInitialized();

    const body = await request.json();
    const {
      message,
      provider,
      apiKey,
      selectedOllamaModel,
      selectedOpenAIModel,
      agentId,
      stream = false,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize the agent with provider and API key if provided
    const agent = await initializeAgent(provider, apiKey, selectedOllamaModel, selectedOpenAIModel, agentId);

    // Create user input
    const userInput: UserInput = {
      id: `input_${Date.now()}`,
      content: message,
      timestamp: new Date(),
      type: 'text',
      metadata: {},
    };

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamAgentResponse(agent, userInput)) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'error',
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                }) + '\n'
              )
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Handle regular response
    const baseAgent = agent as BaseAgent;
    const response = await baseAgent.processInput(userInput);

    // Get model information
    const modelProvider = (agent as any).modelProvider;
    let currentModel = 'Default';

    // Get the correct model name based on provider type
    if (modelProvider) {
      if (modelProvider.id === 'ollama') {
        const ollamaProvider = modelProvider as OllamaProvider;
        currentModel = ollamaProvider.getCurrentModel();
      } else if (modelProvider.id === 'openai') {
        const openaiProvider = modelProvider as OpenAIProvider;
        currentModel = openaiProvider.getCurrentModel();
      } else {
        currentModel = modelProvider.id || 'Default';
      }
    }

    // Return the response
    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        confidence: response.confidence,
        reasoning: response.reasoning,
        timestamp: response.timestamp,
        metadata: response.metadata,
      },
      agent: {
        id: agent.id,
        name: agent.name,
        status: baseAgent.getStatus(),
      },
      model: {
        provider: modelProvider?.name || 'Unknown',
        name: currentModel,
        type: modelProvider?.type || 'unknown',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Ensure model manager is initialized
    await ensureInitialized();

    // Get available providers without requiring authentication
    const availableProviders = modelManager.getAvailableProviders().map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.getStatus(),
    }));

    // Get available agents from registry
    const availableAgents = agentRegistry.getAvailableAgents();

    // Try to get current agent status if any agents are active
    let agentStatus = null;
    const activeAgentIds = agentRegistry.getActiveAgentIds();
    if (activeAgentIds.length > 0) {
      // For now, just return info about available agents
      agentStatus = {
        id: 'multiple',
        name: 'Agent Registry',
        initialized: true,
        capabilities: availableAgents.flatMap(a => a.capabilities).slice(0, 5),
        memoryCount: 0,
      };
    }

    return NextResponse.json({
      success: true,
      providers: availableProviders,
      agents: availableAgents,
      agent: agentStatus,
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// New endpoint to get available Ollama models
export async function PUT(request: NextRequest) {
  try {
    await ensureInitialized();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'get-ollama-models') {
      const ollamaProvider = modelManager.getProvider('ollama');
      if (!ollamaProvider || ollamaProvider.id !== 'ollama') {
        return NextResponse.json(
          { error: 'Ollama provider not found' },
          { status: 404 }
        );
      }

      const models = await (
        ollamaProvider as OllamaProvider
      ).getAvailableModels();
      return NextResponse.json({
        success: true,
        models,
      });
    }

    if (action === 'get-openai-models') {
      const openaiProvider = modelManager.getProvider('openai');
      if (!openaiProvider || openaiProvider.id !== 'openai') {
        return NextResponse.json(
          { error: 'OpenAI provider not found' },
          { status: 404 }
        );
      }

      const models = (openaiProvider as OpenAIProvider).getAvailableModels();
      return NextResponse.json({
        success: true,
        models,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get models',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

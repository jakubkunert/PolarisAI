import { NextRequest, NextResponse } from 'next/server';
import { ModelManager } from '@/core/models/model-manager';
import { GeneralAssistantAgent } from '@/core/agents/general-assistant';
import { UserInput } from '@/core/types';
import { OllamaProvider } from '@/core/models/ollama-provider';

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

let generalAgent: GeneralAssistantAgent | null = null;

async function initializeAgent(
  providerId?: string,
  apiKey?: string,
  selectedOllamaModel?: string
) {
  // Reset agent if we're switching providers
  if (generalAgent && providerId) {
    generalAgent = null;
  }

  if (!generalAgent) {
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
    generalAgent = new GeneralAssistantAgent(provider, config);
    await generalAgent.initialize();
  }

  return generalAgent;
}

// Helper function to create streaming response
async function* streamAgentResponse(
  agent: GeneralAssistantAgent,
  userInput: UserInput
): AsyncIterable<string> {
  try {
    // Get the streaming response from the agent
    const stream = await agent.streamUserInput(userInput);

    // Track the full response for metadata
    let fullResponse = '';

    // Yield the initial message metadata
    yield JSON.stringify({
      type: 'start',
      id: `response_${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
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
      stream = false,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize the agent with provider and API key if provided
    const agent = await initializeAgent(provider, apiKey, selectedOllamaModel);

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
    const response = await agent.processInput(userInput);

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
        status: agent.getStatus(),
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

    // Try to get agent status if possible, but don't fail if it's not available
    let agentStatus = null;
    try {
      if (generalAgent) {
        const status = generalAgent.getStatus();
        agentStatus = {
          id: status.id,
          name: status.name,
          initialized: status.initialized,
          capabilities: status.capabilities,
          memoryCount: status.memoryCount,
        };
      }
    } catch (agentError) {
      // Agent not available, that's okay for status endpoint
      console.log('Agent not available for status check:', agentError);
    }

    return NextResponse.json({
      success: true,
      providers: availableProviders,
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

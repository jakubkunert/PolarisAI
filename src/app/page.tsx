'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Checkbox,
  useToast,
  MarkdownRenderer
} from '@/components/ui';
import { usePersistedConfig } from '@/lib/hooks/usePersistedConfig';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
  confidence?: number;
  reasoning?: string;
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
}

interface AgentStatus {
  id: string;
  name: string;
  initialized: boolean;
  capabilities: string[];
  memoryCount: number;
}

interface Provider {
  id: string;
  name: string;
  type: 'local' | 'remote';
  status: Record<string, unknown>;
}

// Icon components
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);

    const { showToast, ToastContainer } = useToast();

  const handleConfigSave = useCallback((savedConfig: { rememberSettings: boolean }) => {
    if (savedConfig.rememberSettings) {
      showToast('Settings saved automatically', 'success');
    }
  }, [showToast]);

  const { config, isLoaded, updateConfig, clearConfig, toggleRememberSettings } = usePersistedConfig(handleConfigSave);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (data.success) {
        setProviders(data.providers);
        setAgentStatus(data.agent);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: input,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    if (config.streamingEnabled) {
      await handleStreamingResponse(currentInput);
    } else {
      await handleRegularResponse(currentInput);
    }
  };

  const handleStreamingResponse = async (message: string) => {
    const streamingMessage: ChatMessage = {
      id: `streaming_${Date.now()}`,
      content: '',
      type: 'agent',
      timestamp: new Date(),
      isStreaming: true,
      confidence: 0.9
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: config.selectedProvider || undefined,
          apiKey: config.apiKey || undefined,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);

                if (data.type === 'content' && data.content) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === streamingMessage.id
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  ));
                } else if (data.type === 'end') {
                  setMessages(prev => prev.map(msg =>
                    msg.id === streamingMessage.id
                      ? {
                          ...msg,
                          isStreaming: false,
                          confidence: data.confidence || 0.9,
                          metadata: data.metadata
                        }
                      : msg
                  ));
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'agent',
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessage.id).concat(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleRegularResponse = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: config.selectedProvider || undefined,
          apiKey: config.apiKey || undefined,
          stream: false
        }),
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage: ChatMessage = {
          id: data.response.id,
          content: data.response.content,
          type: 'agent',
          timestamp: new Date(data.response.timestamp),
          confidence: data.response.confidence,
          reasoning: data.response.reasoning,
          metadata: data.response.metadata
        };

        setMessages(prev => [...prev, agentMessage]);
        setAgentStatus(data.agent.status);
      } else {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          content: `Error: ${data.error}`,
          type: 'agent',
          timestamp: new Date(),
          confidence: 0
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'agent',
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while configuration is being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Card variant="gradient" className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PolarisAI
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Multi-Agent Reasoning System
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowSettings(!showSettings)}
                icon={<SettingsIcon />}
              >
                Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          {showSettings && (
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Configure your AI model provider and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Select
                  label="Model Provider"
                  value={config.selectedProvider}
                  onChange={(e) => updateConfig({ selectedProvider: e.target.value })}
                  placeholder="Select a provider"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type})
                    </option>
                  ))}
                </Select>

                {config.selectedProvider === 'openai' && (
                  <Input
                    type="password"
                    label="OpenAI API Key"
                    value={config.apiKey}
                    onChange={(e) => updateConfig({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    helpText="Your API key is stored locally and never sent to our servers"
                  />
                )}

                <div className="pt-4">
                  <Checkbox
                    checked={config.rememberSettings}
                    onChange={toggleRememberSettings}
                    label="Remember settings"
                    description="Keep your provider selection and API key saved between sessions"
                  />
                </div>

                <div className="pt-4">
                  <Checkbox
                    checked={config.streamingEnabled}
                    onChange={(e) => updateConfig({ streamingEnabled: e.target.checked })}
                    label="Enable streaming responses"
                    description="Show responses as they're generated for a more interactive experience"
                  />
                </div>

                <div className="pt-4">
                  <Checkbox
                    checked={config.showReasoning}
                    onChange={(e) => updateConfig({ showReasoning: e.target.checked })}
                    label="Show reasoning process"
                    description="Display the agent's thinking and reasoning behind responses"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearConfig();
                      showToast('Settings cleared', 'default');
                    }}
                    disabled={!config.selectedProvider && !config.apiKey}
                  >
                    Clear Settings
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Provider Status</h3>
                  <div className="space-y-2">
                    {providers.map((provider) => (
                      <div key={provider.id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{provider.name}</span>
                        <Badge
                          variant={provider.status.available ? 'success' : 'destructive'}
                          dot
                        >
                          {provider.status.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {agentStatus && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3">Agent Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{agentStatus.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initialized:</span>
                        <Badge variant={agentStatus.initialized ? 'success' : 'destructive'}>
                          {agentStatus.initialized ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Memory:</span>
                        <Badge variant="secondary">
                          {agentStatus.memoryCount} items
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-600 text-sm">Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agentStatus.capabilities.map((cap) => (
                            <Badge key={cap} variant="outline" size="sm">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          <Card className={`${showSettings ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BotIcon />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome to PolarisAI!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start a conversation with the General Assistant
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Try asking:</span>
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>• &quot;How does the reasoning system work?&quot;</p>
                        <p>• &quot;Help me brainstorm ideas for a project&quot;</p>
                        <p>• &quot;Explain quantum computing&quot;</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex gap-4">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {message.type === 'user' ? <UserIcon /> : <BotIcon />}
                      </div>

                      {/* Message */}
                      <div className="flex-1 min-w-0">
                        <div className={`rounded-lg p-4 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white ml-12'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.type === 'user' ? (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>

                        {message.type === 'agent' && (
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {message.isStreaming && (
                                <Badge variant="outline" size="sm">
                                  <span className="flex items-center gap-1">
                                    <span className="animate-pulse">●</span>
                                    Streaming...
                                  </span>
                                </Badge>
                              )}
                              {message.confidence !== undefined && (
                                <Badge variant="secondary" size="sm">
                                  Confidence: {Math.round(message.confidence * 100)}%
                                </Badge>
                              )}
                              {config.showReasoning && message.reasoning && (
                                <Badge variant="outline" size="sm">
                                  💭 Reasoning Available
                                </Badge>
                              )}
                            </div>

                            {config.showReasoning && message.reasoning && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-blue-600 font-medium">🧠 Agent Reasoning:</span>
                                </div>
                                <div className="text-blue-800 whitespace-pre-wrap">
                                  {message.reasoning}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                      <BotIcon />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[44px] resize-none"
                    rows={1}
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    size="lg"
                    variant="gradient"
                    icon={<SendIcon />}
                    loading={loading}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

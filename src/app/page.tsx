'use client';

import { useState, useEffect } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
  confidence?: number;
  reasoning?: string;
  metadata?: any;
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
  status: any;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          provider: selectedProvider || undefined,
          apiKey: apiKey || undefined
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PolarisAI</h1>
              <p className="text-gray-600">Multi-Agent Reasoning System</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProvider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Provider Status</h3>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{provider.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        provider.status.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.status.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {agentStatus && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Agent Status</h3>
                  <div className="text-sm text-gray-700">
                    <p><strong>Name:</strong> {agentStatus.name}</p>
                    <p><strong>Initialized:</strong> {agentStatus.initialized ? 'Yes' : 'No'}</p>
                    <p><strong>Memory Count:</strong> {agentStatus.memoryCount}</p>
                    <p><strong>Capabilities:</strong> {agentStatus.capabilities.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500">
                <p>Welcome to PolarisAI! Start a conversation with the General Assistant.</p>
                <p className="text-sm mt-2">Try asking: "How does the reasoning system work?" or "Help me brainstorm ideas for a project"</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'agent' && (
                      <div className="mt-2 text-xs opacity-75">
                        {message.confidence !== undefined && (
                          <p>Confidence: {Math.round(message.confidence * 100)}%</p>
                        )}
                        {message.reasoning && (
                          <p className="mt-1">{message.reasoning}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <p>Thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

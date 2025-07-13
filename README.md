# PolarisAI - Multi-Agent Reasoning System

A modern, extensible multi-agent AI system built with Next.js, TypeScript, and modular architecture. PolarisAI provides a reasoning-based approach to AI interactions, supporting multiple LLM providers and designed for easy extension with new agents.

## 🌟 Features

### Core Architecture
- **Multi-Agent System**: Extensible framework for specialized AI agents
- **Reasoning Pipeline**: Analyze → Plan → Execute → Reflect workflow
- **Provider Agnostic**: Support for OpenAI, Ollama, and extensible to other providers
- **Local & Remote Models**: Run with local models (Ollama) or cloud APIs (OpenAI, Anthropic)
- **Memory System**: Persistent conversation memory and learning capabilities
- **Tool Integration**: Extensible tool system for agent capabilities

### Current Agents
- **General Assistant**: Versatile helper for various tasks and questions
- **Specialized Tools**: Text analysis, brainstorming, step-by-step planning
- **Reasoning Display**: Shows confidence levels and thought processes

### Technical Features
- **TypeScript**: Fully typed for better development experience
- **Next.js 15**: Modern React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **Modular Design**: Clean separation of concerns
- **GDPR Compliance**: Built-in privacy features and data protection



## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun (recommended)
- Optional: Ollama for local models

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:jakubkunert/PolarisAI.git
   cd polaris-ai
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Configuration

#### Using OpenAI
1. Get an API key from OpenAI
2. In the web interface, click "Settings"
3. Select "OpenAI" as provider
4. Enter your API key
5. Start chatting!

#### Using Ollama (Local Models)
1. Install Ollama: `https://ollama.ai`
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama service: `ollama serve`
4. The system will auto-detect Ollama and use it

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────┐
│            Frontend (Next.js)           │
├─────────────────────────────────────────┤
│              API Layer                  │
├─────────────────────────────────────────┤
│          Agent Orchestrator             │
├─────────────────────────────────────────┤
│    Agent 1    │    Agent 2    │  ...    │
├─────────────────────────────────────────┤
│           Model Providers               │
│  OpenAI │ Ollama │ Anthropic │ ...      │
└─────────────────────────────────────────┘
```

### Core Components

#### 1. Model Providers (`src/core/models/`)
- **BaseModelProvider**: Abstract base class for all providers
- **OpenAIProvider**: OpenAI GPT integration
- **OllamaProvider**: Local model support
- **ModelManager**: Handles provider registration and routing

#### 2. Agent System (`src/core/agents/`)
- **BaseAgent**: Abstract base class for all agents
- **BasicTaskPlanner**: Implements the reasoning pipeline
- **GeneralAssistantAgent**: General-purpose assistant
- **Tool System**: Extensible capabilities framework

#### 3. Type System (`src/core/types/`)
- Comprehensive TypeScript interfaces
- GDPR-compliant data structures
- Agent and model abstractions

### Reasoning Pipeline

Each agent follows a structured reasoning process:

1. **Analysis**: Understand user intent and context
2. **Planning**: Create step-by-step action plan
3. **Execution**: Carry out the plan with tools
4. **Reflection**: Learn from the interaction

## 🔧 API Reference

### Chat Endpoint

**POST** `/api/chat`

```typescript
// Request
{
  "message": "string",
  "provider": "openai" | "ollama" | string,
  "apiKey": "string" // Optional, for remote providers
}

// Response
{
  "success": boolean,
  "response": {
    "id": "string",
    "content": "string",
    "confidence": number, // 0-1
    "reasoning": "string",
    "timestamp": "string",
    "metadata": object
  },
  "agent": {
    "id": "string",
    "name": "string",
    "status": object
  }
}
```

**GET** `/api/chat`

Returns system status and available providers.

## 🔨 Development

### Project Structure
```
polaris-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/chat/          # API endpoints
│   │   └── page.tsx           # Main interface
│   ├── core/                  # Core system
│   │   ├── agents/            # Agent implementations
│   │   ├── models/            # Model providers
│   │   └── types/             # TypeScript definitions
│   ├── components/            # UI components
│   ├── lib/                   # Utilities
│   └── hosted/                # Premium features
├── docs/                      # Documentation
└── README.md
```

### Adding New Agents

1. **Create agent class**
   ```typescript
   // src/core/agents/my-agent.ts
   import { BaseAgent } from './base-agent';

   export class MyAgent extends BaseAgent {
     constructor(modelProvider: ModelProvider, modelConfig: ModelConfig) {
       super(
         'my-agent',
         'My Agent',
         'Description of what this agent does',
         ['capability1', 'capability2'],
         'System prompt for the agent...',
         modelProvider,
         modelConfig
       );
     }

     createMemory(): LongTermMemory {
       // Implement memory structure
     }

     createPlanner(): TaskPlanner {
       // Implement or use existing planner
     }
   }
   ```

2. **Register with orchestrator**
   ```typescript
   // In your orchestrator
   const agent = new MyAgent(modelProvider, modelConfig);
   orchestrator.registerAgent(agent);
   ```

### Adding New Model Providers

1. **Implement provider**
   ```typescript
   // src/core/models/my-provider.ts
   import { BaseModelProvider } from './base-provider';

   export class MyProvider extends BaseModelProvider {
     constructor() {
       super('my-provider', 'My Provider', 'remote');
     }

     async authenticate(apiKey?: string): Promise<boolean> {
       // Implement authentication
     }

     async generateResponse(prompt: string, config: ModelConfig): Promise<string> {
       // Implement response generation
     }

     // ... other required methods
   }
   ```

2. **Register with model manager**
   ```typescript
   // In model manager
   modelManager.registerProvider(new MyProvider());
   ```

## 🛡️ Privacy & Security

### Privacy First
- **Local Processing**: Run everything on your own infrastructure
- **Data Control**: You own and control all your data
- **No Tracking**: No telemetry or data collection
- **Open Source**: Full transparency in all operations

### Security Features
- **Self-Hosted**: Complete control over your environment
- **API Key Security**: Secure storage of model provider credentials
- **Audit Trail**: Full visibility into all operations
- **Customizable**: Modify security to your requirements

## 🤝 Contributing

We welcome contributions to PolarisAI! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup and workflow
- Git flow and commit conventions
- Code standards and testing
- Pull request process
- Adding new features and agents

### Quick Start for Contributors
1. Fork the repository
2. Set up your development environment (see [CONTRIBUTING.md](CONTRIBUTING.md))
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes and add tests
5. Submit a pull request

### Development
- **Language**: TypeScript
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Runtime**: Bun (recommended) or Node.js 18+
- **Database**: Optional (PostgreSQL for persistence)

For detailed development instructions, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📋 Roadmap

### Current Version (v0.1.0)
- ✅ Multi-agent reasoning system
- ✅ OpenAI and Ollama provider support
- ✅ Web interface with chat functionality
- ✅ Development workflow and contribution guidelines

### Upcoming Features
- **Enhanced Agent Capabilities**
  - Specialized agents for different domains
  - Advanced reasoning and planning
  - Multi-agent collaboration

- **Extended Model Support**
  - Anthropic Claude integration
  - Google Gemini support
  - Custom model providers

- **User Experience**
  - Voice interaction support
  - Mobile-responsive design
  - Advanced conversation management

- **Enterprise Features**
  - User authentication and management
  - Team collaboration tools
  - Advanced analytics and monitoring

## 🐛 Issues and Support

- **Bug Reports**: Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature Requests**: Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Questions**: Start a [GitHub Discussion](https://github.com/jakubkunert/PolarisAI/discussions)
- **Security Issues**: Please report privately to [security contact]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who help improve PolarisAI
- Inspired by the open-source AI community
- Built with amazing tools and frameworks from the JavaScript ecosystem

---

**Ready to build the future of AI agents?** Check out our [Contributing Guide](CONTRIBUTING.md) and join the community! 🚀

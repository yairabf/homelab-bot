# Homelab Bot

A Telegram bot for managing homelab services with an extensible wizard system built on NestJS.

## Features

- Extensible wizard system for multi-step service configuration
- Support for adding services to DNS and Dashboard
- Session management with automatic cleanup
- HTTP API for external integrations
- Type-safe implementation with TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Telegram Bot Token

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   INCOMING_WEBHOOK_URL=http://localhost:3000
   DEFAULT_CHAT_ID=
   PORT=4000
   ```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Project Structure

```
src/
├── config/           # Configuration management
├── telegram/         # Telegram bot integration
├── wizards/          # Extensible wizard system
│   ├── interfaces/   # Wizard contracts
│   ├── base/         # Base wizard implementation
│   ├── registry/     # Wizard registration
│   └── implementations/ # Wizard implementations
├── session/          # Session management
├── handlers/         # Telegram handlers
│   ├── command/      # Command handlers
│   ├── callback/     # Callback handlers
│   └── message/      # Message handlers
├── api/              # HTTP API
├── webhook/          # Webhook service
├── validation/       # Validation utilities
└── types/            # Type definitions
```

## Adding a New Wizard

To add a new wizard (e.g., "Add Service to Monitoring"):

1. Create a new wizard class extending `BaseWizardService`:
   ```typescript
   @Injectable()
   export class AddServiceMonitoringWizard extends BaseWizardService {
     getName() { return 'Add Service to Monitoring'; }
     getServiceType() { return 'monitoring'; }
     getFields() { return [/* field definitions */]; }
     formatSummary(data: Record<string, any>): string {
       // Format summary message
     }
   }
   ```

2. Register it in `WizardsModule`:
   ```typescript
   @Module({
     providers: [
       // ... existing wizards
       AddServiceMonitoringWizard,
     ],
   })
   ```

3. The wizard will automatically appear in the start menu.

## API Endpoints

### Health Check
```
GET /health
```

### Send Text Message
```
POST /send-text
Body: { "chatId": 123456, "text": "Hello" }
```

## License

UNLICENSED


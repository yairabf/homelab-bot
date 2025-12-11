# Homelab Bot

A Telegram bot for managing homelab services with an extensible wizard system built on NestJS. This bot provides an intuitive interface for adding and configuring services through interactive wizards, with automatic webhook integration to your backend systems.

## Features

### Core Functionality
- **Extensible Wizard System**: Multi-step interactive forms for service configuration
- **Two Built-in Wizards**:
  - **DNS Service Wizard**: Add services to DNS with fields for name, host, IP, protocol, policy, and port
  - **Dashboard Service Wizard**: Add services to dashboard with fields for name, host, group, sub-group, and icon
- **Session Management**: Automatic session cleanup with 30-minute TTL and background cleanup jobs
- **Input Validation**: Built-in validators for IP addresses, ports, and text fields
- **Webhook Integration**: Automatic data forwarding to configurable webhook endpoints with retry logic
- **Graceful Shutdown**: Proper cleanup of Telegram bot and HTTP server on SIGINT/SIGTERM

### Telegram Bot Features
- **Interactive Commands**:
  - `/start` - Welcome message with wizard selection
  - `/add-service` - Quick access to service addition wizards
  - `/cancel` - Cancel current wizard operation
  - `/help` - Display available commands
- **Inline Keyboards**: User-friendly button interfaces for protocol and policy selection
- **Legacy Support**: Backward compatibility with text-based "add service" messages

### HTTP API
- **Health Check Endpoint**: Monitor bot status
- **Send Text Message**: Programmatically send messages via HTTP API
- **RESTful Design**: Clean API structure for external integrations

### Technical Features
- **Type-Safe Implementation**: Full TypeScript with strict type checking
- **Modular Architecture**: Clean separation of concerns with NestJS modules
- **Utility Functions**: Reusable utilities for host processing and logging
- **Configuration Management**: Environment-based configuration with validation
- **Structured Logging**: Comprehensive logging with NestJS Logger

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

3. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   INCOMING_WEBHOOK_URL=http://localhost:3000 
   DEFAULT_CHAT_ID=
   PORT=4000
   ```
   
   **Required Variables:**
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from [@BotFather](https://t.me/botfather)
   - `INCOMING_WEBHOOK_URL`: Base URL for your backend webhook service
   - `PORT`: HTTP API port (default: 4000)
   - `DEFAULT_CHAT_ID`: Optional default chat ID for notifications

## Running the Application

### Development Mode
Starts the application with hot-reload enabled:
```bash
npm run start:dev
```

The bot will:
- Verify the Telegram bot token on startup
- Start the HTTP API server on the configured port
- Enable automatic restart on file changes

### Production Mode
Build and run the optimized production build:
```bash
npm run build
npm run start:prod
```

### Other Commands
- `npm run start` - Start without watch mode
- `npm run start:debug` - Start with debugger attached
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm test` - Run test suite

### Graceful Shutdown
The application handles `SIGINT` (Ctrl+C) and `SIGTERM` signals gracefully:
- Stops the Telegram bot cleanly
- Closes the HTTP server and releases the port
- Exits the process safely

## Project Structure

```
src/
├── config/              # Configuration management and environment validation
├── telegram/            # Telegram bot integration (nestjs-telegraf)
├── wizards/             # Extensible wizard system
│   ├── interfaces/      # Wizard contracts (IWizard, IWizardField)
│   ├── base/            # Base wizard implementation with common logic
│   ├── registry/        # Wizard registration and retrieval service
│   └── implementations/ # Wizard implementations (DNS, Dashboard)
├── session/             # Session management with TTL and cleanup
├── handlers/            # Telegram bot handlers
│   ├── command/         # Command handlers (/start, /help, /cancel, /add-service)
│   ├── callback/        # Inline keyboard callback handlers
│   └── message/         # Text message processing and wizard flow
├── api/                 # HTTP API endpoints
│   ├── controllers/     # REST controllers (health, send-text)
│   └── dto/             # Data transfer objects
├── webhook/             # Webhook service with retry logic
├── validation/          # Input validation utilities (IP, port, text)
├── utils/               # Utility functions (host processing, logging)
└── types/               # TypeScript type definitions
```

## Adding a New Wizard

The wizard system is designed to be easily extensible. To add a new wizard (e.g., "Add Service to Monitoring"):

1. **Create a new wizard class** extending `BaseWizardService`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { BaseWizardService } from '../base/base-wizard.service';
   import { IWizardField } from '../interfaces/wizard-field.interface';
   import { ServiceData } from '../../types/service.types';
   import { IpValidator, PortValidator, TextValidator } from '../../validation/validators';

   @Injectable()
   export class AddServiceMonitoringWizard extends BaseWizardService {
     constructor(
       ipValidator: IpValidator,
       portValidator: PortValidator,
       textValidator: TextValidator,
     ) {
       super(ipValidator, portValidator, textValidator);
     }

     getName(): string {
       return 'Add Service to Monitoring';
     }

     getServiceType(): string {
       return 'monitoring';
     }

     getWebhookRoute(): string {
       return '/webhook/add-service/monitoring';
     }

     getFields(): IWizardField[] {
       return [
         {
           key: 'name',
           prompt: 'Please provide the service name:',
           type: 'text',
           validate: 'text',
         },
         // Add more fields as needed
       ];
     }

     formatSummary(data: Partial<ServiceData>): string {
       return `✅ Service added successfully!\n\n📋 Summary:\n...`;
     }
   }
   ```

2. **Register it in `WizardsModule`**:
   ```typescript
   @Module({
     providers: [
       // ... existing wizards
       AddServiceMonitoringWizard,
     ],
   })
   ```

3. **The wizard will automatically appear** in the `/start` and `/add-service` menus.

### Field Types
- `text`: Free-form text input with validation
- `keyboard`: Inline keyboard buttons (see DNS wizard for protocol/policy examples)

### Validation Types
- `text`: Text validation
- `ip`: IP address validation
- `port`: Port number validation (1-65535)

## API Endpoints

The bot exposes an HTTP API for external integrations.

### Health Check
Check if the bot is running and healthy:
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Send Text Message
Send a message to a specific chat via HTTP:
```http
POST /send-text
Content-Type: application/json

{
  "chatId": 123456789,
  "text": "Hello from API!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": 123
}
```

## Wizard Details

### DNS Service Wizard
Collects the following information:
- **Name**: Service name (normalized to service_name)
- **Host**: Hostname without .work suffix (automatically adds .yairlab)
- **IP**: IP address (validated)
- **Protocol**: HTTP or HTTPS (inline keyboard selection)
- **Policy**: internal or External (inline keyboard selection, determines entryPoints)
- **Port**: Port number (validated: 1-65535)

**Webhook Route**: `/webhook/add-service/dns`

### Dashboard Service Wizard
Collects the following information:
- **Name**: Service name
- **Host**: Hostname
- **Group**: Homelab or Media services (inline keyboard selection)
- **Sub-group**: Sub-group name
- **Icon**: Icon emoji or identifier

**Webhook Route**: `/webhook/add-service/dashboard`

## Webhook Integration

Each wizard sends collected data to a different webhook route. The webhook service includes:
- **Automatic Retry Logic**: 3 retries with exponential backoff
- **Structured Logging**: Detailed logs for debugging
- **Error Handling**: Graceful failure handling

**Webhook Payload Format:**
```json
{
  "chat_id": 123456789,
  "user_id": 987654321,
  "username": "username",
  "service_type": "dns",
  "service": {
    "name": "example-service",
    "host": "example.yairlab",
    "ip": "192.168.1.1",
    "protocol": "https",
    "policy": "internal",
    "port": 443
  }
}
```

## Utilities

### Host Processor
The `HostProcessor` utility automatically adds `.yairlab` suffix to DNS service hostnames:
- Validates hostname format
- Prevents duplicate suffixes
- Only applies to DNS wizard

### Session Management
- **TTL**: 30 minutes of inactivity
- **Automatic Cleanup**: Background job runs every 5 minutes
- **Metadata Storage**: Stores user information (chat ID, user ID, username)

## Docker Deployment

### Building the Docker Image

Build the image locally:
```bash
docker build -t homelab-bot:latest .
```

### Publishing to GitHub Container Registry (GHCR)

The project includes a GitHub Actions workflow that automatically builds and pushes Docker images to GHCR on:
- Pushes to `main`/`master` branch (creates `latest` tag)
- Git tags matching `v*` pattern (e.g., `v1.0.0`)
- GitHub release creation

**Image Location**: `ghcr.io/[your-username]/homelab-bot:[tag]`

**Manual Push** (if needed):
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u [your-username] --password-stdin

# Build and tag
docker build -t ghcr.io/[your-username]/homelab-bot:latest .

# Push
docker push ghcr.io/[your-username]/homelab-bot:latest
```

### Running with Docker Compose

1. **Set up environment variables**:
   ```bash
   # Create .env file if it doesn't exist
   touch .env
   ```

2. **Configure docker-compose.yml**:
   Update the `GITHUB_USERNAME` variable in `docker-compose.yml`:
   ```yaml
   image: ghcr.io/your-username/homelab-bot:latest
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f homelab-bot
   ```

5. **Stop services**:
   ```bash
   docker-compose down
   ```

### Watchtower Configuration

Watchtower is included in `docker-compose.yml` and automatically:
- Polls GHCR every 5 minutes for new images
- Updates the `homelab-bot` container when a new image is available
- Cleans up old images to save disk space
- Only updates running containers

**Watchtower Settings**:
- **Poll Interval**: 300 seconds (5 minutes)
- **Cleanup**: Enabled (removes old images)
- **Include Stopped**: Disabled (only updates running containers)

To disable auto-updates for a specific container, remove the Watchtower label:
```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=true"  # Remove this line
```

### Environment Variables in Docker

All environment variables from `.env` are automatically loaded by docker-compose via `env_file`. Ensure your `.env` file contains:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
INCOMING_WEBHOOK_URL=http://localhost:3000
DEFAULT_CHAT_ID=
PORT=4000
```

### Release Workflow

1. **Create a Git tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions automatically**:
   - Builds the Docker image
   - Pushes to GHCR with tags: `v1.0.0`, `v1.0`, and `latest`

3. **Watchtower detects** the new image within 5 minutes and updates the container

4. **Old images are cleaned up** automatically by Watchtower

### Testing Docker Build

1. **Build locally**:
   ```bash
   docker build -t homelab-bot:test .
   ```

2. **Test run**:
   ```bash
   docker run --env-file .env -p 4000:4000 homelab-bot:test
   ```

3. **Verify health**:
   ```bash
   curl http://localhost:4000/health
   ```

4. **Test with compose**:
   ```bash
   docker-compose up -d
   docker-compose ps
   ```

## License

UNLICENSED


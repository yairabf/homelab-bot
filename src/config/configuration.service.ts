import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {
    this.validateRequiredVariables();
  }

  get botToken(): string {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
  }

  get incomingWebhookUrl(): string {
    return this.configService.get<string>('INCOMING_WEBHOOK_URL') || '';
  }

  get defaultChatId(): string {
    return this.configService.get<string>('DEFAULT_CHAT_ID') || '';
  }

  get port(): number {
    return this.configService.get<number>('PORT') || 4000;
  }

  private validateRequiredVariables(): void {
    const requiredVars = ['TELEGRAM_BOT_TOKEN'];
    const missing: string[] = [];

    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value || value.trim() === '') {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }
  }
}


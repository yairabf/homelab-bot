import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigurationService } from '../config/configuration.service';
import { WebhookPayload } from '../types/service.types';
import { WEBHOOK_CONFIG } from './webhook.config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly httpClient: AxiosInstance;
  private readonly maxRetries = WEBHOOK_CONFIG.MAX_RETRIES;
  private readonly retryDelay = WEBHOOK_CONFIG.RETRY_DELAY_MS;

  constructor(private readonly configService: ConfigurationService) {
    this.httpClient = axios.create({
      timeout: WEBHOOK_CONFIG.TIMEOUT_MS,
    });
  }

  async sendServiceData(
    route: string,
    payload: WebhookPayload,
  ): Promise<boolean> {
    const webhookUrl = this.configService.incomingWebhookUrl;

    if (!webhookUrl) {
      this.logger.warn('No INCOMING_WEBHOOK_URL configured, skipping webhook call');
      return false;
    }

    const fullUrl = `${webhookUrl}${route}`;
    this.logger.log(
      `🚀 Triggering webhook route: ${route} for service type: ${payload.service_type}`,
    );
    this.logger.debug(`Webhook URL: ${fullUrl}`);
    this.logger.debug(`Webhook payload: ${JSON.stringify(payload, null, 2)}`);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`Sending webhook (attempt ${attempt}/${this.maxRetries}) to ${fullUrl}`);
        await this.httpClient.post(fullUrl, payload);
        this.logger.log(
          `✅ Webhook route ${route} triggered successfully for service type: ${payload.service_type}`,
        );
        return true;
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;
        this.logger.error(
          `Error sending webhook (attempt ${attempt}/${this.maxRetries}): ${error.message}`,
        );

        if (isLastAttempt) {
          this.logger.error('Failed to send webhook after all retries');
          return false;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempt);
      }
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


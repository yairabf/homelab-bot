import { Injectable, Logger } from '@nestjs/common';
import { Ctx, Hears, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionService } from '../../session/session.service';
import { WizardRegistryService } from '../../wizards/registry/wizard-registry.service';
import { WebhookService } from '../../webhook/webhook.service';
import { ConfigurationService } from '../../config/configuration.service';
import { IWizard } from '../../wizards/interfaces/wizard.interface';
import { IWizardField } from '../../wizards/interfaces/wizard-field.interface';
import { WizardSession } from '../../types/session.types';
import { HostProcessor } from '../../utils/host-processor.util';

@Update()
@Injectable()
export class MessageHandler {
  private readonly logger = new Logger(MessageHandler.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly wizardRegistry: WizardRegistryService,
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigurationService,
  ) {}

  @Hears(/.*/)
  async handleMessage(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      return;
    }

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    // Check if user has an active session
    const session = this.sessionService.getSession(chatId);

    if (!session) {
      // No active session - check for legacy 'add service' trigger
      const lower = text.toLowerCase();
      if (lower.includes('add service')) {
        await this.handleLegacyAddService(ctx, text);
      }
      return;
    }

    // Process wizard step
    await this.processWizardStep(ctx, session, text);
  }

  private async handleLegacyAddService(ctx: Context, text: string): Promise<void> {
    const webhookUrl = this.configService.incomingWebhookUrl;
    if (!webhookUrl) {
      await ctx.reply('❌ Webhook URL not configured.');
      return;
    }

    try {
      this.logger.log('Sending message to the homelab agent...');
      await this.webhookService.sendServiceData('/webhook/add-service', {
        chat_id: ctx.chat!.id,
        user_id: ctx.from!.id,
        username: ctx.from?.username,
        service_type: 'unknown',
        service: {
          name: '',
          host: '',
        } as any, // Legacy endpoint accepts minimal data
      });
      await ctx.reply('🧠 Got it, sending this to the homelab agent...');
    } catch (error) {
      this.logger.error('Error sending legacy message:', error);
      await ctx.reply('❌ Could not reach the automation service.');
    }
  }

  private async processWizardStep(
    ctx: Context,
    session: WizardSession,
    text: string,
  ): Promise<void> {
    const wizard = this.wizardRegistry.getWizard(session.serviceType);
    if (!wizard) {
      await this.handleInvalidWizard(ctx);
      return;
    }

    const currentField = this.getCurrentWizardField(session, wizard);
    if (!currentField) {
      await this.handleInvalidStep(ctx);
      return;
    }

    if (currentField.type === 'keyboard') {
      return; // Handled by callback handler
    }

    const validationResult = wizard.validateField(currentField.key, text);
    if (!validationResult.isValid) {
      await ctx.reply(
        validationResult.errorMessage || 'Invalid input. Please try again:',
      );
      return;
    }

    const processedValue = this.processFieldValue(
      currentField,
      text,
      session.serviceType,
    );
    this.updateSessionAndAdvance(ctx.chat!.id, currentField.key, processedValue);

    await this.displayNextFieldOrComplete(ctx, session, wizard);
  }

  private getCurrentWizardField(
    session: WizardSession,
    wizard: IWizard,
  ): IWizardField | undefined {
    const fields = wizard.getFields();
    return fields[session.currentStep];
  }

  private async handleInvalidWizard(ctx: Context): Promise<void> {
    await ctx.reply('❌ Wizard not found. Please start over.');
    this.sessionService.deleteSession(ctx.chat!.id);
  }

  private async handleInvalidStep(ctx: Context): Promise<void> {
    await ctx.reply('❌ Invalid step. Please start over.');
    this.sessionService.deleteSession(ctx.chat!.id);
  }

  private processFieldValue(
    field: IWizardField,
    text: string,
    serviceType: string,
  ): string | number {
    if (field.validate === 'port') {
      return parseInt(text, 10);
    }

    if (field.key === 'host') {
      return HostProcessor.addYairlabSuffixIfNeeded(text, serviceType);
    }

    return text;
  }

  private updateSessionAndAdvance(
    chatId: number,
    fieldKey: string,
    value: string | number,
  ): void {
    this.sessionService.updateSessionData(chatId, {
      [fieldKey]: value,
    });
    this.sessionService.incrementStep(chatId);
  }

  private async displayNextFieldOrComplete(
    ctx: Context,
    session: WizardSession,
    wizard: IWizard,
  ): Promise<void> {
    const nextStep = this.sessionService.getCurrentStep(ctx.chat!.id);
    const allFields = wizard.getFields();

    if (nextStep < allFields.length) {
      const nextField = allFields[nextStep];
      if (nextField) {
        await this.displayWizardField(ctx, nextField);
      }
    } else {
      await this.completeWizard(ctx, session, wizard);
    }
  }

  private async displayWizardField(
    ctx: Context,
    field: IWizardField,
  ): Promise<void> {
    if (field.type === 'keyboard' && field.options) {
      await ctx.reply(field.prompt, {
        reply_markup: {
          inline_keyboard: [field.options],
        },
      });
    } else {
      await ctx.reply(field.prompt);
    }
  }

  private async completeWizard(
    ctx: Context,
    session: WizardSession,
    wizard: IWizard,
  ): Promise<void> {
    const chatId = ctx.chat!.id;
    const metadata = this.sessionService.getMetadata(chatId);

    try {
      // Display summary to user
      const summary = wizard.formatSummary(session.data);
      await ctx.reply(summary);

      // Send to webhook
      const webhookRoute = wizard.getWebhookRoute();
      this.logger.log(
        `🎯 Wizard completed: "${wizard.getName()}" (${session.serviceType}) - Triggering webhook route: ${webhookRoute}`,
      );
      this.logger.log(`📦 Service data: ${JSON.stringify(session.data)}`);

      const success = await this.webhookService.sendServiceData(webhookRoute, {
        chat_id: chatId,
        user_id: metadata?.userId || ctx.from!.id,
        username: metadata?.username || ctx.from?.username,
        service_type: session.serviceType,
        service: session.data,
      });

      if (!success) {
        await ctx.reply(
          '⚠️ Service data collected, but failed to send to backend. Please try again or contact support.',
        );
      }

      // Clean up session
      this.sessionService.deleteSession(chatId);
    } catch (error) {
      this.logger.error('Error completing wizard:', error);
      await ctx.reply(
        '⚠️ Service data collected, but failed to send to backend. Please try again or contact support.',
      );
      this.sessionService.deleteSession(chatId);
    }
  }
}


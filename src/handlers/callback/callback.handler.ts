import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionService } from '../../session/session.service';
import { WizardRegistryService } from '../../wizards/registry/wizard-registry.service';

@Update()
@Injectable()
export class CallbackHandler {
  constructor(
    private readonly sessionService: SessionService,
    private readonly wizardRegistry: WizardRegistryService,
  ) {}

  @Action(/^service_type_(.+)$/)
  async handleServiceTypeSelection(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const callbackData = ctx.callbackQuery?.['data'] as string;

    if (!chatId || !callbackData) {
      return;
    }

    const serviceType = callbackData.replace('service_type_', '');
    const wizard = this.wizardRegistry.getWizard(serviceType);

    if (!wizard) {
      await ctx.answerCbQuery();
      await ctx.reply('❌ Unknown service type. Please try again.');
      return;
    }

    // Initialize new session
    this.sessionService.createSession(chatId, serviceType, {
      chatId,
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(`✅ Selected: ${wizard.getName()}`);

    // Start the wizard
    const firstField = wizard.getFields()[0];
    await ctx.reply(
      `Let's add a new ${wizard.getName()} service! ${firstField.prompt}\n\n(You can use /cancel at any time to stop)`,
    );
  }

  @Action(/^protocol_(http|https)$/)
  async handleProtocolSelection(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const callbackData = ctx.callbackQuery?.['data'] as string;

    if (!chatId || !callbackData) {
      return;
    }

    const session = this.sessionService.getSession(chatId);
    if (!session) {
      await ctx.answerCbQuery();
      return;
    }

    const protocol = callbackData.replace('protocol_', '');
    this.sessionService.updateSessionData(chatId, { protocol });
    this.sessionService.incrementStep(chatId);

    await ctx.answerCbQuery();
    await ctx.editMessageText(`Choose the protocol: ✅ ${protocol.toUpperCase()}`);

    // Move to next step
    const wizard = this.wizardRegistry.getWizard(session.serviceType);
    if (!wizard) {
      return;
    }

    const currentStep = this.sessionService.getCurrentStep(chatId);
    const fields = wizard.getFields();
    if (currentStep < fields.length) {
      const nextField = fields[currentStep];
      if (nextField) {
        await ctx.reply(nextField.prompt);
      }
    }
  }

  @Action(/^group_(homelab|media_services)$/)
  async handleGroupSelection(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const callbackData = ctx.callbackQuery?.['data'] as string;

    if (!chatId || !callbackData) {
      return;
    }

    const session = this.sessionService.getSession(chatId);
    if (!session) {
      await ctx.answerCbQuery();
      return;
    }

    const groupValue = callbackData.replace('group_', '').replace('_', ' ');
    // Convert "media_services" to "Media services" and "homelab" to "Homelab"
    const groupDisplay = groupValue
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    this.sessionService.updateSessionData(chatId, { group: groupDisplay });
    this.sessionService.incrementStep(chatId);

    await ctx.answerCbQuery();
    await ctx.editMessageText(`Choose the group: ✅ ${groupDisplay}`);

    // Move to next step
    const wizard = this.wizardRegistry.getWizard(session.serviceType);
    if (!wizard) {
      return;
    }

    const currentStep = this.sessionService.getCurrentStep(chatId);
    const fields = wizard.getFields();
    if (currentStep < fields.length) {
      const nextField = fields[currentStep];
      if (nextField) {
        if (nextField.type === 'keyboard' && nextField.options) {
          // Show inline keyboard
          await ctx.reply(nextField.prompt, {
            reply_markup: {
              inline_keyboard: [nextField.options],
            },
          });
        } else {
          await ctx.reply(nextField.prompt);
        }
      }
    }
  }

  @Action(/^policy_(internal|external)$/)
  async handlePolicySelection(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const callbackData = ctx.callbackQuery?.['data'] as string;

    if (!chatId || !callbackData) {
      return;
    }

    const session = this.sessionService.getSession(chatId);
    if (!session) {
      await ctx.answerCbQuery();
      return;
    }

    const policy = callbackData.replace('policy_', '');
    // Keep policy as-is: "internal" or "external" (lowercase), but display with proper capitalization
    const policyDisplay = policy === 'internal' ? 'internal' : 'external';
    this.sessionService.updateSessionData(chatId, { policy });
    this.sessionService.incrementStep(chatId);

    await ctx.answerCbQuery();
    await ctx.editMessageText(`Choose the policy: ✅ ${policyDisplay}`);

    // Move to next step
    const wizard = this.wizardRegistry.getWizard(session.serviceType);
    if (!wizard) {
      return;
    }

    const currentStep = this.sessionService.getCurrentStep(chatId);
    const fields = wizard.getFields();
    if (currentStep < fields.length) {
      const nextField = fields[currentStep];
      if (nextField) {
        if (nextField.type === 'keyboard' && nextField.options) {
          // Show inline keyboard
          await ctx.reply(nextField.prompt, {
            reply_markup: {
              inline_keyboard: [nextField.options],
            },
          });
        } else {
          await ctx.reply(nextField.prompt);
        }
      }
    }
  }
}


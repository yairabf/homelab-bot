import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionService } from '../../session/session.service';
import { WizardRegistryService } from '../../wizards/registry/wizard-registry.service';
import { IWizard } from '../../wizards/interfaces/wizard.interface';
import { IWizardField } from '../../wizards/interfaces/wizard-field.interface';
import { WizardSession } from '../../types/session.types';

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
    await this.handleKeyboardFieldSelection(
      ctx,
      'protocol_',
      'protocol',
      (value) => value.toUpperCase(),
    );
  }

  @Action(/^group_(homelab|media_services)$/)
  async handleGroupSelection(@Ctx() ctx: Context): Promise<void> {
    await this.handleKeyboardFieldSelection(
      ctx,
      'group_',
      'group',
      (value) => {
        const groupValue = value.replace('_', ' ');
        return groupValue
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      },
    );
  }

  @Action(/^policy_(internal|external)$/)
  async handlePolicySelection(@Ctx() ctx: Context): Promise<void> {
    await this.handleKeyboardFieldSelection(
      ctx,
      'policy_',
      'policy',
      (value) => (value === 'internal' ? 'internal' : 'External'),
    );
  }

  /**
   * Common handler for keyboard field selections (protocol, group, policy)
   * Extracts the pattern to reduce code duplication
   */
  private async handleKeyboardFieldSelection(
    ctx: Context,
    prefix: string,
    fieldKey: string,
    displayFormatter: (value: string) => string,
  ): Promise<void> {
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

    const value = callbackData.replace(prefix, '');
    const displayValue = displayFormatter(value);

    this.sessionService.updateSessionData(chatId, { [fieldKey]: value });
    this.sessionService.incrementStep(chatId);

    await ctx.answerCbQuery();
    await ctx.editMessageText(`Choose the ${fieldKey}: ✅ ${displayValue}`);

    await this.displayNextWizardField(ctx, session);
  }

  /**
   * Displays the next field in the wizard flow
   */
  private async displayNextWizardField(
    ctx: Context,
    session: WizardSession,
  ): Promise<void> {
    const wizard = this.wizardRegistry.getWizard(session.serviceType);
    if (!wizard) {
      return;
    }

    const currentStep = this.sessionService.getCurrentStep(ctx.chat!.id);
    const fields = wizard.getFields();

    if (currentStep < fields.length) {
      const nextField = fields[currentStep];
      if (nextField) {
        if (nextField.type === 'keyboard' && nextField.options) {
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


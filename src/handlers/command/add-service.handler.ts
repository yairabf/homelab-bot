import { Injectable } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { WizardRegistryService } from '../../wizards/registry/wizard-registry.service';

@Update()
@Injectable()
export class AddServiceHandler {
  constructor(private readonly wizardRegistry: WizardRegistryService) {}

  @Command('add-service')
  async handleAddService(@Ctx() ctx: Context): Promise<void> {
    const wizards = this.wizardRegistry.getAllWizards();
    const buttons = wizards.map((wizard) => ({
      text: `📊 ${wizard.getName()}`,
      callback_data: `service_type_${wizard.getServiceType()}`,
    }));

    // Stack buttons vertically (one per row) for full width
    const inlineKeyboard = buttons.map((button) => [button]);

    await ctx.reply('👋 Choose what you want to do:', {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }
}


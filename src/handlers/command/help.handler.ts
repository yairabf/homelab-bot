import { Injectable } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class HelpHandler {
  @Command('help')
  async handleHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      'Send me any message and I will forward it to your backend.\n\nCommands:\n/add-service - Add a new service\n/cancel - Cancel current operation',
    );
  }
}


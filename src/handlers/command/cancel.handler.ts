import { Injectable } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionService } from '../../session/session.service';

@Update()
@Injectable()
export class CancelHandler {
  constructor(private readonly sessionService: SessionService) {}

  @Command('cancel')
  async handleCancel(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;

    if (!chatId) {
      return;
    }

    if (this.sessionService.hasActiveSession(chatId)) {
      this.sessionService.deleteSession(chatId);
      await ctx.reply('❌ Service addition cancelled.');
    } else {
      await ctx.reply('No active operation to cancel.');
    }
  }
}


import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private isReady = false;

  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Verifying bot token...');
      const botInfo = await this.bot.telegram.getMe();
      this.logger.log(`Bot token valid: @${botInfo.username}`);

      // nestjs-telegraf automatically launches the bot, so we don't need to call bot.launch()
      // We just verify the bot is ready and wait a moment for nestjs-telegraf to finish launching
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log('✅ Telegram bot started successfully (launched by nestjs-telegraf)');
      this.isReady = true;
    } catch (error) {
      this.logger.error(`❌ Failed to verify bot: ${error.message}`);
      this.logger.error(
        '⚠️  HTTP API will continue running, but bot functionality is unavailable',
      );
    }
  }

  getBot(): Telegraf {
    return this.bot;
  }

  getIsReady(): boolean {
    return this.isReady;
  }
}


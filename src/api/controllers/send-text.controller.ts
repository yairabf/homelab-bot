import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TelegramService } from '../../telegram/telegram.service';
import { ConfigurationService } from '../../config/configuration.service';
import { SendTextDto } from '../dto/send-text.dto';

@Controller('send-text')
export class SendTextController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigurationService,
  ) {}

  @Post()
  async sendText(@Body() dto: SendTextDto) {
    const targetChatId = dto.chatId || this.configService.defaultChatId;

    if (!targetChatId || !dto.text) {
      throw new HttpException(
        {
          ok: false,
          error:
            'text is required. chatId is optional if DEFAULT_CHAT_ID is set',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const bot = this.telegramService.getBot();
      const message = await bot.telegram.sendMessage(
        String(targetChatId),
        dto.text,
      );

      return {
        ok: true,
        messageId: message.message_id,
        chatId: targetChatId,
      };
    } catch (error) {
      throw new HttpException(
        {
          ok: false,
          error: String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}


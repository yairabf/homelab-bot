import { Controller, Get } from '@nestjs/common';
import { TelegramService } from '../../telegram/telegram.service';

@Controller('health')
export class HealthController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get()
  getHealth() {
    return {
      ok: true,
      telegramConnected: this.telegramService.getIsReady(),
    };
  }
}


import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { SendTextController } from './controllers/send-text.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [TelegramModule, ConfigurationModule],
  controllers: [HealthController, SendTextController],
})
export class ApiModule {}


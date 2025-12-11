import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { TelegramModule } from './telegram/telegram.module';
import { HandlersModule } from './handlers/handlers.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigurationModule,
    TelegramModule,
    HandlersModule,
    ApiModule,
  ],
})
export class AppModule {}


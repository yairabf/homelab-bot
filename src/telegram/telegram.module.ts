import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { ConfigurationModule } from '../config/configuration.module';
import { ConfigurationService } from '../config/configuration.service';

@Module({
  imports: [
    ConfigurationModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (configService: ConfigurationService) => ({
        token: configService.botToken,
      }),
      inject: [ConfigurationService],
    }),
  ],
  providers: [TelegramService],
  exports: [TelegramService, TelegrafModule],
})
export class TelegramModule {}


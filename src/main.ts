import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './config/configuration.service';
import { TelegramService } from './telegram/telegram.service';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable graceful shutdown hooks
    app.enableShutdownHooks();

    const configService = app.get(ConfigurationService);
    const port = configService.port;

    // Setup graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Stop Telegram bot
        const telegramService = app.get(TelegramService, { strict: false });
        if (telegramService) {
          logger.log('Stopping Telegram bot...');
          const bot = telegramService.getBot();
          await bot.stop(signal);
          logger.log('✅ Telegram bot stopped');
        }
      } catch (error) {
        logger.error(
          `Error stopping Telegram bot: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }

      try {
        // Close NestJS app (this will close HTTP server and release port)
        logger.log('Closing application...');
        await app.close();
        logger.log('✅ Application closed, port released');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing application:', error);
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    await app.listen(port);
    logger.log(`🌐 HTTP API listening on :${port}`);
    logger.log('Press Ctrl+C to gracefully shutdown');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();


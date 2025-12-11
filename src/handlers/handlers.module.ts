import { Module } from '@nestjs/common';
import { StartHandler } from './command/start.handler';
import { HelpHandler } from './command/help.handler';
import { CancelHandler } from './command/cancel.handler';
import { AddServiceHandler } from './command/add-service.handler';
import { CallbackHandler } from './callback/callback.handler';
import { MessageHandler } from './message/message.handler';
import { SessionModule } from '../session/session.module';
import { WizardsModule } from '../wizards/wizards.module';
import { WebhookModule } from '../webhook/webhook.module';
import { ConfigurationModule } from '../config/configuration.module';

@Module({
  imports: [
    SessionModule,
    WizardsModule,
    WebhookModule,
    ConfigurationModule,
  ],
  providers: [
    StartHandler,
    HelpHandler,
    CancelHandler,
    AddServiceHandler,
    CallbackHandler,
    MessageHandler,
  ],
})
export class HandlersModule {}


import { Injectable } from '@nestjs/common';
import { BaseWizardService } from '../base/base-wizard.service';
import { IWizardField } from '../interfaces/wizard-field.interface';
import { IpValidator } from '../../validation/validators/ip.validator';
import { PortValidator } from '../../validation/validators/port.validator';
import { TextValidator } from '../../validation/validators/text.validator';

@Injectable()
export class AddServiceDashboardWizard extends BaseWizardService {
  constructor(
    ipValidator: IpValidator,
    portValidator: PortValidator,
    textValidator: TextValidator,
  ) {
    super(ipValidator, portValidator, textValidator);
  }

  getName(): string {
    return 'Add Service to Dashboard';
  }

  getWebhookRoute(): string {
    return '/webhook/add-service/dashboard';
  }

  getServiceType(): string {
    return 'dashboard';
  }

  getFields(): IWizardField[] {
    return [
      {
        key: 'name',
        prompt: 'Please provide the service name:',
        type: 'text',
        validate: 'text',
      },
      {
        key: 'host',
        prompt: 'Now provide the host (e.g., api.example.com):',
        type: 'text',
        validate: 'text',
      },
      {
        key: 'group',
        prompt: 'What group does this service belong to?',
        type: 'keyboard',
        options: [
          { text: 'Homelab', callback_data: 'group_homelab' },
          { text: 'Media', callback_data: 'group_media_services' },
        ],
      },
      {
        key: 'sub_group',
        prompt: 'What sub-group?',
        type: 'text',
        validate: 'text',
      },
      {
        key: 'icon',
        prompt: 'Provide an icon (emoji or identifier):',
        type: 'text',
        validate: 'text',
      },
    ];
  }

  formatSummary(data: Record<string, any>): string {
    return (
      `✅ Service added successfully!\n\n` +
      `📋 Summary:\n` +
      `Service Type: Dashboard\n` +
      `Name: ${data.name}\n` +
      `Host: ${data.host}\n` +
      `Group: ${data.group}\n` +
      `Sub-group: ${data.sub_group}\n` +
      `Icon: ${data.icon}`
    );
  }
}


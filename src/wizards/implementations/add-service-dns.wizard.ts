import { Injectable } from '@nestjs/common';
import { BaseWizardService } from '../base/base-wizard.service';
import { IWizardField } from '../interfaces/wizard-field.interface';
import { IpValidator } from '../../validation/validators/ip.validator';
import { PortValidator } from '../../validation/validators/port.validator';
import { TextValidator } from '../../validation/validators/text.validator';

@Injectable()
export class AddServiceDnsWizard extends BaseWizardService {
  constructor(
    ipValidator: IpValidator,
    portValidator: PortValidator,
    textValidator: TextValidator,
  ) {
    super(ipValidator, portValidator, textValidator);
  }

  getWebhookRoute(): string {
    return '/webhook/add-service/dns';
  }

  getName(): string {
    return 'Add Service to DNS';
  }

  getServiceType(): string {
    return 'dns';
  }

  getFields(): IWizardField[] {
    return [
      {
        key: 'name',
        prompt: 'Please provide the service name (will be normalized to service_name):',
        type: 'text',
        validate: 'text',
      },
      {
        key: 'host',
        prompt: 'Provide the hostname without .work suffix (e.g., test.yairlab):',
        type: 'text',
        validate: 'text',
      },
      {
        key: 'protocol',
        prompt: 'Choose the protocol for the service URL:',
        type: 'keyboard',
        options: [
          { text: 'HTTP', callback_data: 'protocol_http' },
          { text: 'HTTPS', callback_data: 'protocol_https' },
        ],
      },
      {
        key: 'policy',
        prompt: 'Choose the policy (determines entryPoints):',
        type: 'keyboard',
        options: [
          { text: 'internal', callback_data: 'policy_internal' },
          { text: 'External', callback_data: 'policy_external' },
        ],
      },
      {
        key: 'port',
        prompt: 'Finally, what port number?',
        type: 'text',
        validate: 'port',
      },
    ];
  }

  formatSummary(data: Record<string, any>): string {
    return (
      `✅ Service added successfully!\n\n` +
      `📋 Summary:\n` +
      `Service Type: DNS\n` +
      `Name: ${data.name}\n` +
      `Host: ${data.host}\n` +
      `Protocol: ${data.protocol}\n` +
      `Policy: ${data.policy}\n` +
      `Port: ${data.port}`
    );
  }
}


import { Injectable } from '@nestjs/common';
import { IWizard, ValidationResult } from '../interfaces/wizard.interface';
import { IWizardField } from '../interfaces/wizard-field.interface';
import { IpValidator } from '../../validation/validators/ip.validator';
import { PortValidator } from '../../validation/validators/port.validator';
import { TextValidator } from '../../validation/validators/text.validator';

@Injectable()
export abstract class BaseWizardService implements IWizard {
  constructor(
    protected readonly ipValidator: IpValidator,
    protected readonly portValidator: PortValidator,
    protected readonly textValidator: TextValidator,
  ) {}

  abstract getName(): string;
  abstract getFields(): IWizardField[];
  abstract getServiceType(): string;
  abstract formatSummary(data: Record<string, any>): string;

  getWebhookRoute(): string {
    return 'unknown';
  }

  validateField(fieldKey: string, value: string): ValidationResult {
    const field = this.getFields().find((f) => f.key === fieldKey);

    if (!field) {
      return {
        isValid: false,
        errorMessage: '❌ Unknown field. Please try again:',
      };
    }

    if (field.type === 'keyboard') {
      return {
        isValid: true,
      };
    }

    switch (field.validate) {
      case 'ip':
        if (!this.ipValidator.validate(value)) {
          return {
            isValid: false,
            errorMessage: this.ipValidator.getErrorMessage(),
          };
        }
        break;

      case 'port':
        if (!this.portValidator.validate(value)) {
          return {
            isValid: false,
            errorMessage: this.portValidator.getErrorMessage(),
          };
        }
        break;

      case 'text':
      default:
        if (!this.textValidator.validate(value)) {
          return {
            isValid: false,
            errorMessage: this.textValidator.getErrorMessage(),
          };
        }
        break;
    }

    return { isValid: true };
  }

  getFieldByIndex(index: number): IWizardField | undefined {
    return this.getFields()[index];
  }

  getTotalSteps(): number {
    return this.getFields().length;
  }

  processFieldValue(fieldKey: string, value: string): any {
    const field = this.getFields().find((f) => f.key === fieldKey);
    if (field?.validate === 'port') {
      return parseInt(value, 10);
    }
    return value;
  }
}


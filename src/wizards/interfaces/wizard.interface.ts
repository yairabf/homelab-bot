import { IWizardField } from './wizard-field.interface';
import { ServiceData } from '../../types/service.types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface IWizard {
  getName(): string;
  getFields(): IWizardField[];
  getServiceType(): string;
  getWebhookRoute(): string;
  validateField(fieldKey: string, value: string): ValidationResult;
  formatSummary(data: Partial<ServiceData>): string;
}


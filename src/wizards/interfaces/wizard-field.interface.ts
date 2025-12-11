export interface IWizardField {
  key: string;
  prompt: string;
  type: 'text' | 'keyboard';
  validate?: 'ip' | 'port' | 'text';
  options?: Array<{ text: string; callback_data: string }>;
}


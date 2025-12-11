import { ServiceData } from './service.types';

export interface WizardSession {
  currentStep: number;
  data: Partial<ServiceData>;
  serviceType: string;
  createdAt: number;
  lastActivity: number;
}

export interface SessionMetadata {
  chatId: number;
  userId?: number;
  username?: string;
}


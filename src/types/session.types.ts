export interface WizardSession {
  currentStep: number;
  data: Record<string, any>;
  serviceType: string;
  createdAt: number;
  lastActivity: number;
}

export interface SessionMetadata {
  chatId: number;
  userId?: number;
  username?: string;
}


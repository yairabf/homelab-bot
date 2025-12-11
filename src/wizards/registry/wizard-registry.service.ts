import { Injectable, OnModuleInit } from '@nestjs/common';
import { IWizard } from '../interfaces/wizard.interface';

@Injectable()
export class WizardRegistryService implements OnModuleInit {
  private readonly wizards = new Map<string, IWizard>();

  onModuleInit(): void {
    // Wizards will register themselves via constructor injection
  }

  registerWizard(wizard: IWizard): void {
    const serviceType = wizard.getServiceType();
    if (this.wizards.has(serviceType)) {
      throw new Error(`Wizard with service type '${serviceType}' is already registered`);
    }
    this.wizards.set(serviceType, wizard);
  }

  getWizard(serviceType: string): IWizard | undefined {
    return this.wizards.get(serviceType);
  }

  getAllWizards(): IWizard[] {
    return Array.from(this.wizards.values());
  }

  getWizardTypes(): string[] {
    return Array.from(this.wizards.keys());
  }

  hasWizard(serviceType: string): boolean {
    return this.wizards.has(serviceType);
  }
}


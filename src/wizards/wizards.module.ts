import { Module, OnModuleInit } from '@nestjs/common';
import { WizardRegistryService } from './registry/wizard-registry.service';
import { AddServiceDnsWizard } from './implementations/add-service-dns.wizard';
import { AddServiceDashboardWizard } from './implementations/add-service-dashboard.wizard';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [ValidationModule],
  providers: [
    WizardRegistryService,
    AddServiceDnsWizard,
    AddServiceDashboardWizard,
  ],
  exports: [WizardRegistryService],
})
export class WizardsModule implements OnModuleInit {
  constructor(
    private readonly wizardRegistry: WizardRegistryService,
    private readonly dnsWizard: AddServiceDnsWizard,
    private readonly dashboardWizard: AddServiceDashboardWizard,
  ) {}

  onModuleInit(): void {
    // Register all wizards
    this.wizardRegistry.registerWizard(this.dnsWizard);
    this.wizardRegistry.registerWizard(this.dashboardWizard);
  }
}


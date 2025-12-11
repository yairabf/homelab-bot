import { Module } from '@nestjs/common';
import { IpValidator } from './validators/ip.validator';
import { PortValidator } from './validators/port.validator';
import { TextValidator } from './validators/text.validator';

@Module({
  providers: [IpValidator, PortValidator, TextValidator],
  exports: [IpValidator, PortValidator, TextValidator],
})
export class ValidationModule {}


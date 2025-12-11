import { Injectable } from '@nestjs/common';

@Injectable()
export class PortValidator {
  validate(port: string): boolean {
    if (!port || port.trim() === '') {
      return false;
    }

    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  }

  getErrorMessage(): string {
    return '❌ Invalid port number. Please provide a number between 1 and 65535:';
  }
}


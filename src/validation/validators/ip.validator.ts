import { Injectable } from '@nestjs/common';

@Injectable()
export class IpValidator {
  validate(ip: string): boolean {
    if (!ip || ip.trim() === '') {
      return false;
    }

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) {
      return false;
    }

    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  getErrorMessage(): string {
    return '❌ Invalid IP address format. Please provide a valid IP (e.g., 192.168.1.100):';
  }
}


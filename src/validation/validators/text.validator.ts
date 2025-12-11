import { Injectable } from '@nestjs/common';

@Injectable()
export class TextValidator {
  validate(value: string): boolean {
    return value !== undefined && value !== null && value.trim() !== '';
  }

  getErrorMessage(): string {
    return '❌ This field cannot be empty. Please try again:';
  }
}


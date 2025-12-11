import { IsString, IsOptional, IsNumber } from 'class-validator';

export class SendTextDto {
  @IsOptional()
  @IsNumber()
  chatId?: number;

  @IsString()
  text!: string;
}


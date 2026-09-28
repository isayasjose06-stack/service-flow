import { Injectable, Logger } from '@nestjs/common';

export interface SendEmailDto {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export abstract class EmailProvider {
  abstract send(payload: SendEmailDto): Promise<void>;
}

@Injectable()
export class MockEmailProvider implements EmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async send(payload: SendEmailDto): Promise<void> {
    this.logger.log(`Mock Email sent to: ${payload.to} | Subject: ${payload.subject}`);
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

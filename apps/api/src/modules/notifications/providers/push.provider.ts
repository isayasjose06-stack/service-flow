import { Injectable, Logger } from '@nestjs/common';

export interface SendPushDto {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

@Injectable()
export abstract class PushProvider {
  abstract send(payload: SendPushDto): Promise<void>;
}

@Injectable()
export class MockPushProvider implements PushProvider {
  private readonly logger = new Logger(MockPushProvider.name);

  async send(payload: SendPushDto): Promise<void> {
    this.logger.log(`Mock Web Push sent to User ID: ${payload.userId} | Title: ${payload.title}`);
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

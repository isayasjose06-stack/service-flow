import { EventEmitter2 } from '@nestjs/event-emitter';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, { provide: EventEmitter2, useValue: { emit: () => {} } }],
  exports: [PrismaService, EventEmitter2],
})
export class PrismaModule {}

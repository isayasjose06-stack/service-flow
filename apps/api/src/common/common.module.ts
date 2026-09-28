import { Module, Global } from '@nestjs/common';
import { CustomLoggerService } from './logger/custom-logger.service';
import { MetricsService } from './metrics/metrics.service';

@Global()
@Module({
  providers: [CustomLoggerService, MetricsService],
  exports: [CustomLoggerService, MetricsService],
})
export class CommonModule {}

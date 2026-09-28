import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { RequestWithId } from './request-id.middleware';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: CustomLoggerService
  ) {}

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const statusCode = res.statusCode;

      // Track metric
      this.metricsService.increment('http_requests_total', { method, statusCode: statusCode.toString() });
      this.metricsService.observe('http_request_duration_ms', durationMs, { method, path: originalUrl });

      if (statusCode >= 400 && statusCode < 500) {
        this.metricsService.increment('http_errors_total', { type: '4xx' });
      } else if (statusCode >= 500) {
        this.metricsService.increment('http_errors_total', { type: '5xx' });
      }

      // Log request
      this.logger.log({
        message: 'HTTP Request',
        requestId: req.requestId,
        method,
        path: originalUrl,
        statusCode,
        durationMs,
      }, 'HTTP');
    });

    next();
  }
}

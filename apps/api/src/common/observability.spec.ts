import { Test, TestingModule } from '@nestjs/testing';
import { RequestIdMiddleware, RequestWithId } from './middleware/request-id.middleware';
import { CustomLoggerService } from './logger/custom-logger.service';
import { MetricsService } from './metrics/metrics.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('Phase 11 - Observability & Robustness', () => {
  describe('RequestIdMiddleware', () => {
    it('1. should generate X-Request-ID when not provided', () => {
      const middleware = new RequestIdMiddleware();
      const req = { headers: {} } as unknown as RequestWithId;
      const res = { setHeader: jest.fn() } as any;
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
      expect(next).toHaveBeenCalled();
    });

    it('2. should preserve existing X-Request-ID', () => {
      const middleware = new RequestIdMiddleware();
      const req = { headers: { 'x-request-id': 'existing-id' } } as unknown as RequestWithId;
      const res = { setHeader: jest.fn() } as any;
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(req.requestId).toBe('existing-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('CustomLoggerService (Sanitization)', () => {
    it('3. should redact sensitive fields in objects recursively', () => {
      const logger = new CustomLoggerService();
      
      const payload = {
        user: {
          username: 'test',
          password: 'my-secret-password',
          auth: { token: 'jwt-token-here' }
        },
        cookie: 'session-id',
        authorization: 'Bearer jwt',
      };

      // Mock console.log to capture output
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.log(payload);
      
      const output = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(output.user.password).toBe('[REDACTED]');
      expect(output.user.auth.token).toBe('[REDACTED]');
      expect(output.cookie).toBe('[REDACTED]');
      expect(output.authorization).toBe('[REDACTED]');
      expect(output.user.username).toBe('test');

      logSpy.mockRestore();
    });
  });

  describe('GlobalExceptionFilter', () => {
    it('4. should map HttpException correctly and output standard JSON', () => {
      const filter = new GlobalExceptionFilter();
      const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const host = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => ({ requestId: 'test-req-id', url: '/api/test' }),
        })
      } as any;

      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden',
        requestId: 'test-req-id'
      }));
    });

    it('5. should map Prisma P2002 to 409 Conflict', () => {
      const filter = new GlobalExceptionFilter();
      const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const host = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => ({ requestId: 'test-req-id', url: '/api/test' }),
        })
      } as any;

      const exception = { code: 'P2002' };
      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        errorCode: 'RESOURCE_CONFLICT',
        statusCode: 409
      }));
    });
  });

  describe('MetricsService', () => {
    it('6. should increment and observe metrics', () => {
      const metricsService = new MetricsService();
      
      metricsService.increment('test_counter', { path: '/test' });
      metricsService.increment('test_counter', { path: '/test' });
      
      metricsService.observe('test_duration', 150, { method: 'GET' });
      
      const counters = metricsService.getCounters();
      const observers = metricsService.getObservers();
      
      const counterKey = 'test_counter{path=/test}';
      const observerKey = 'test_duration{method=GET}';

      expect(counters[counterKey]).toBeDefined();
      expect(counters[counterKey]).toBe(2);
      
      expect(observers[observerKey]).toBeDefined();
      expect(observers[observerKey].length).toBe(1);
      expect(observers[observerKey][0]).toBe(150);
    });
  });
});

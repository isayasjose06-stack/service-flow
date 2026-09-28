import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).error || errorCode;
      }
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      // Map Prisma error codes
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Resource conflict';
        errorCode = 'RESOURCE_CONFLICT';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        errorCode = 'RESOURCE_NOT_FOUND';
      } else if (exception.code === 'P1001') {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database error';
        errorCode = 'DATABASE_ERROR';
      }
    }

    const requestId = request.requestId || 'unknown';

    response.status(statusCode).json({
      statusCode,
      message,
      errorCode,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

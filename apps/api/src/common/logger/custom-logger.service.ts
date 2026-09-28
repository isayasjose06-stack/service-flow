import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private formatMessage(level: string, message: any, ...optionalParams: any[]): string {
    const logObj: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
    };

    let context = '';
    
    // NestJS commonly passes the context as the last parameter
    if (optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string') {
      context = optionalParams.pop();
    }

    if (typeof message === 'object' && message !== null) {
      Object.assign(logObj, message);
    } else {
      logObj.message = message;
    }

    if (context) {
      logObj.context = context;
    }

    if (optionalParams.length > 0) {
      logObj.meta = optionalParams;
    }

    this.redactSensitiveData(logObj);
    return JSON.stringify(logObj);
  }

  private redactSensitiveData(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const sensitiveKeys = ['password', 'passwordhash', 'token', 'accesstoken', 'refreshtoken', 'secret', 'cookie', 'authorization', 'apikey', 'access_token', 'refresh_token'];

    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.redactSensitiveData(obj[key]);
      }
    }
  }

  log(message: any, ...optionalParams: any[]) {
    console.log(this.formatMessage('INFO', message, ...optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    console.error(this.formatMessage('ERROR', message, ...optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    console.warn(this.formatMessage('WARN', message, ...optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    console.debug(this.formatMessage('DEBUG', message, ...optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    console.info(this.formatMessage('VERBOSE', message, ...optionalParams));
  }
}

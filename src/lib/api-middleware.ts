import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';
import { getTranslation } from './i18n-errors';

type RouteHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      const isProd = process.env.NODE_ENV === 'production';
      const langHeader = req.headers.get('accept-language');
      const statusCode = error.status || error.statusCode || 500;
      
      // Determine error key for translation
      let errorKey: Parameters<typeof getTranslation>[1] = 'internal_error';
      if (statusCode === 400) errorKey = 'bad_request';
      if (statusCode === 401) errorKey = 'unauthorized';
      if (statusCode === 404) errorKey = 'not_found';
      if (statusCode === 429) errorKey = 'rate_limit';

      const message = getTranslation(langHeader, errorKey);
      
      const errorResponse = {
        error: error.name || 'InternalServerError',
        message: message,
        ...(isProd ? {} : { stack: error.stack }),
      };

      // Logging JSON in prod, text in dev
      logger.error(`API Error: ${req.nextUrl.pathname}`, { 
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack 
      });

      // Send to Sentry only for unhandled 500s
      if (statusCode >= 500) {
        Sentry.captureException(error);
      }

      return NextResponse.json(errorResponse, { status: statusCode });
    }
  };
}

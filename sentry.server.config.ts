import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  // Don't send PII; staff identifiers are okay but no body content
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    return event;
  },
});

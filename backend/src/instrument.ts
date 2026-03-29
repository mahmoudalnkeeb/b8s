import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'] || 'https://c28b7b7bacde96db9833f84c5ee67a9c@o4511125577138176.ingest.de.sentry.io/4511125601386576',
  sendDefaultPii: true,
  environment: process.env['NODE_ENV'] || 'development',
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
});

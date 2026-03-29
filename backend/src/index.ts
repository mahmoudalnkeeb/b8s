// IMPORTANT: Import instrument.ts first to initialize Sentry before anything else
import './instrument';

import { app } from '@/presentation/index';

import { CoreLoader } from './infrastructure';
import { serverConfig } from './infrastructure/configs';
import { DIContainer } from './infrastructure/di/container';

const PORT = serverConfig.port;

async function bootstrap() {
  try {
    await CoreLoader.init();
    console.log('Core services initialized successfully');

    DIContainer.initializeQueues();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

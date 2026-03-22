import { app } from '@api/index';

import { CoreLoader } from './infrastructure';
import { serverConfig } from './infrastructure/configs';

const PORT = serverConfig.port;

async function bootstrap() {
  try {
    // 1. Initialize core (DBs, Env validation)
    await CoreLoader.init();
    console.log('Core services initialized successfully');

    // 2. Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

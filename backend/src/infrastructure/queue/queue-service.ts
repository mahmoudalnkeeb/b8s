import { Queue, Worker, Job, QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export interface JobData {
  [key: string]: unknown;
}

export interface JobProcessor<T extends JobData = JobData> {
  name: string;
  handler: (job: Job<T>) => Promise<unknown>;
  options?: Omit<WorkerOptions, 'connection'>;
}

export interface QueueConfig {
  name: string;
  options?: Omit<QueueOptions, 'connection'>;
}

export class QueueService {
  private connection: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private processors: Map<string, unknown> = new Map();

  constructor(redisUrl?: string) {
    const redisConnectionUrl = redisUrl || process.env['REDIS_URL'] || 'redis://localhost:6379';
    this.connection = new Redis(redisConnectionUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.connection.on('error', (err: Error) => {
      logger.error('Redis connection error:', err);
    });

    this.connection.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  /**
   * Register a queue
   */
  public registerQueue(config: QueueConfig): Queue {
    const existing = this.queues.get(config.name);
    if (existing) {
      return existing;
    }

    const queue = new Queue(config.name, {
      // @ts-expect-error - ioredis version mismatch between bullmq and project
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      ...config.options,
    });

    this.queues.set(config.name, queue);
    logger.info(`Queue registered: ${config.name}`);
    return queue;
  }

  /**
   * Register a job processor for a queue
   */
  public registerProcessor<T extends JobData>(
    queueName: string,
    processor: JobProcessor<T>,
  ): Worker {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found. Register it first.`);
    }

    const existingWorker = this.workers.get(`${queueName}:${processor.name}`);
    if (existingWorker) {
      logger.warn(`Processor ${processor.name} already registered for queue ${queueName}`);
      return existingWorker;
    }

    const worker = new Worker<T>(
      queueName,
      async (job: Job<T>) => {
        logger.info(`Processing job ${job.id} of type ${processor.name}`, {
          queue: queueName,
          jobId: job.id,
          data: job.data,
        });

        try {
          const result = await processor.handler(job);
          logger.info(`Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        // @ts-expect-error - ioredis version mismatch between bullmq and project
        connection: this.connection,
        concurrency: 5,
        ...processor.options,
      },
    );

    worker.on('completed', (job: Job<T>) => {
      logger.debug(`Job ${job.id} completed`);
    });

    worker.on('failed', (job: Job<T> | undefined, err: Error) => {
      logger.error(`Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err);
    });

    this.workers.set(`${queueName}:${processor.name}`, worker);
    this.processors.set(`${queueName}:${processor.name}`, processor);
    logger.info(`Processor registered: ${processor.name} for queue ${queueName}`);

    return worker;
  }

  /**
   * Add a job to a queue
   */
  public async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, {
      ...options,
    });

    logger.info(`Job added to queue ${queueName}: ${job.id}`);
    return job;
  }

  /**
   * Get a queue by name
   */
  public getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get job status
   */
  public async getJobStatus(
    queueName: string,
    jobId: string,
  ): Promise<{
    id: string;
    name: string;
    status: 'completed' | 'failed' | 'waiting' | 'active' | 'delayed' | 'unknown';
    progress: number;
    data: unknown;
    result?: unknown;
    failedReason?: string;
    attemptsMade: number;
    processedOn?: number;
    finishedOn?: number;
  } | null> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return null;
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const status = await job.getState();
    const progress = job.progress as number;

    const base = {
      id: job.id || '',
      name: job.name,
      status: (status || 'unknown') as
        | 'completed'
        | 'failed'
        | 'waiting'
        | 'active'
        | 'delayed'
        | 'unknown',
      progress: progress || 0,
      data: job.data,
      attemptsMade: job.attemptsMade,
    };

    return {
      ...base,
      ...(job.returnvalue !== undefined ? { result: job.returnvalue } : {}),
      ...(job.failedReason !== undefined ? { failedReason: job.failedReason } : {}),
      ...(job.processedOn !== undefined ? { processedOn: job.processedOn } : {}),
      ...(job.finishedOn !== undefined ? { finishedOn: job.finishedOn } : {}),
    };
  }

  /**
   * Update job progress
   */
  public async updateJobProgress(
    queueName: string,
    jobId: string,
    progress: number,
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.updateProgress(progress);
    }
  }

  /**
   * Get queue metrics
   */
  public async getQueueMetrics(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    }
  }

  /**
   * Resume a queue
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    }
  }

  /**
   * Clean completed/failed jobs from a queue
   */
  public async cleanQueue(queueName: string, gracePeriodMs: number = 86400000): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.clean(gracePeriodMs, 0, 'completed');
      await queue.clean(gracePeriodMs, 0, 'failed');
      logger.info(`Queue ${queueName} cleaned`);
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    logger.info('Closing all queue connections...');

    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.debug(`Worker ${name} closed`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.debug(`Queue ${name} closed`);
    }

    // Close Redis connection
    await this.connection.quit();
    logger.info('Queue service closed');
  }
}

// Singleton instance
let queueServiceInstance: QueueService | null = null;

export function getQueueService(redisUrl?: string): QueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService(redisUrl);
  }
  return queueServiceInstance;
}

export function resetQueueService(): void {
  queueServiceInstance = null;
}

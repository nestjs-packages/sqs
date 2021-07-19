import { SqsConfig, SqsQueueOptions, SqsQueueType } from './sqs.types';

export class SqsStorage {
  private static queueOptions: SqsQueueOptions = [];
  private static config: SqsConfig;

  public static getConfig(): SqsConfig {
    return this.config;
  }

  public static getQueueOptions(): SqsQueueOptions {
    return this.queueOptions;
  }

  public static setConfig(config: SqsConfig) {
    if (this.config !== undefined) {
      console.warn('config is already setted');
    }
    this.config = config;
  }

  public static addQueueOptions(options: SqsQueueOptions) {
    const queueOptions = options.map((option) => {
      return {
        ...option,
        type: option.type || SqsQueueType.All,
      };
    });
    this.queueOptions.push(...queueOptions);
  }
}

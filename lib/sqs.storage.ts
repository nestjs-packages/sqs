import { SqsQueueOptions, SqsQueueType } from './sqs.types';

export class SqsStorage {
  private static queueOptions: SqsQueueOptions = [];

  public static getQueueOptions(): SqsQueueOptions {
    return this.queueOptions;
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

import type { SQS } from 'aws-sdk';
import type { ConsumerOptions } from 'sqs-consumer';
import type { Producer } from 'sqs-producer';

export type ProducerOptions = Parameters<typeof Producer.create>[0];
export type QueueName = string;

export enum SqsConsumerEvent {
  RESPONSE_PROCESSED = 'response_processed',
  EMPTY = 'empty',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_PROCESSED = 'message_processed',
  ERROR = 'error',
  TIMEOUT_ERROR = 'timeout_error',
  PROCESSING_ERROR = 'processing_error',
  STOPPED = 'stopped',
}

export type SqsConsumerOptions = Omit<
  ConsumerOptions,
  'handleMessage' | 'handleMessageBatch' | 'queueUrl' | 'region' | 'sqs'
>;

export type SqsProducerOptions = Omit<ProducerOptions, 'queueUrl' | 'region' | 'sqs'>;

export type SqsConfig = SQS.Types.ClientConfiguration & {
  accountNumber: string;
};

export enum SqsQueueType {
  All = 'ALL',
  Producer = 'PRODUCER',
  Consumer = 'CONSUMER',
}
export type SqsQueueOption = {
  name: QueueName;
  type?: SqsQueueType;
  consumerOptions?: SqsConsumerOptions;
  producerOptions?: SqsProducerOptions;
};
export type SqsQueueOptions = Array<SqsQueueOption>;

export type SqsMetadata = {
  name: QueueName;
  messageHandler: {
    batch?: boolean;
    handleMessage: (...args: any[]) => any;
  };
  eventHandler: Array<{
    eventName: string | SqsConsumerEvent;
    handleEvent: (...args: any[]) => any;
  }>;
};

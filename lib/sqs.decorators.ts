import { SetMetadata } from '@nestjs/common';

import { SQS_CONSUMER_EVENT_HANDLER, SQS_CONSUMER_METHOD, SQS_PROCESS } from './sqs.constants';
import { QueueName, SqsConsumerEvent } from './sqs.types';

export const SqsMessageHandler = (batch?: boolean): MethodDecorator => SetMetadata(SQS_CONSUMER_METHOD, { batch });

export const SqsConsumerEventHandler = (eventName: SqsConsumerEvent): MethodDecorator =>
  SetMetadata(SQS_CONSUMER_EVENT_HANDLER, { eventName });

export const SqsProcess = (name: QueueName): ClassDecorator => SetMetadata(SQS_PROCESS, { name });

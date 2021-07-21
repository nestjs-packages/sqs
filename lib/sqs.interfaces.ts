import * as SQS from 'aws-sdk/clients/sqs';
import { ModuleMetadata } from '@nestjs/common';

import { SqsConsumerEvent } from './sqs.types';
import { SqsConfig } from './sqs.config';

export interface Message<T = any> {
  id: string;
  body: T;
  groupId?: string;
  deduplicationId?: string;
  delaySeconds?: number;
  messageAttributes?: SQS.MessageBodyAttributeMap;
}

export interface SqsAsyncConfig extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => SqsConfig | Promise<SqsConfig>;
  inject?: any[];
}

export interface SqsMessageHandlerMeta {
  batch?: boolean;
}

export interface SqsConsumerEventHandlerMeta {
  eventName: SqsConsumerEvent;
}

export interface SqsProcessMeta {
  name: string;
}

import { Consumer } from 'sqs-consumer';
import { Producer } from 'sqs-producer';
import type { QueueAttributeName } from 'aws-sdk/clients/sqs';
import * as SQS from 'aws-sdk/clients/sqs';
import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';

import { QueueName, SqsMetadata, SqsQueueOption, SqsQueueType } from './sqs.types';
import { SqsStorage } from './sqs.storage';
import { Message } from './sqs.interfaces';
import { SqsMetadataScanner } from './sqs-metadata.scanner';

@Injectable()
export class SqsService implements OnApplicationBootstrap, OnModuleDestroy {
  public readonly consumers = new Map<QueueName, Consumer>();
  public readonly producers = new Map<QueueName, Producer>();

  public constructor(private readonly scanner: SqsMetadataScanner) {}

  public async onApplicationBootstrap(): Promise<void> {
    const sqsConfig = SqsStorage.getConfig();
    const sqsQueueOptions = SqsStorage.getQueueOptions();
    const sqs: SQS = new SQS(sqsConfig);

    const sqsQueueConsumerOptions = sqsQueueOptions.filter(
      (v) => v.type === SqsQueueType.All || v.type === SqsQueueType.Consumer,
    );
    const sqsQueueProducerOptions = sqsQueueOptions.filter(
      (v) => v.type === SqsQueueType.All || v.type === SqsQueueType.Producer,
    );

    sqsQueueConsumerOptions.forEach((option) => {
      this.createConsumer(option, sqs);
    });

    sqsQueueProducerOptions.forEach((option) => {
      this.createProducer(option, sqs);
    });

    for (const consumer of this.consumers.values()) {
      consumer.start();
    }
  }

  private createConsumer(option: SqsQueueOption, sqs: AWS.SQS) {
    const { endpoint, accountNumber, region } = SqsStorage.getConfig();
    const { name, consumerOptions } = option;
    const metadata: SqsMetadata = this.scanner.sqsMetadatas.get(name);
    const {
      messageHandler: { batch, handleMessage },
      eventHandler: eventHandlers,
    } = metadata;
    const consumer = Consumer.create({
      queueUrl: `${endpoint}/${accountNumber}/${name}`,
      region,
      sqs,
      ...consumerOptions,
      ...(batch
        ? {
            handleMessageBatch: handleMessage,
          }
        : { handleMessage }),
    });

    for (const eventMetadata of eventHandlers) {
      if (eventMetadata) {
        consumer.addListener(eventMetadata.eventName, eventMetadata.handleEvent);
      }
    }
    this.consumers.set(name, consumer);
  }

  private createProducer(option: SqsQueueOption, sqs: AWS.SQS) {
    const { endpoint, accountNumber, region } = SqsStorage.getConfig();
    const { name, producerOptions } = option;
    if (this.producers.has(name)) {
      throw new Error(`Producer already exists: ${name}`);
    }

    const producer = Producer.create({
      queueUrl: `${endpoint}/${accountNumber}/${name}`,
      region,
      sqs,
      ...producerOptions,
    });
    this.producers.set(name, producer);
  }

  public onModuleDestroy() {
    for (const consumer of this.consumers.values()) {
      consumer.stop();
    }
  }

  private getQueueInfo(name: QueueName) {
    if (!this.consumers.has(name) && !this.producers.has(name)) {
      throw new Error(`Consumer/Producer does not exist: ${name}`);
    }

    const { sqs, queueUrl } = (this.consumers.get(name) ?? this.producers.get(name)) as {
      sqs: SQS;
      queueUrl: string;
    };
    if (!sqs) {
      throw new Error('SQS instance does not exist');
    }

    return {
      sqs,
      queueUrl,
    };
  }

  public async purgeQueue(name: QueueName) {
    const { sqs, queueUrl } = this.getQueueInfo(name);
    return sqs
      .purgeQueue({
        QueueUrl: queueUrl,
      })
      .promise();
  }

  public async getQueueAttributes(name: QueueName) {
    const { sqs, queueUrl } = this.getQueueInfo(name);
    const response = await sqs
      .getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      })
      .promise();
    return response.Attributes as { [key in QueueAttributeName]: string };
  }

  public getProducerQueueSize(name: QueueName) {
    if (!this.producers.has(name)) {
      throw new Error(`Producer does not exist: ${name}`);
    }

    return this.producers.get(name).queueSize();
  }

  public send<T = any>(name: QueueName, payload: Message<T> | Message<T>[]) {
    if (!this.producers.has(name)) {
      throw new Error(`Producer does not exist: ${name}`);
    }

    const originalMessages = Array.isArray(payload) ? payload : [payload];
    const messages = originalMessages.map((message) => {
      let body = message.body;
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }

      return {
        ...message,
        body,
      };
    });

    const producer = this.producers.get(name);
    return producer.send(messages as any[]);
  }
}

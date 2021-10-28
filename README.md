<center>
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
  <a href="https://github.com/nestjs-packages/sqs" target="blank">
    <h1 align="center">@nestjs-packages/sqs</h1>
  </a>
  <a href="https://www.npmjs.com/package/@nestjs-packages/sqs" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs-packages/sqs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestjs-packages/sqs" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs-packages/sqs.svg" alt="Package License" /></a>
  <a href="https://codecov.io/gh/nestjs-packages/sqs" target="_blank"><img src="https://codecov.io/gh/nestjs-packages/sqs/branch/master/graph/badge.svg?token=pMLNZOxXiq" alt="codecov coverage" /></a>
</center>

## Description

nestjs-sqs is a project to make SQS easier to use and control some required flows with NestJS. This module provides decorator-based message handling suited for simple use.

This library internally uses [bbc/sqs-producer](https://github.com/bbc/sqs-producer) and [bbc/sqs-consumer](https://github.com/bbc/sqs-consumer)

## Installation

```sh
$ npm i --save @nestjs-packages/sqs
# or
$ yarn add @nestjs-packages/sqs
```

## Quick Start

### SqsModule

#### forRootAsync

For use SqsModule, You have to set SQS configurations. you can set SQS configurations by forRootAsync method.
after forRootAsync method called, every sqs produers and consumers use SQS configurations returned by forRootAsync useFactory method

```ts
@Module({
  imports: [
    SqsModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => {
        const config = {
          region: configSerivce.region,
          endpoint: configSerivce.endpoint,
          accountNumber: configSerivce.accountNumber,
          credentials: {
            accessKeyId: configSerivce.accessKeyId,
            secretAccessKey: configService.secretAccessKey,
          },
        };
        return SqsConfig(config);
      },
      injects: [ConfigSerivce],
    }),
  ],
})
class AppModule {}
```

#### registerQueue

Second you have to register queues. register queues means create sqs-producer and sqs-consumer by queueOptions that passed into registerQueue parameter
default type of queueOption is 'ALL'

```ts
SqsModule.registerQueue(
  {
    name: 'queueName',
    type?: SqsQueueType.Consumer // 'ALL'|'CONSUMER'|'PRODUCER'
    consumerOptions?: {},
    producerOptions?: {}
  },
  ...
);
```

### consume message

You need to decorate providers and methods in your NestJS providers in order to have them be automatically attached as message(event) handlers for incoming SQS messages

```ts
@SqsProcess(/** name: */ queueName)
export class AppMessageHandler {
  @SqsMessageHandler(/** batch: */ false)
  public async handleMessage(message: AWS.SQS.Message) {}

  @SqsConsumerEventHandler(/** eventName: */ SqsConsumerEvent.PROCESSING_ERROR)
  public onProcessingError(error: Error, message: AWS.SQS.Message) {
    // report errors here
  }
}
```

You need to pass queueName to SqsProcess decorator. unless SqsModule won't register Consumer.
One class can only handle one queue. so if you want to enroll dead letter queue, you have to make new class that handle dead letter queue

### Produce messages

SqsService needs to be injected to produce the message.

```ts
export class AppService {
  public constructor(
    private readonly sqsService: SqsService,
  ) { }

  public async dispatchSomething() {
    await this.sqsService.send<BodyType>(/** name: */ 'queueName', {
      id: 'id',
      body: { ... },
      groupId: 'groupId',
      deduplicationId: 'deduplicationId',
      messageAttributes: { ... },
      delaySeconds: 0,
    });
  }
}
```

### Configuration

See [here](https://github.com/DEV-MUGLES/nestjs-sqs/blob/master/lib/sqs.types.ts), and note that we have same configuration as [bbc/sqs-consumer's](https://github.com/bbc/sqs-consumer).
In most time you just need to specify both `name` and `queueUrl` at the minimum requirements.

## License

This project is licensed under the terms of the MIT license.

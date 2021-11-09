import * as AWS from 'aws-sdk';
import waitForExpect from 'wait-for-expect';
import { Test, TestingModule } from '@nestjs/testing';

import {
  SqsModule,
  SqsService,
  SqsProcess,
  SqsConsumerEventHandler,
  SqsMessageHandler,
  SqsQueueOptions,
  SqsConsumerEvent,
  SqsConfig,
} from '../lib';

enum TestQueue {
  Test = 'test',
}
const TestQueueOptions: SqsQueueOptions = [
  {
    name: TestQueue.Test,
    consumerOptions: {
      waitTimeSeconds: 1,
      batchSize: 3,
      terminateVisibilityTimeout: true,
      messageAttributeNames: ['All'],
    },
  },
];

const config = {
  region: 'ap-northeast-2',
  endpoint: 'http://localhost:4413',
  accountNumber: '000000000000',
  credentials: {
    accessKeyId: 'temp',
    secretAccessKey: 'temp',
  },
};

describe('SqsModule', () => {
  let module: TestingModule;
  const fakeProcessor = jest.fn();
  const fakeDLQProcessor = jest.fn();
  const fakeErrorEventHandler = jest.fn();

  @SqsProcess(TestQueue.Test)
  class TestHandler {
    @SqsMessageHandler()
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async handleTestMessage(message: AWS.SQS.Message) {
      fakeProcessor(message);
    }

    @SqsConsumerEventHandler(SqsConsumerEvent.PROCESSING_ERROR)
    public handleErrorEvent(err: Error, message: AWS.SQS.Message) {
      fakeErrorEventHandler(err, message);
    }
  }

  describe('forRootAsync', () => {
    afterAll(async () => {
      await module.close();
    });

    it('should register sqsConfig', async () => {
      module = await Test.createTestingModule({
        imports: [
          SqsModule.forRootAsync({
            useFactory: async () => new SqsConfig(config),
          }),
        ],
      }).compile();
      const sqsConfig = module.get<SqsConfig>(SqsConfig);
      expect(sqsConfig.option).toMatchObject(config);
    });
  });

  describe('full flow', () => {
    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          SqsModule.forRootAsync({
            useFactory: () => new SqsConfig(config),
          }),
          SqsModule.registerQueue(...TestQueueOptions),
        ],
        providers: [TestHandler],
      }).compile();
      await module.init();
    });
    afterEach(() => {
      fakeProcessor.mockRestore();
      fakeErrorEventHandler.mockRestore();
    });
    afterAll(async () => {
      fakeDLQProcessor.mockReset();
      await module.close();
    });

    it('should register message handler', () => {
      const sqsService = module.get(SqsService);
      expect(sqsService.consumers.has(TestQueue.Test)).toBe(true);
    });

    it('should register message producer', () => {
      const sqsService = module.get(SqsService);
      expect(sqsService.producers.has(TestQueue.Test)).toBe(true);
    });

    it('should call message handler when a new message has come', async () => {
      jest.setTimeout(10000);

      const sqsService = module.get(SqsService);
      const id = String(Math.floor(Math.random() * 1000000));

      await sqsService.send(TestQueue.Test, {
        id,
        body: { test: true },
        delaySeconds: 0,
        groupId: 'test',
        deduplicationId: id,
      });

      await waitForExpect(
        () => {
          const message = fakeProcessor.mock.calls[0][0];
          expect(message).toBeTruthy();
          expect(JSON.parse(message.Body)).toStrictEqual({ test: true });
        },
        5000,
        100,
      );
    });

    it('should call message handler multiple times when multiple messages have come', async () => {
      jest.setTimeout(10000);

      const sqsService = module.get(SqsService);
      const groupId = String(Math.floor(Math.random() * 1000000));

      for (let i = 0; i < 3; i++) {
        const id = `${groupId}_${i}`;
        await sqsService.send(TestQueue.Test, {
          id,
          body: { test: true, i },
          delaySeconds: 0,
          groupId,
          deduplicationId: id,
        });
      }

      await waitForExpect(
        () => {
          expect(fakeProcessor.mock.calls).toHaveLength(3);
          for (const call of fakeProcessor.mock.calls) {
            expect(call).toHaveLength(1);
            expect(call[0]).toBeTruthy();
          }
        },
        5000,
        100,
      );
    });

    it('should call the registered error handler when an error occurs', async () => {
      jest.setTimeout(10000);

      const sqsService = module.get(SqsService);
      const id = String(Math.floor(Math.random() * 1000000));
      const payload = {
        id,
        body: { test: true },
        delaySeconds: 0,
        groupId: 'test',
        deduplicationId: id,
      };

      class TestError extends Error {}
      fakeProcessor.mockImplementationOnce(() => {
        throw new TestError('test');
      });

      await sqsService.send(TestQueue.Test, payload);

      await waitForExpect(
        () => {
          expect(fakeErrorEventHandler.mock.calls[0][0]).toBeTruthy();
          expect(fakeErrorEventHandler.mock.calls[0][0].constructor.name).toBe('TestError');
        },
        5000,
        100,
      );
    });
  });
});

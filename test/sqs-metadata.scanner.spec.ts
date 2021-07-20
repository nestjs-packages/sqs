import * as faker from 'faker';
import { DiscoveryModule, DiscoveryService } from '@nestjs-plus/discovery';
import { Test, TestingModule } from '@nestjs/testing';

import { SqsMetadataScanner } from '../lib';
import { SQS_CONSUMER_EVENT_HANDLER, SQS_CONSUMER_METHOD } from '../lib/sqs.constants';

class MockClass {}

describe('SqsMetadataScanner', () => {
  let module: TestingModule;
  let sqsMetadataScanner: SqsMetadataScanner;
  let discover: DiscoveryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [
        {
          provide: SqsMetadataScanner,
          useFactory: (discover: DiscoveryService) => {
            return new SqsMetadataScanner(discover);
          },
          inject: [DiscoveryService],
        },
      ],
    }).compile();

    sqsMetadataScanner = module.get<SqsMetadataScanner>(SqsMetadataScanner);
    discover = module.get<DiscoveryService>(DiscoveryService);
  });

  const getMockProvidersValue = (name) => [
    {
      meta: { name },
      discoveredClass: {
        instance: {},
        name,
        dependencyType: MockClass,
        parentModule: {
          name: 'parent',
          instance: {},
          dependencyType: MockClass,
        },
      },
    },
  ];

  const getMockEventHandlerValue = (eventName, count) =>
    Array.from(Array(count)).map((_, index) => ({
      meta: { eventName: eventName + index },
      discoveredMethod: {
        handler: jest.fn(),
        methodName: eventName + index,
        parentClass: {
          instance: {},
          name: 'mockclass',
          dependencyType: MockClass,
          parentModule: {
            name: 'parentclass',
            instance: {},
            dependencyType: MockClass,
          },
        },
      },
    }));

  const getMockMessageHandlerValue = (batch) => [
    {
      meta: { batch },
      discoveredMethod: {
        handler: jest.fn(),
        methodName: 'handleMessage',
        parentClass: {
          instance: {},
          name: 'mockclass',
          dependencyType: MockClass,
          parentModule: {
            name: 'parentclass',
            instance: {},
            dependencyType: MockClass,
          },
        },
      },
    },
  ];
  describe('onModuleInit', () => {
    it('성공적으로 데이터를 저장한다.', async () => {
      const methodName = faker.datatype.string(10);
      const eventName = faker.datatype.string(10);
      const eventCount = faker.datatype.number({ min: 1, max: 5 });
      const batch = faker.datatype.boolean();
      const expectedEventHandler = getMockEventHandlerValue(eventName, eventCount);

      jest.spyOn(discover, 'providersWithMetaAtKey').mockImplementation(async () => {
        return getMockProvidersValue(methodName);
      });
      jest.spyOn(discover, 'classMethodsWithMetaAtKey').mockImplementation((_, metaKey) => {
        if (metaKey === SQS_CONSUMER_EVENT_HANDLER) {
          return expectedEventHandler;
        }
        if (metaKey === SQS_CONSUMER_METHOD) {
          return getMockMessageHandlerValue(batch);
        }
      });
      await sqsMetadataScanner.onModuleInit();
      const sqsMetadata = sqsMetadataScanner.sqsMetadatas.get(methodName);

      expect(sqsMetadata.name).toEqual(methodName);
      expect(sqsMetadata.messageHandler.batch).toEqual(batch);
      expect(sqsMetadata.eventHandler.length).toEqual(eventCount);
      sqsMetadata.eventHandler.forEach((v, index) => {
        expect(v.eventName).toEqual(expectedEventHandler[index].meta.eventName);
      });
    });
  });
});

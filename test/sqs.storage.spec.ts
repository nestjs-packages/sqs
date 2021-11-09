import * as faker from 'faker';
import { SqsQueueOption, SqsQueueOptions, SqsQueueType, SqsStorage } from '../lib';

describe('SqsStorage', () => {
  describe('addQueueOptions', () => {
    it('should add queue option', () => {
      const queueOptionCount = faker.datatype.number({ min: 1, max: 10 });
      const queueOptions: SqsQueueOptions = Array.from(Array(queueOptionCount)).map(() => ({
        name: faker.datatype.string(10),
        type: faker.datatype.boolean() ? SqsQueueType.Consumer : SqsQueueType.Producer,
      }));
      SqsStorage.addQueueOptions(queueOptions);
      expect(SqsStorage.getQueueOptions()).toMatchObject(queueOptions);
    });

    it('should set queueType as "ALL" when not given', () => {
      const queueOption: SqsQueueOption = {
        name: faker.datatype.string(10),
      };

      SqsStorage.addQueueOptions([queueOption]);
      expect(SqsStorage.getQueueOptions().find((v) => v.name === queueOption.name).type).toEqual(SqsQueueType.All);
    });
  });
});

import * as faker from 'faker';
import { SqsConfig, SqsQueueOption, SqsQueueOptions, SqsQueueType, SqsStorage } from '../lib';

describe('SqsStorage', () => {
  describe('setConfig', () => {
    const config: SqsConfig = {
      region: 'ap-northeast-2',
      endpoint: 'http://localhost:4566',
      accountNumber: '000000000000',
      credentials: {
        accessKeyId: 'temp',
        secretAccessKey: 'temp',
      },
    };
    it('성공적으로 config를 저장한다.', () => {
      SqsStorage.setConfig(config);
      expect(SqsStorage.getConfig()).toMatchObject(config);
    });
    it('이미 존재하는 config를 저장하려고 하면, warning을 발생한다', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      SqsStorage.setConfig(config);
      expect(warnSpy).toBeCalled();
    });
  });

  describe('addQueueOptions', () => {
    it('성공적으로 queueOptions을 추가한다.', () => {
      const queueOptionCount = faker.datatype.number({ min: 1, max: 10 });
      const queueOptions: SqsQueueOptions = Array.from(Array(queueOptionCount)).map(() => ({
        name: faker.datatype.string(10),
        type: faker.datatype.boolean() ? SqsQueueType.Consumer : SqsQueueType.Producer,
      }));
      SqsStorage.addQueueOptions(queueOptions);
      expect(SqsStorage.getQueueOptions()).toMatchObject(queueOptions);
    });
    it('type을 전달하지 않으면, ALL로 설정한다.', () => {
      const queueOption: SqsQueueOption = {
        name: faker.datatype.string(10),
      };

      SqsStorage.addQueueOptions([queueOption]);
      expect(SqsStorage.getQueueOptions().find((v) => v.name === queueOption.name).type).toEqual(SqsQueueType.All);
    });
  });
});

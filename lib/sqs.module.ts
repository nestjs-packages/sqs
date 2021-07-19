import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs-plus/discovery';

import { SqsService } from './sqs.service';
import { SqsAsyncConfig } from './sqs.interfaces';
import { SqsQueueOptions } from './sqs.types';
import { SqsMetadataScanner } from './sqs-metadata.scanner';
import { SqsStorage } from './sqs.storage';

@Global()
@Module({})
export class SqsModule {
  public static forRootAsync(asyncSqsConfig: SqsAsyncConfig): DynamicModule {
    const imports = this.getUniqImports([asyncSqsConfig]);

    const SqsMetadatScanner: Provider = {
      provide: SqsMetadataScanner,
      useFactory: async (discover: DiscoveryService) => {
        return new SqsMetadataScanner(discover);
      },
      inject: [DiscoveryService],
    };
    this.setSqsConfig(asyncSqsConfig);

    return {
      global: true,
      module: SqsModule,
      imports: [...imports, DiscoveryModule],
      providers: [SqsMetadatScanner],
      exports: [SqsMetadatScanner],
    };
  }

  private static async setSqsConfig(options: SqsAsyncConfig) {
    SqsStorage.setConfig(await options.useFactory());
  }

  public static registerQueue(...options: SqsQueueOptions) {
    SqsStorage.addQueueOptions([].concat(options));
    const sqsService: Provider = {
      provide: SqsService,
      useFactory: async (scanner: SqsMetadataScanner) => {
        return new SqsService(scanner);
      },
      inject: [SqsMetadataScanner],
    };

    return {
      global: true,
      module: SqsModule,
      providers: [sqsService],
      exports: [sqsService],
    };
  }

  private static getUniqImports(options: Array<SqsAsyncConfig>) {
    return (
      options
        .map((option) => option.imports)
        .reduce((acc, i) => acc.concat(i || []), [])
        .filter((v, i, a) => a.indexOf(v) === i) || []
    );
  }
}

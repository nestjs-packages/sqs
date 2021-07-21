import { Injectable } from '@nestjs/common';
import { SqsConfigOption } from './sqs.types';

@Injectable()
export class SqsConfig {
  public constructor(public readonly option: SqsConfigOption) {}
}

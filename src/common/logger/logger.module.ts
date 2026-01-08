import { Module } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-mongodb';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonUtilities.format.nestLike('TRIZ-LAB', {
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.MongoDB({
          level: 'info',
          db: 'mongodb://mongo:27017/TRIZLAB',
          options: {
            useUnifiedTopology: true,
          },
          collection: 'log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
})
export class LoggerModule {}


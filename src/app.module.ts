import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthGatewayController } from './controllers/auth.controller';
import { OrderGatewayController } from './controllers/order.controller';
import { NotificationGatewayController } from './controllers/notification.controller';

import { AuthGatewayService } from './services/auth.service';
import { OrderGatewayService } from './services/order.service';
import { NotificationGatewayService } from './services/notification.service';

import { JwtStrategy } from 'utils/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_SERVICE_HOST'),
            port: Number(config.get<string>('AUTH_SERVICE_PORT')),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
      },
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ORDER_SERVICE_HOST'),
            port: Number(config.get<string>('ORDER_SERVICE_PORT')),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('NOTIFICATION_SERVICE_HOST'),
            port: Number(config.get<string>('NOTIFICATION_SERVICE_PORT')),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
      },
    ]),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],

  controllers: [
    AppController,
    AuthGatewayController,
    OrderGatewayController,
    NotificationGatewayController,
  ],

  providers: [
    AppService,
    AuthGatewayService,
    OrderGatewayService,
    NotificationGatewayService,
    JwtStrategy,
  ],
})
export class AppModule {}

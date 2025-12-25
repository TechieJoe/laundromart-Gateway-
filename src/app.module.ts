import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGatewayService } from './services/auth.service';
import { AuthGatewayController } from './controllers/auth.controller';
import { OrderGatewayController } from './controllers/order.controller';
import { OrderGatewayService } from './services/order.service';
import { NotificationGatewayController } from './controllers/notification.controller';
import { NotificationGatewayService } from './services/notification.service';
import { JwtStrategy } from 'utils/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Microservices clients using ConfigService (async + env-aware)
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_SERVICE_HOST'),
            port: config.get<number>('AUTH_SERVICE_PORT'),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      }, 
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ORDER_SERVICE_HOST'),
            port: config.get<number>('ORDER_SERVICE_PORT'),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('NOTIFICATION_SERVICE_HOST'),
            port: config.get<number>('NOTIFICATION_SERVICE_PORT'),
            retryAttempts: 5,
            retryDelay: 1000,
          },
        }),
        inject: [ConfigService],
      },
    ]),

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
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
    JwtStrategy,
    OrderGatewayService,
    NotificationGatewayService,
  ],
})
export class AppModule {}
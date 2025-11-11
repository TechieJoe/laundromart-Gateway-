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
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4000,
          retryAttempts: 5,
          retryDelay: 1000,
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 6000,
          retryAttempts: 5,
          retryDelay: 1000,
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5000,
          retryAttempts: 5,
          retryDelay: 1000,
        },
      },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, AuthGatewayController, OrderGatewayController, NotificationGatewayController],
  providers: [AppService, AuthGatewayService, JwtStrategy, OrderGatewayService, NotificationGatewayService],
})
export class AppModule {}
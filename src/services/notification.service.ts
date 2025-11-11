import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { CreateNotificationDto } from 'utils/dto/notification';

@Injectable()
export class NotificationGatewayService {
  constructor(@Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy) {}

  createNotification(createNotificationDto: CreateNotificationDto, token: string): Observable<any> {
    return this.notificationClient.send({ cmd: 'create_notification' }, { ...createNotificationDto, token });
  }

  getNotifications(userId: string, token: string): Observable<any> {
    return this.notificationClient.send({ cmd: 'get_notifications' }, { userId, token });
  }
}
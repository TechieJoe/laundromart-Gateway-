import { Controller, Post, Body, Get, Req, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpException } from '@nestjs/common';
import { NotificationGatewayService } from 'src/services/notification.service';
import { JwtAuthGuard } from 'utils/jwt';
import { CreateNotificationDto } from 'utils/dto/notification';

@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationGatewayController {
  private readonly logger = new Logger(NotificationGatewayController.name);

  constructor(private readonly notificationService: NotificationGatewayService) {}

  @Post('create')
  createNotification(@Body() createNotificationDto: CreateNotificationDto, @Req() req: Request): Observable<any> {
    const token = req.cookies?.jwt;
    this.logger.log(`Creating notification for userId: ${(req.user as any).userId}`);
    return this.notificationService.createNotification(createNotificationDto, token).pipe(
      map(() => ({
        status: HttpStatus.CREATED,
        message: 'Notification created',
      })),
      catchError((error) => {
        this.logger.error(`Notification creation failed: ${error.message}`, error.stack);
        throw new HttpException(
          `Notification creation failed: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }),
    );
  }

  @Get('list')
  getNotifications(@Req() req: Request): Observable<any> {
    const userId = (req.user as any).userId;
    const token = req.cookies?.jwt;
    this.logger.log(`Fetching notifications for userId: ${userId}`);
    return this.notificationService.getNotifications(userId, token).pipe(
      map((response) => ({
        status: HttpStatus.OK,
        data: response,
      })),
      catchError((error) => {
        this.logger.error(`Fetching notifications failed: ${error.message}`, error.stack);
        throw new HttpException(
          `Fetching notifications failed: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }),
    );
  }
}
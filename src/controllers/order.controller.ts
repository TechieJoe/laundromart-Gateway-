import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Res,
  Logger,
  UseGuards,
  Render,
  HttpStatus,
  Query,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OrderGatewayService } from 'src/services/order.service';
import { CreateOrderDto } from 'utils/dto/order';
import { JwtCookieGuard } from 'utils/jwt';

@UseGuards(JwtCookieGuard) // protect endpoints that require an authenticated user
@Controller('order')
export class OrderGatewayController {
  private readonly logger = new Logger(OrderGatewayController.name);

  constructor(private readonly orderService: OrderGatewayService) {}

  @Get('service')
  @Render('service')
  servicePage() {}

  @Get('create')
  @Render('order')
  orderPage() {}

  /**
   * Create an order and initialize Paystack transaction.
   * The JwtCookieGuard ensures req.user is available. We still
   * extract and forward the raw JWT token to the microservice,
   * because the microservice validates the token itself.
   */
  @Post('createOrder')
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`🎯 createOrder request received`);

      // Try common cookie names (Authentication is preferred)
      const token =
        req.cookies?.Authentication ||
        req.cookies?.jwt ||
        req.cookies?.access_token ||
        null;

      if (!token) {
        this.logger.warn('No JWT token found in cookies for createOrder');
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'User not authenticated' });
      }

      // Log minimal info (avoid logging sensitive token in production)
      this.logger.log(`👤 createOrder by user: ${JSON.stringify(req.user ?? { })}`);

      // Forward dto + token to the gateway service which will call the microservice
      const result = await this.orderService.createOrder(createOrderDto, token);

      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error(`❌ createOrder failed: ${error?.message || error}`, error?.stack);
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        message: 'Failed to place order',
        error: error.message || error,
      });
    }
  }

  
    //Verify transaction by reference (public or protected depending on your design).
    //This simply forwards verification to the microservice.
   //test
  @Get('verify/:reference')
  async verifyTransaction(@Param('reference') reference: string, @Res() res: Response) {
    try {
      const data = await this.orderService.verifyTransaction(reference);

      // ✅ Check if transaction is successful
      if (data && data.status === true && data.data.status === 'success') {
        // Redirect to home page after successful verification
        return res.redirect('/laundromart/auth/home');
      }

      // If failed, redirect or return error
      return res.redirect('/laundromart/order/paymentFailed');
    } catch (err) {
      this.logger.error(`❌ verifyTransaction failed: ${err?.message || err}`, err?.stack);
      return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message || 'Verification failed' });
    }
  }

   

    /**

@Get('verify/:reference')
async verifyPayment(
  @Param('reference') reference: string,
  @Res() res: Response,
) {
  try {
    const result = await this.orderService.verifyPayment(reference);

    // ✅ If payment successful
    if (result.success === true) {
      return res.redirect('/laundromart/auth/home');
    }

    // ❌ If payment failed
    return res.redirect('/laundromart/order/paymentFailed');

  } catch (err) {
    this.logger.error(`❌ verifyPayment failed: ${err?.message || err}`);
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: err?.message || 'Verification failed',
    });
  }
}

   */


  @Get('callback')
  async paystackCallback(@Query('reference') reference: string, @Res() res: Response) {
  try {
    this.logger.log(`💳 Paystack callback hit → reference=${reference}`);

    if (!reference) {
      this.logger.warn('⚠️ Missing reference in Paystack callback');
      return res.status(400).send('Missing reference');
    }

    // ✅ Simply redirect to your existing verify route
    const verifyUrl = `/laundromart/order/verify/${reference}`;
    this.logger.log(`➡️ Redirecting to ${verifyUrl}`);

    return res.redirect(verifyUrl);
  } catch (error) {
    this.logger.error(`❌ Callback redirect failed: ${error.message}`);
    return res.status(500).send('Callback processing failed');
  }
}

   //test
  // Webhook endpoint (should be public and secured via Paystack signature verification in production).
  @Post('webhook')
  async handleWebhook(@Body() event: any, @Res() res: Response) {
    try {
      await this.orderService.handleWebhook(event);
      // Paystack expects a 200 OK quickly
      return res.status(HttpStatus.OK).send('ok');
    } catch (err) {
      this.logger.error(`❌ handleWebhook failed: ${err?.message || err}`, err?.stack);
      return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message || 'Webhook handling failed' });
    }
  }

   

    /**

  @Post('paystack')
  async handlePaystackWebhook(@Body() payload: any, @Res() res: Response) {
  try {
    await this.orderService.forwardWebhook(payload);
    return res.status(200).send('Webhook received');
  } catch (err) {
    return res.status(500).send('Internal server error');
  }
 }
   */


  
  @Get('notification')
  @Render('notification')
  async userNotifications(@Req() req) {

    const token = req.cookies?.Authentication // <-- MUST MATCH YOUR COOKIE NAME

    if (!token) {
      throw new HttpException('Unauthorized: No token found', HttpStatus.UNAUTHORIZED);
    }

    const notifications = await this.orderService.getOrders(token);

    return { notifications };
  }

}



import { Injectable, Inject, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout, TimeoutError } from 'rxjs';
import { CreateOrderDto } from 'utils/dto/order';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderGatewayService {
  private readonly logger = new Logger(OrderGatewayService.name);

  // configure a reasonable timeout for microservice calls
  private readonly RPC_TIMEOUT_MS = 10_000;

  constructor(@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy) {}

  /**
   * Create order: forward DTO + raw token to microservice.
   * The microservice is responsible for validating token, saving order and initializing Paystack.
   */
  async createOrder(dto: CreateOrderDto, token: string): Promise<any> {
    this.logger.log('📤 Forwarding create_order to order microservice');

    // Keep DTO light — forward DTO and token in one object
    const payload = { dto, token };

    try {
      const response = await lastValueFrom(
        this.orderClient.send({ cmd: 'create_order' }, payload).pipe(timeout(this.RPC_TIMEOUT_MS)),
      );

      return response;   
    } catch (err) {
      if (err instanceof TimeoutError) {
        this.logger.error('❌ createOrder RPC timed out');
        throw new HttpException('Order service timeout', HttpStatus.GATEWAY_TIMEOUT);
      }
      this.logger.error(`❌ createOrder rpc error: ${err?.message || err}`);
      // If microservice returned an HttpException-like object, bubble message/status
      if (err?.response && err?.status) {
        throw new HttpException(err.response, err.status);
      }
      throw new HttpException(err?.message || 'Order service error', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get orders for a user: forwards userId and raw token to microservice.
   */
  async getOrders(token: string) {
    this.logger.log(`📥 Forwarding get_orders for userId=${token}`);
    try {
      const response = await lastValueFrom(
        this.orderClient.send({ cmd: 'get_orders' }, { token }).pipe(timeout(this.RPC_TIMEOUT_MS)),
      );
      return response;
    } catch (err) {
      this.logger.error(`❌ getOrders rpc error: ${err?.message || err}`);
      throw new HttpException(err?.message || 'Order service error', HttpStatus.BAD_REQUEST);
    }
  }

   //test
   // Forward verify transaction request to microservice
  async verifyTransaction(reference: string) {
    this.logger.log(`🔎 Forwarding verify_transaction for ref=${reference}`);
    try {
      const response = await lastValueFrom(
        this.orderClient.send({ cmd: 'verify_transaction' }, { reference }).pipe(timeout(this.RPC_TIMEOUT_MS)),
      );
      return response;
    } catch (err) {
      this.logger.error(`❌ verifyTransaction rpc error: ${err?.message || err}`);
      throw new HttpException(err?.message || 'Order service error', HttpStatus.BAD_REQUEST);
    }
  }



    /**
      *live
async verifyPayment(reference: string) {
    try {
      const response = await firstValueFrom(
        this.orderClient.send(
          { cmd: 'verify-payment' },
          { reference },
        ),
      );

      // Normalize the response to always return { success: boolean, data: any }
      if (response?.status === true && response?.data?.status === 'success') {
        return { success: true, data: response.data };
      }

      return { success: false, data: response?.data || null };

    } catch (error) {
      this.logger.error('verifyPayment (gateway) error', error);
      throw new HttpException(
        'Failed to verify payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

   */

   //test
   // Forward webhook event to microservice
  async handleWebhook(event: any) {
    this.logger.log('📨 Forwarding webhook event to microservice');
    try {
      const response = await lastValueFrom(
        this.orderClient.send({ cmd: 'handle_webhook' }, { event }).pipe(timeout(this.RPC_TIMEOUT_MS)),
      );
      return response;
    } catch (err) {
      this.logger.error(`❌ handleWebhook rpc error: ${err?.message || err}`);
      throw new HttpException(err?.message || 'Order service error', HttpStatus.BAD_REQUEST);
    }
  }


    /**
      live
   async forwardWebhook(payload: any) {
    try {
      this.logger.log(`Sending webhook payload for reference: ${payload?.data?.reference}`);

      const result = await firstValueFrom(
        this.orderClient.send({ cmd: 'paystack-webhook' }, payload),
      );

      this.logger.log(`Webhook processed result: ${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      this.logger.error('Failed to forward webhook', err);
      throw err;
    }
  }
        */

}

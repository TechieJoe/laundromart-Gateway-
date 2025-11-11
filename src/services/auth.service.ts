import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { LoginDto, RegisterDto } from 'utils/dto/auth';
import axios from 'axios';


@Injectable()
export class AuthGatewayService {
  private AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000/auth/get_profile';

  constructor(@Inject('AUTH_SERVICE') private authClient: ClientProxy) {}

  login(loginDto: LoginDto, res: Response): Observable<any> {
    return this.authClient.send({ cmd: 'login_user' }, loginDto).pipe(
     map((response: { access_token: string }) => {
      res.cookie('Authentication', response.access_token, {
      httpOnly: true,
       secure: true,
      sameSite: 'none',
       maxAge: 60 * 60 * 1000,
  });
  return ({ message: 'Login successful' });
     }),
    );
  }

  register(registerDto: RegisterDto, res: Response): Observable<any> {
    return this.authClient.send({ cmd: 'register_user' }, registerDto).pipe(
      map((response: { access_token: string }) => {
        res.cookie('Authentication', response.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 1000,
        });
        return { message: 'Registration successful' };
      }),
    );
  }


 async getUserProfile(reqUser: any) {
    const userId = reqUser.userId; // <-- MUST NOT be undefined

    return await this.authClient
      .send({ cmd: 'get_profile' }, { userId }) // <-- MUST match pattern
      .toPromise();
  }

  async updateProfile(updateProfileDto, file, cookies) {
    return this.authClient
      .send('update-profile', { body: updateProfileDto, file, cookies })
      .toPromise();
  }
  
}
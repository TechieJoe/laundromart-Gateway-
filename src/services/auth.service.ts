import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { LoginDto, RegisterDto } from 'utils/dto/auth';


@Injectable()
export class AuthGatewayService {

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
          secure: true,
          sameSite: 'none',
          maxAge: 60 * 60 * 1000,
        });
        return { message: 'Registration successful' };
      }),
    );
  }


 async getUserProfile(reqUser: any) {
    const userId = reqUser.userId; // <-- MUST NOT be undefined

    return await firstValueFrom(
      this.authClient.send({ cmd: 'get_profile' }, { userId })
    );
  }

  async updateProfile(updateProfileDto, file, cookies) {
    return await firstValueFrom(
      this.authClient.send({ cmd: 'update-profile' }, { body: updateProfileDto, file, cookies })
    );
  }
  
}
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from 'utils/interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.Authentication || null
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<User> {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const token = req.cookies?.Authentication;  // MUST MATCH login cookie name
    

    console.log('🔍 Incoming Cookies →', req.cookies);
    console.log('🔍 Token From Cookie →', token);

    if (!token) throw new UnauthorizedException('User not authenticated: Cookie is missing');

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      console.log('❌ JWT secret is not configured');
      throw new UnauthorizedException('Server misconfiguration: JWT secret is missing');
    }

    try {
      const decoded = jwt.verify(token, secret as jwt.Secret);

      console.log('✅ Decoded JWT →', decoded);
      req.user = decoded as any;
      return true;
    } catch (err) {
      console.log('❌ JWT Verification Error →', (err as Error).message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
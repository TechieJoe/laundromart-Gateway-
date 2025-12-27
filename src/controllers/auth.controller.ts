import { Body, Controller, Inject, Post, UseGuards, Get, Req, Res, HttpStatus, Render, Logger, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { HttpException } from '@nestjs/common';
import { JwtAuthGuard } from 'utils/jwt';
import { AuthGatewayService } from 'src/services/auth.service';
import { LoginDto, RegisterDto } from 'utils/dto/auth';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthGatewayController {
  private readonly logger = new Logger(AuthGatewayController.name);

  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    private authGatewayService: AuthGatewayService,
  ) {}

  @Get('login')
  @Render('login')
  renderLogin(@Req() req: Request) {
    return { title: 'Login', error: req.query.error || null };
  }

  @Post('login')
  login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Observable<any> {
    this.logger.log(`Processing login request for email: ${loginDto}`);
    const isBrowser = req.headers.accept?.includes('text/html');
    return this.authGatewayService.login(loginDto, res).pipe(
      map((response) => {
        if (isBrowser) {
          res.redirect('/laundromart/auth/home');
        } else {
          return { status: HttpStatus.OK, message: response.message };
        }
      }),
      catchError((error) => {
        this.logger.error(`Login failed: ${error.message}`, error.stack);
        const errorMessage = error.message.includes('Connection closed') ? 'Auth service unavailable' : error.message;
        if (isBrowser) {
          res.redirect(`/laundromart/auth/login?error=${encodeURIComponent(errorMessage)}`);
        }
        throw new HttpException(`Login failed: ${errorMessage}`, HttpStatus.SERVICE_UNAVAILABLE);
      }),
    );
  }

  @Get('register')
  @Render('register')
  renderRegister(@Req() req: Request) {
    return { title: 'Register', error: req.query.error || null };
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Observable<any> {
    console.log(registerDto);
    this.logger.log(`Processing register request for email: ${registerDto}`);
    const isBrowser = req.headers.accept?.includes('text/html');
    return this.authGatewayService.register(registerDto, res).pipe(
      map((response) => {
        if (isBrowser) {
          res.redirect('/laundromart/auth/home');
        } else {
          return { status: HttpStatus.CREATED, message: response.message };
        }
      }),
      catchError((error) => {
        this.logger.error(`Registration failed: ${error.message}`, error.stack);
        const errorMessage = error.message.includes('Connection closed') ? 'Auth service unavailable' : error.message;
        if (isBrowser) {
          res.redirect(`/laundromart/auth/register?error=${encodeURIComponent(errorMessage)}`);
        }
        throw new HttpException(`Registration failed: ${errorMessage}`, HttpStatus.SERVICE_UNAVAILABLE);
      }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('home')
  @Render('home')
  renderHome(@Req() req: Request) {
    return { title: 'Home', user: req.user || null };
  }
  

@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfilePage(@Req() req, @Res() res) {
  console.log('CONTROLLER req.user =>', req.user); // Debug
  const profile = await this.authGatewayService.getUserProfile(req.user);
  return res.render('profile', { user: profile });
}


@Put('update-profile')
  @UseInterceptors(FileInterceptor('image')) 
  async updateProfile(
    @Body() updateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.authGatewayService.updateProfile(updateProfileDto, file, req.cookies);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Authetication', {
      secure: true,
      sameSite: 'none',
    });
    res.redirect('/auth/login');
    return { status: HttpStatus.OK, message: 'Logout successful' };
  }
}
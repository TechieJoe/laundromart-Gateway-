import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import for Express-specific methods
import * as cookieParser from 'cookie-parser';
import { join } from 'path'; // Import join
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // Cast to NestExpressApplication
  app.use(cookieParser());

  // Configure CORS
app.enableCors({
  origin: true,
  credentials: true,
});

  // Configure EJS
  app.setViewEngine('ejs');
    app.useStaticAssets(join(__dirname, '..', '..', 'public'));

  app.setBaseViewsDir(join(__dirname, '..', '..','views')); // Set views directory
  app.useStaticAssets(join(__dirname, '..', '..', 'public'));


  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('laundromart');
  
  await app.listen(3000);
  app.startAllMicroservices();
  console.log(`🚀 API Gateway running on http://localhost:3000`);
}
bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InternalServerErrorException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  function validationEnv() {
    const secret = process.env.GUEST_ORDER_SECRET;

    if (!secret) {
      throw new InternalServerErrorException(
        'Configure GUEST_ORDER_SECRET para permitir pedidos sem login',
      );
    }
    const cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const api_secret = process.env.CLOUDINARY_API_SECRET
    if (!cloudinaryName) {
      throw new NotFoundException('CLOUDINARY_CLOUD_NAME não encontrado!')
    }
    if (!apiKey) {
      throw new NotFoundException('CLOUDINARY_API_KEY não encontrado!')
    }
    if (!api_secret) {
      throw new NotFoundException('CLOUDINARY_API_SECRET não encontrado!')
    }
  }
  validationEnv();
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Order-Token',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`API rodando na porta ${port}`);
}

void bootstrap();

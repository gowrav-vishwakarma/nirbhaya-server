import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors();
  // app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(json({ limit: '1mb' }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nirbhaya Service')
    .setDescription('API documentation for Nirbhaya Nest Service')
    .setVersion('1.0')
    .addBearerAuth({ in: 'header', type: 'http' })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(configService.get<number>('PORT', 3000)).then(() => {
    console.log(
      'Nirbhaya server started at: ' + configService.get<number>('PORT', 3000),
    );
  });
}
bootstrap();

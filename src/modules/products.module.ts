import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ProductsController } from 'src/controller/products.controller';
import { ImageEntity } from 'src/entities/image.entity';
import { ProductEntity } from 'src/entities/product-entity';
import { ImageService } from 'src/services/image.service';
import { ProductsService } from 'src/services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ImageEntity]),
    CloudinaryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ImageService],
  exports: [ProductsService],
})
export class ProductsModule {}

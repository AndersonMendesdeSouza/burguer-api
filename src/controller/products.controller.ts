import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductStatusEnum } from 'src/dtos/enums/product-status.enum';
import { ProductRequestDto } from 'src/dtos/request/product-request.dto';
import { UpdateProductRequestDto } from 'src/dtos/request/update-product.dto';
import { ProductResponseDto } from 'src/dtos/response/product-response.dto';
import { ProductsService } from 'src/services/products.service';
import { toResponse } from 'src/utils/transform-response';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: ProductRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return toResponse(
      ProductResponseDto,
      await this.productsService.create(dto, files),
    );
  }

  @Get()
  async findAll() {
    return toResponse(ProductResponseDto, await this.productsService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return toResponse(
      ProductResponseDto,
      await this.productsService.findOne(id),
    );
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return toResponse(
      ProductResponseDto,
      await this.productsService.update(id, dto, files),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Patch(':id/status')
  actived(@Param('id') id: string, @Body('status') status: ProductStatusEnum) {
    return this.productsService.actived(id, status);
  }
}

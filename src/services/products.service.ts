import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/entities/product-entity';
import { ProductRequestDto } from 'src/dtos/request/product-request.dto';
import { UpdateProductRequestDto } from 'src/dtos/request/update-product.dto';
import { ImageService } from './image.service';
import { ProductStatusEnum } from 'src/dtos/enums/product-status.enum';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
    private readonly imageService: ImageService,
  ) { }

  async create(dto: ProductRequestDto, files?: Express.Multer.File[]) {
    this.logger.log('Criando produto');
    this.logger.debug(`Payload recebido: ${JSON.stringify(dto)}`);

    const product = this.repo.create({
      ...dto,
      stockEnabled: Boolean(dto.stockEnabled),
      price: dto.price.toString(),
      promoPrice: dto.promoPrice?.toString(),
      isActive:
        dto.isActive === ProductStatusEnum.ACTIVED
          ? ProductStatusEnum.ACTIVED
          : ProductStatusEnum.DISABLED,
    });

    await this.repo.save(product);
    this.logger.log(`Produto criado com ID: ${product.id}`);

    if (files?.length) {
      this.logger.log(
        `Salvando ${files.length} imagens para o produto ${product.id}`,
      );
      const images = await this.imageService.saveAll(files, product);
      product.images = images;
      await this.repo.save(product);
      this.logger.log(`Imagens salvas para o produto ${product.id}`);
    }

    return this.findOne(product.id);
  }

  findAll() {
    this.logger.log('Buscando lista de produtos');
    return this.repo.find({
      relations: ['images'],
    });
  }

  async findOne(id: string) {
    this.logger.log(`Buscando produto pelo ID: ${id}`);

    const product = await this.repo.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!product) {
      this.logger.warn(`Produto não encontrado: ${id}`);
      throw new NotFoundException('Produto não encontrado');
    }

    this.logger.log(`Produto encontrado: ${id}`);
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductRequestDto,
    files?: Express.Multer.File[],
  ) {
    this.logger.log(`Atualizando produto: ${id}`);
    this.logger.debug(`Payload de atualização: ${JSON.stringify(dto)}`);

    const product = await this.findOne(id);
    const { existingImageIds, primaryImageId, ...productDto } = dto;

    Object.assign(product, {
      ...productDto,
      ...(productDto.price !== undefined
        ? { price: productDto.price.toString() }
        : {}),
      ...(productDto.promoPrice !== undefined
        ? { promoPrice: productDto.promoPrice?.toString() }
        : {}),
      ...(productDto.stockEnabled !== undefined
        ? { stockEnabled: Boolean(productDto.stockEnabled) }
        : {}),
    });

    if (existingImageIds) {
      const keepIds = new Set(existingImageIds.map(String));
      const currentImages = product.images || [];
      const removeIds = currentImages
        .filter((image) => !keepIds.has(String(image.id)))
        .map((image) => Number(image.id))
        .filter((imageId) => Number.isFinite(imageId));

      await this.imageService.removeByIds(removeIds);
      product.images = currentImages.filter((image) =>
        keepIds.has(String(image.id)),
      );
    }

    let existingPrimarySelected = false;
    if (primaryImageId && product.images?.length) {
      product.images = product.images.map((image) => {
        const isPrimary = String(image.id) === String(primaryImageId);
        if (isPrimary) existingPrimarySelected = true;
        return { ...image, isPrimary };
      });
    } else if (files?.length && product.images?.length) {
      product.images = product.images.map((image) => ({
        ...image,
        isPrimary: false,
      }));
    }

    const updated = await this.repo.save(product);

    if (files?.length) {
      this.logger.log(
        `Salvando ${files.length} novas imagens para o produto ${id}`,
      );
      const images = await this.imageService.saveAll(files, updated, {
        firstIsPrimary: !existingPrimarySelected,
      });
      updated.images = [...(updated.images || []), ...images];
    }

    if (
      updated.images?.length &&
      !updated.images.some((image) => image.isPrimary)
    ) {
      updated.images[0].isPrimary = true;
    }

    await this.repo.save(updated);

    this.logger.log(`Produto atualizado com sucesso: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string) {
    this.logger.log(`Removendo produto: ${id}`);

    const product = await this.findOne(id);
    const ids = product.images.map((img) => img.id);

    await this.imageService.removeByIds(ids);
    await this.repo.remove(product);

    this.logger.log(`Produto removido com sucesso: ${id}`);
    return { message: 'Produto removido com sucesso' };
  }

  async actived(id: string, status: ProductStatusEnum) {
    this.logger.log(`Alterando status do produto ${id} para ${status}`);

    await this.findOne(id);
    await this.repo.update(id, { isActive: status });

    this.logger.log(`Status do produto ${id} atualizado para ${status}`);
    return { message: `Produto ${status}` };
  }
}

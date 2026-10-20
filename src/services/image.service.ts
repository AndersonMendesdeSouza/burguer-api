import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageEntity } from 'src/entities/image.entity';
import { Repository } from 'typeorm';
import { ProductEntity } from 'src/entities/product-entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(ImageEntity)
    private readonly repo: Repository<ImageEntity>,
    private readonly cloudnary: CloudinaryService,
  ) { }

  async saveAll(
    files: Express.Multer.File[],
    product: ProductEntity,
    options?: { firstIsPrimary?: boolean },
  ): Promise<ImageEntity[]> {
    const firstIsPrimary = options?.firstIsPrimary ?? true;

    const images = await Promise.all(
      files.map(async (file, index) => {
        const { imageUrl, imagePublicId } =
          await this.cloudnary.uploadImage(file);

        return this.repo.create({
          imageUrl,
          imagePublicId,
          isPrimary: firstIsPrimary && index === 0,
          product,
        });
      }),
    );

    return this.repo.save(images);
  }

  async removeByIds(ids: number[]): Promise<void> {
    if (!ids.length) return;

    for (const id of ids) {
      const img = await this.repo.findOne({
        where: { id },
      });

      if (img?.imagePublicId) {
        await this.cloudnary.deleteImage(img.imagePublicId);
      }
    }

    await this.repo.delete(ids);
  }
}

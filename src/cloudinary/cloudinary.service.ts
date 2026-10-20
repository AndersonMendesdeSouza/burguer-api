import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    private readonly configService: ConfigService,
  ) {

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
    cloudinary.config({
      cloud_name: cloudinaryName,
      api_key: apiKey,
      api_secret: api_secret,
      secure: true,
    });
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      const result = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: 'mais-burguer/products',
              resource_type: 'image',
            },
            (error, result) => {
              if (error || !result) {
                return reject(
                  error ?? new Error('Upload falhou'),
                );
              }

              resolve(result);
            },
          );

          Readable.from(file.buffer).pipe(upload);
        },
      );

      return {
        imageUrl: result.secure_url,
        imagePublicId: result.public_id,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erro ao enviar imagem ao Cloudinary',
      );
    }
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: 'image',
          invalidate: true,
        },
      );

      if (result.result !== 'ok' &&
        result.result !== 'not found') {
        throw new Error('Exclusão não confirmada');
      }

      return result;
    } catch {
      throw new InternalServerErrorException(
        'Erro ao excluir imagem do Cloudinary',
      );
    }
  }
}
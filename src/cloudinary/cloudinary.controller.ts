import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../dtos/enums/user-role.enum';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
// @UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.cloudinaryService.uploadImage(file);
  }

  @Delete()
  // @UseGuards(JwtAuthGuard)
  async deleteImage(
    @Query('publicId') publicId: string,
    // @Req() req: Request & { user: { role: UserRole } },
  ) {
    // if (req.user.role !== UserRole.ADMIN) {
    //   throw new ForbiddenException(
    //     'Somente administradores podem excluir imagens',
    //   );
    // }

    if (typeof publicId !== 'string' || !publicId.trim()) {
      throw new BadRequestException('Informe o publicId da imagem');
    }

    return this.cloudinaryService.deleteImage(publicId);
  }
}

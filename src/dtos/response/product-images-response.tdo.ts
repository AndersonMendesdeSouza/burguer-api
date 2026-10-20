import { Expose, Transform } from 'class-transformer';

export class ProductImageResponseDto {
  @Expose()
  id: number;

  @Expose()
  imageUrl: string | null;

  @Expose()
  imagePublicId: string | null;

  @Expose()
  @Transform(
    ({
      value,
      obj,
    }: {
      value: string | undefined;
      obj: { imageUrl?: string | null };
    }) => obj.imageUrl ?? value,
    { toClassOnly: true },
  )
  url: string;

  @Expose()
  isPrimary: boolean;
}

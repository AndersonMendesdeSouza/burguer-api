import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from 'src/dtos/enums/order-status.enum';
import { PaymentMethodEnum } from 'src/dtos/enums/payment-method.enum';
import { OrderItem } from 'src/types/order-Item-type';

type OrderHistory = {
  status: OrderStatusEnum;
  label: string;
  time?: string;
  createdAt: string;
};

export class AlterStatusDto {
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;
}

export class OrderRequestDto {
  @IsOptional()
  @IsString()
  mesaId?: string | null;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @IsNotEmpty()
  @IsUUID()
  addressId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @IsNotEmpty()
  items: OrderItem[];

  @IsOptional()
  history?: OrderHistory[];
}

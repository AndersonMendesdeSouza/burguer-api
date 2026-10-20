import { Expose, Type } from 'class-transformer';
import { OrderStatusEnum } from 'src/dtos/enums/order-status.enum';
import { PaymentMethodEnum } from 'src/dtos/enums/payment-method.enum';
import { OrderItem } from 'src/types/order-Item-type';
import { UserResponseDto } from './user-response.dto';
import { AddressResponseDto } from './address-response.dto';
import { ChatResponseDto } from './chat-response.dto';

type OrderHistory = {
  status: OrderStatusEnum;
  label: string;
  time?: string;
  createdAt: string;
};

export class OrderResponseDto {
  @Expose()
  id: string;

  @Expose()
  mesaId: string;

  @Expose()
  userId: string | null;

  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto | null;

  @Expose()
  chatId?: string;

  @Expose()
  @Type(() => ChatResponseDto)
  chat?: ChatResponseDto;

  @Expose()
  addressId?: string;

  @Expose()
  @Type(() => AddressResponseDto)
  address?: AddressResponseDto;

  @Expose()
  code: number;

  @Expose()
  status: OrderStatusEnum;

  @Expose()
  paymentMethod: PaymentMethodEnum;

  @Expose()
  customerName: string;

  @Expose()
  customerPhone: string;

  @Expose()
  subtotal: string;

  @Expose()
  deliveryFee: string;

  @Expose()
  discount: string;

  @Expose()
  total: string;

  @Expose()
  items: OrderItem[];

  @Expose()
  history: OrderHistory[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class OrderCreatedResponseDto extends OrderResponseDto {
  @Expose()
  guestToken?: string;
}

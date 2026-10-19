import { OrderStatusEnum } from 'src/dtos/enums/order-status.enum';
import { PaymentMethodEnum } from 'src/dtos/enums/payment-method.enum';
import { OrderItem } from 'src/types/order-Item-type';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Generated,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AddressEntity } from './address.entity';
import { ChatEntity } from './chat.entity';

type OrderHistory = {
  status: OrderStatusEnum;
  label: string;
  time?: string;
  createdAt: string;
};

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  mesaId: string | null;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  chatId?: string;

  @OneToOne(() => ChatEntity, (chat) => chat.order)
  @JoinColumn({ name: 'chatId' })
  chat?: ChatEntity;

  @Index()
  @Column({ type: 'int', unique: true })
  @Generated('increment')
  code: number;

  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.RECEIVED,
  })
  status: OrderStatusEnum;

  @Column({ type: 'enum', enum: PaymentMethodEnum })
  paymentMethod: PaymentMethodEnum;

  @Column({ type: 'uuid', nullable: true })
  addressId?: string;

  @ManyToOne(() => AddressEntity, (address) => address.orders, {
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  address?: AddressEntity;

  @Column({ type: 'varchar', length: 160 })
  customerName: string;

  @Column({ type: 'varchar', length: 30 })
  customerPhone: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  items: OrderItem[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  history: OrderHistory[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/entities/order.entity';
import { AddressEntity } from 'src/entities/address.entity';
import {
  AlterStatusDto,
  OrderRequestDto,
} from 'src/dtos/request/order-request.dto';
import { OrderResponseDto } from 'src/dtos/response/orders-response.dto';
import { OrderStatusEnum } from 'src/dtos/enums/order-status.enum';
import { UserRole } from 'src/dtos/enums/user-role.enum';
import { ChatService } from './chat.service';
import { toResponse } from 'src/utils/transform-response';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
    private readonly chatService: ChatService,
  ) {}

  async create(
    dto: OrderRequestDto,
    user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    const mesaId = dto.mesaId?.trim() || null;
    const addressId = dto.addressId;

    if (!mesaId && !addressId) {
      throw new BadRequestException('Informe a mesa ou o endereço de entrega');
    }

    if (mesaId && addressId) {
      throw new BadRequestException(
        'Informe apenas a mesa ou o endereço de entrega',
      );
    }

    if (mesaId && dto.deliveryFee !== 0) {
      throw new BadRequestException(
        'Pedido em mesa não deve ter taxa de entrega',
      );
    }

    let address: AddressEntity | undefined;

    if (addressId) {
      const savedAddress = await this.addressRepo.findOne({
        where: { id: addressId, userId: user.id },
      });

      if (!savedAddress) {
        throw new NotFoundException('Endereço não encontrado');
      }

      address = savedAddress;
    }

    const order = this.repo.create({
      ...dto,
      mesaId,
      addressId: address?.id,
      userId: user.id,
      address,
    });
    order.history = [
      {
        status: OrderStatusEnum.RECEIVED,
        label: 'Pedido recebido',
        createdAt: new Date().toISOString(),
      },
    ];

    const savedOrder = await this.repo.save(order);
    await this.chatService.create({ orderId: savedOrder.id }, user);

    return this.findById(savedOrder.id, user);
  }

  async findAll(user: AuthenticatedUser): Promise<OrderResponseDto[]> {
    const where = user.role === UserRole.ADMIN ? {} : { userId: user.id };
    const orders = await this.repo.find({
      where,
      relations: {
        user: true,
        address: true,
        chat: { messages: { sender: true } },
      },
    });
    return toResponse(OrderResponseDto, orders);
  }

  async findById(
    id: string,
    user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    const where =
      user.role === UserRole.ADMIN ? { id } : { id, userId: user.id };

    const order = await this.repo.findOne({
      where,
      relations: {
        user: true,
        address: true,
        chat: { messages: { sender: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return toResponse(OrderResponseDto, order);
  }

  async alterStatus(
    id: string,
    status: AlterStatusDto,
    user: AuthenticatedUser,
  ): Promise<OrderResponseDto> {
    const where =
      user.role === UserRole.ADMIN ? { id } : { id, userId: user.id };

    const order = await this.repo.findOne({
      where,
      relations: {
        user: true,
        address: true,
        chat: { messages: { sender: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (
      user.role !== UserRole.ADMIN &&
      status.status !== OrderStatusEnum.CANCELED
    ) {
      throw new BadRequestException('Cliente só pode cancelar o pedido');
    }

    if (status.status === OrderStatusEnum.CANCELED) {
      if (order.status === OrderStatusEnum.DELIVERED) {
        throw new BadRequestException('Pedido entregue não pode ser cancelado');
      }

      if (order.status !== OrderStatusEnum.CANCELED) {
        order.status = OrderStatusEnum.CANCELED;
        order.history = [
          ...(order.history ?? []),
          {
            status: OrderStatusEnum.CANCELED,
            label: 'Pedido cancelado',
            createdAt: new Date().toISOString(),
          },
        ];
      }

      const canceledOrder = await this.repo.save(order);

      return toResponse(OrderResponseDto, canceledOrder);
    }

    if (order.status === OrderStatusEnum.CANCELED) {
      throw new BadRequestException('Pedido cancelado não pode ser alterado');
    }

    if (
      status.status === OrderStatusEnum.RECEIVED &&
      order.status !== OrderStatusEnum.PREPARING
    ) {
      order.status = OrderStatusEnum.PREPARING;
      order.history = [
        ...(order.history ?? []),
        {
          status: OrderStatusEnum.PREPARING,
          label: 'Pedido em preparação',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    if (
      status.status === OrderStatusEnum.PREPARING &&
      order.status !== OrderStatusEnum.ON_ROUTE
    ) {
      order.status = OrderStatusEnum.ON_ROUTE;
      order.history = [
        ...(order.history ?? []),
        {
          status: OrderStatusEnum.ON_ROUTE,
          label: 'Pedido em rota',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    if (
      status.status === OrderStatusEnum.ON_ROUTE &&
      order.status !== OrderStatusEnum.DELIVERED
    ) {
      order.status = OrderStatusEnum.DELIVERED;
      order.history = [
        ...(order.history ?? []),
        {
          status: OrderStatusEnum.DELIVERED,
          label: 'Pedido entregue',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const data = await this.repo.save(order);

    return toResponse(OrderResponseDto, data);
  }

  // async update(id: string, dto: UpdateProductDto) {
  //   const product = await this.findOne(id);

  //   Object.assign(product, dto);
  //   return this.repo.save(product);
  // }

  async remove(id: string) {
    const product = await this.repo.find({ where: { id } });
    await this.repo.remove(product);

    return { message: 'Produto removido com sucesso' };
  }
}

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodEnum } from '../dtos/enums/payment-method.enum';
import { UserRole } from '../dtos/enums/user-role.enum';
import { OrderRequestDto } from '../dtos/request/order-request.dto';
import { AddressEntity } from '../entities/address.entity';
import { OrderEntity } from '../entities/order.entity';
import { ChatService } from './chat.service';
import { OrdersService } from './orders.service';

describe('OrdersService.create', () => {
  let service: OrdersService;

  const user = {
    id: 'customer-id',
    email: 'customer@example.com',
    role: UserRole.CUSTOMER,
  };
  const address = { id: 'address-id', userId: user.id };
  const orderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const addressRepo = { findOne: jest.fn() };
  const chatService = { create: jest.fn() };

  function createPayload(): OrderRequestDto {
    return {
      mesaId: ' 12 ',
      paymentMethod: PaymentMethodEnum.PIX,
      customerName: 'Cliente',
      customerPhone: '11999999999',
      subtotal: 25,
      deliveryFee: 0,
      discount: 0,
      total: 25,
      items: [
        {
          id: 'product-id',
          name: 'Hambúrguer',
          quantity: 1,
          unitPrice: 25,
          totalPrice: 25,
        },
      ],
    };
  }

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepo },
        { provide: getRepositoryToken(AddressEntity), useValue: addressRepo },
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    service = module.get(OrdersService);
    orderRepo.create.mockReturnValue({ id: 'order-id' });
    orderRepo.save.mockResolvedValue({ id: 'order-id' });
    orderRepo.findOne.mockResolvedValue({ id: 'order-id', userId: user.id });
    addressRepo.findOne.mockResolvedValue(address);
  });

  it('creates a table order without looking up an address', async () => {
    await service.create(createPayload(), user);

    expect(addressRepo.findOne).not.toHaveBeenCalled();
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mesaId: '12',
        addressId: undefined,
        address: undefined,
        userId: user.id,
        deliveryFee: 0,
        total: 25,
      }),
    );
    expect(orderRepo.save).toHaveBeenCalledTimes(1);
    expect(chatService.create).toHaveBeenCalledWith(
      { orderId: 'order-id' },
      user,
    );
  });

  it('creates a delivery order using only an address owned by the customer', async () => {
    const dto = createPayload();
    delete dto.mesaId;
    dto.addressId = address.id;
    dto.deliveryFee = 5;
    dto.total = 30;

    await service.create(dto, user);

    expect(addressRepo.findOne).toHaveBeenCalledWith({
      where: { id: address.id, userId: user.id },
    });
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mesaId: null,
        addressId: address.id,
        address,
        deliveryFee: 5,
        total: 30,
      }),
    );
  });

  it('rejects an order without a destination', async () => {
    const dto = createPayload();
    delete dto.mesaId;

    await expect(service.create(dto, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(addressRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects a table number containing only whitespace', async () => {
    const dto = createPayload();
    dto.mesaId = '   ';

    await expect(service.create(dto, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('rejects an order with both a table and an address', async () => {
    const dto = createPayload();
    dto.addressId = address.id;

    await expect(service.create(dto, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(addressRepo.findOne).not.toHaveBeenCalled();
  });

  it('rejects a table order with a delivery fee', async () => {
    const dto = createPayload();
    dto.deliveryFee = 5;

    await expect(service.create(dto, user)).rejects.toThrow(
      BadRequestException,
    );
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('rejects a delivery address not found for the customer', async () => {
    const dto = createPayload();
    delete dto.mesaId;
    dto.addressId = address.id;
    addressRepo.findOne.mockResolvedValue(null);

    await expect(service.create(dto, user)).rejects.toThrow(NotFoundException);
    expect(addressRepo.findOne).toHaveBeenCalledWith({
      where: { id: address.id, userId: user.id },
    });
    expect(orderRepo.save).not.toHaveBeenCalled();
  });
});

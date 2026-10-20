import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { JwtStrategy } from '../auth/ jwt.strategy';
import { OrdersController } from './orders.controller';
import { OrdersService } from '../services/orders.service';
import { UserRole } from '../dtos/enums/user-role.enum';

describe('OrdersController authentication', () => {
  let app: INestApplication<Server>;
  let server: Server;
  const ordersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    alterStatus: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        JwtStrategy,
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(() => jest.resetAllMocks());
  afterAll(async () => app.close());

  it('passes a request without login to the service as a guest', async () => {
    ordersService.create.mockResolvedValue({ id: 'order-id' });

    await request(server).post('/orders').send({ mesaId: '12' }).expect(201);

    expect(ordersService.create).toHaveBeenCalledWith(
      { mesaId: '12' },
      undefined,
    );
  });

  it('still authenticates valid account tokens on creation', async () => {
    const token = new JwtService().sign(
      {
        sub: 'customer-id',
        email: 'customer@example.com',
        role: UserRole.CUSTOMER,
      },
      { secret: process.env.JWT_SECRET || 'jwt_secret_dev' },
    );

    await request(server)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ mesaId: '12' })
      .expect(201);

    expect(ordersService.create).toHaveBeenCalledWith(
      { mesaId: '12' },
      {
        id: 'customer-id',
        email: 'customer@example.com',
        role: UserRole.CUSTOMER,
      },
    );
  });

  it('rejects invalid account tokens instead of treating them as guests', async () => {
    await request(server)
      .post('/orders')
      .set('Authorization', 'Bearer invalid-token')
      .send({ mesaId: '12' })
      .expect(401);

    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('keeps the global order list protected', async () => {
    await request(server).get('/orders/find-all').expect(401);

    expect(ordersService.findAll).not.toHaveBeenCalled();
  });

  it('forwards the guest token only to the requested order lookup', async () => {
    await request(server)
      .get('/orders/order-id')
      .set('X-Order-Token', 'guest-token')
      .expect(200);

    expect(ordersService.findById).toHaveBeenCalledWith(
      'order-id',
      undefined,
      'guest-token',
    );
  });

  it('forwards the guest token when canceling an order', async () => {
    await request(server)
      .patch('/orders/order-id')
      .set('X-Order-Token', 'guest-token')
      .send({ status: 'CANCELED' })
      .expect(200);

    expect(ordersService.alterStatus).toHaveBeenCalledWith(
      'order-id',
      { status: 'CANCELED' },
      undefined,
      'guest-token',
    );
  });
});

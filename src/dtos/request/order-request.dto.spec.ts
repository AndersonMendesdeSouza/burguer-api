import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderRequestDto } from './order-request.dto';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

describe('OrderRequestDto', () => {
  const payload = {
    paymentMethod: PaymentMethodEnum.PIX,
    customerName: 'Cliente',
    customerPhone: '11999999999',
    subtotal: 25,
    deliveryFee: 0,
    discount: 0,
    total: 25,
    items: [{ id: 'product-id', quantity: 1 }],
  };

  it('accepts a table order without addressId', async () => {
    const dto = plainToInstance(OrderRequestDto, { ...payload, mesaId: '12' });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a delivery order without mesaId', async () => {
    const dto = plainToInstance(OrderRequestDto, {
      ...payload,
      addressId: '7a36c111-06ca-4b73-b17d-d875dd150d93',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['', 'invalid-address-id'])(
    'rejects an invalid addressId: %s',
    async (addressId) => {
      const dto = plainToInstance(OrderRequestDto, { ...payload, addressId });
      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'addressId')).toBe(true);
    },
  );
});

import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  createGuestOrderToken,
  verifyGuestOrderToken,
} from './guest-order-token';

describe('Guest order tokens', () => {
  const secret = 'guest-order-test-secret';
  const originalGuestSecret = process.env.GUEST_ORDER_SECRET;
  const jwt = new JwtService();

  beforeEach(() => {
    process.env.GUEST_ORDER_SECRET = secret;
  });

  afterAll(() => {
    if (originalGuestSecret === undefined) {
      delete process.env.GUEST_ORDER_SECRET;
    } else {
      process.env.GUEST_ORDER_SECRET = originalGuestSecret;
    }
  });

  it('accepts a token for the order that issued it', () => {
    const token = createGuestOrderToken('order-id');

    expect(() => verifyGuestOrderToken(token, 'order-id')).not.toThrow();
  });

  it('rejects a token for another order', () => {
    const token = createGuestOrderToken('first-order');

    expect(() => verifyGuestOrderToken(token, 'second-order')).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a tampered token', () => {
    const token = createGuestOrderToken('order-id');
    const [header, , signature] = token.split('.');
    const payload = Buffer.from(
      JSON.stringify({ orderId: 'other-order' }),
    ).toString('base64url');

    expect(() =>
      verifyGuestOrderToken(`${header}.${payload}.${signature}`, 'other-order'),
    ).toThrow(UnauthorizedException);
  });

  it('rejects an expired token', () => {
    const token = jwt.sign(
      { orderId: 'order-id' },
      {
        secret: `${secret}:guest-table-order`,
        audience: 'guest-table-order',
        expiresIn: -1,
      },
    );

    expect(() => verifyGuestOrderToken(token, 'order-id')).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token issued for a different purpose', () => {
    const token = jwt.sign(
      { orderId: 'order-id' },
      {
        secret: `${secret}:guest-table-order`,
        audience: 'account-login',
        expiresIn: '1h',
      },
    );

    expect(() => verifyGuestOrderToken(token, 'order-id')).toThrow(
      UnauthorizedException,
    );
  });

  it('does not issue a token without a configured secret', () => {
    delete process.env.GUEST_ORDER_SECRET;

    expect(() => createGuestOrderToken('order-id')).toThrow(
      InternalServerErrorException,
    );
  });

  it('does not produce a token that can authenticate as an account', () => {
    const token = createGuestOrderToken('order-id');

    expect(() => {
      jwt.verify(token, { secret });
    }).toThrow();
  });
});

import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const jwt = new JwtService();
const audience = 'guest-table-order';

function getSecret() {
  const secret = process.env.GUEST_ORDER_SECRET;

  if (!secret) {
    throw new InternalServerErrorException(
      'Configure GUEST_ORDER_SECRET para permitir pedidos sem login',
    );
  }

  // A chave separada impede que o token do pedido seja aceito como login.
  return `${secret}:guest-table-order`;
}

export function createGuestOrderToken(orderId: string): string {
  return jwt.sign(
    { orderId },
    { secret: getSecret(), audience, expiresIn: '24h' },
  );
}

export function verifyGuestOrderToken(token: string, orderId: string): void {
  let payload: { orderId?: string };

  try {
    payload = jwt.verify<{ orderId?: string }>(token, {
      secret: getSecret(),
      audience,
      algorithms: ['HS256'],
    });
  } catch {
    throw new UnauthorizedException('Chave do pedido inválida ou expirada');
  }

  if (payload.orderId !== orderId) {
    throw new UnauthorizedException('Chave do pedido inválida ou expirada');
  }
}

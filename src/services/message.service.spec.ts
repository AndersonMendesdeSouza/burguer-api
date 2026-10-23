import { InternalServerErrorException, Logger } from '@nestjs/common';
import { MessageService } from './message.service';

describe('MessageService', () => {
  const originalUrl = process.env.EVOLUTION_API_URL;
  const originalKey = process.env.EVOLUTION_API_KEY;
  const originalInstance = process.env.EVOLUTION_INSTANCE;

  beforeEach(() => {
    process.env.EVOLUTION_API_URL = 'https://evolution.example.com';
    process.env.EVOLUTION_API_KEY = 'test-api-key';
    process.env.EVOLUTION_INSTANCE = 'test-instance';
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'PENDING' }), { status: 200 }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalUrl === undefined) {
      delete process.env.EVOLUTION_API_URL;
    } else {
      process.env.EVOLUTION_API_URL = originalUrl;
    }
    if (originalKey === undefined) {
      delete process.env.EVOLUTION_API_KEY;
    } else {
      process.env.EVOLUTION_API_KEY = originalKey;
    }
    if (originalInstance === undefined) {
      delete process.env.EVOLUTION_INSTANCE;
    } else {
      process.env.EVOLUTION_INSTANCE = originalInstance;
    }
  });

  it.each([
    ['64999999687', '5564999999687'],
    ['(64) 99999-9687', '5564999999687'],
    ['6433334444', '556433334444'],
    ['+55 (64) 99999-9687', '5564999999687'],
    ['5564999999687', '5564999999687'],
  ])('sends %s as %s', async (phone, expectedNumber) => {
    const result = await new MessageService().sendMessage(phone, 'Pedido recebido');

    expect(fetch).toHaveBeenCalledWith(
      'https://evolution.example.com/message/sendText/test-instance',
      expect.objectContaining({
        method: 'POST',
        headers: { apikey: 'test-api-key', 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: expectedNumber, text: 'Pedido recebido' }),
      }),
    );
    expect(result).toEqual({ status: 'PENDING' });
  });

  it('does not request Evolution when configuration is missing', async () => {
    delete process.env.EVOLUTION_API_KEY;

    await expect(
      new MessageService().sendMessage('64999999687', 'Pedido recebido'),
    ).rejects.toThrow(InternalServerErrorException);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports an error when Evolution rejects the message', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.mocked(fetch).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    await expect(
      new MessageService().sendMessage('64999999687', 'Pedido recebido'),
    ).rejects.toThrow('Falha ao enviar mensagem WhatsApp');
  });
});

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  async sendMessage(phone: string, message: string) {
    const baseUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;

    if (!baseUrl || !apiKey || !instance) {
      throw new InternalServerErrorException(
        'Evolution API não configurada',
      );
    }

    let number = phone.replace(/\D/g, '');

    if (number.length === 10 || number.length === 11) {
      number = `55${number}`;
    }

    const response = await fetch(
      `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`,
      {
        method: 'POST',
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number,
          text: message,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      this.logger.error(
        `Erro Evolution API (${response.status}): ${error}`,
      );

      throw new Error('Falha ao enviar mensagem WhatsApp');
    }

    return response.json();
  }
}

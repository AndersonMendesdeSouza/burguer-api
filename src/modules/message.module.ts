import { Module } from '@nestjs/common';
import { MessageService } from 'src/services/message.service';

@Module({
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
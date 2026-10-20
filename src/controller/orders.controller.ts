import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { UserRole } from 'src/dtos/enums/user-role.enum';
import {
  AlterStatusDto,
  OrderRequestDto,
} from 'src/dtos/request/order-request.dto';
import {
  OrderCreatedResponseDto,
  OrderResponseDto,
} from 'src/dtos/response/orders-response.dto';
import { OrdersService } from 'src/services/orders.service';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};
type AuthenticatedRequest = ExpressRequest & {
  user: AuthenticatedUser;
};
type OptionalAuthenticatedRequest = ExpressRequest & {
  user?: AuthenticatedUser;
};
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async create(
    @Body() dto: OrderRequestDto,
    @Req() req: OptionalAuthenticatedRequest,
  ): Promise<OrderCreatedResponseDto> {
    return await this.ordersService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('find-all')
  async findAll(@Req() req: AuthenticatedRequest): Promise<OrderResponseDto[]> {
    return await this.ordersService.findAll(req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() req: OptionalAuthenticatedRequest,
    @Headers('x-order-token') guestToken?: string,
  ): Promise<OrderResponseDto> {
    return await this.ordersService.findById(id, req.user, guestToken);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id')
  async alterStatus(
    @Param('id') id: string,
    @Body() status: AlterStatusDto,
    @Req() req: OptionalAuthenticatedRequest,
    @Headers('x-order-token') guestToken?: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.alterStatus(id, status, req.user, guestToken);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}

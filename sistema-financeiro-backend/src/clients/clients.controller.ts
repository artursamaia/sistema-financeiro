/**
 * ClientsController — Rotas para gerenciamento de clientes.
 *
 * Todas as rotas exigem autenticação JWT via JwtAuthGuard.
 *
 * Rotas disponíveis:
 *   GET    /api/clients           → Listar todos (com filtros opcionais)
 *   GET    /api/clients/:id       → Buscar por ID
 *   POST   /api/clients           → Criar novo cliente
 *   PATCH  /api/clients/:id       → Atualizar parcialmente
 *   DELETE /api/clients/:id       → Remover
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { clients_status } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todas as rotas deste controller exigem JWT
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Lista clientes com filtros opcionais por nome/CPF e status.
   * Query params: ?search=maria&status=active
   */
  @Get()
  @ApiOperation({ summary: 'Listar clientes do usuário autenticado' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou CPF' })
  @ApiQuery({ name: 'status', required: false, enum: clients_status })
  @ApiResponse({ status: 200, description: 'Lista de clientes.' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: clients_status,
  ) {
    return this.clientsService.findAll(user.sub, search, status);
  }

  /**
   * Retorna um cliente específico pelo ID.
   * ParseIntPipe converte o parâmetro string ":id" para number automaticamente.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Dados do cliente.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.findOne(id, user.sub);
  }

  /**
   * Cria um novo cliente para o usuário autenticado.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'CPF já cadastrado.' })
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.create(user.sub, dto);
  }

  /**
   * Atualiza parcialmente um cliente (PATCH — só os campos enviados são alterados).
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.update(id, user.sub, dto);
  }

  /**
   * Remove um cliente (somente se não tiver empréstimos ativos).
   * Retorna 204 No Content em caso de sucesso.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 204, description: 'Cliente removido.' })
  @ApiResponse({ status: 400, description: 'Cliente possui empréstimos ativos.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.remove(id, user.sub);
  }
}

/**
 * IncomesController — Rotas para gerenciamento de receitas financeiras.
 *
 * Rotas:
 *   GET    /api/incomes           → Listar (filtro por ?month=6&year=2024)
 *   GET    /api/incomes/:id       → Buscar por ID
 *   POST   /api/incomes           → Criar
 *   PATCH  /api/incomes/:id       → Atualizar
 *   DELETE /api/incomes/:id       → Remover
 */
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Receitas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar receitas (filtro por mês/ano)' })
  @ApiQuery({ name: 'month', required: false, description: 'Mês (1-12)' })
  @ApiQuery({ name: 'year',  required: false, description: 'Ano (ex: 2024)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('month') month?: number,
    @Query('year')  year?: number,
  ) {
    return this.incomesService.findAll(user.sub, month, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar receita por ID' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incomesService.findOne(id, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar nova receita' })
  create(
    @Body() dto: CreateIncomeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incomesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar receita' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incomesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover receita' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.incomesService.remove(id, user.sub);
  }
}

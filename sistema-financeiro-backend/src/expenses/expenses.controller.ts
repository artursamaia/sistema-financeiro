/**
 * ExpensesController — Rotas para gerenciamento de despesas financeiras.
 *
 * Rotas:
 *   GET    /api/expenses           → Listar (filtros: month, year, isPaid, isFixed, categoryId)
 *   GET    /api/expenses/:id       → Buscar por ID
 *   POST   /api/expenses           → Criar
 *   PATCH  /api/expenses/:id       → Atualizar
 *   DELETE /api/expenses/:id       → Remover
 */
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Despesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar despesas com filtros opcionais' })
  @ApiQuery({ name: 'month',      required: false })
  @ApiQuery({ name: 'year',       required: false })
  @ApiQuery({ name: 'isPaid',     required: false, type: Boolean })
  @ApiQuery({ name: 'isFixed',    required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('month')      month?: number,
    @Query('year')       year?: number,
    @Query('isPaid')     isPaid?: boolean,
    @Query('isFixed')    isFixed?: boolean,
    @Query('categoryId') categoryId?: number,
  ) {
    return this.expensesService.findAll(user.sub, month, year, isPaid, isFixed, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar despesa por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.findOne(id, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar nova despesa' })
  create(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar despesa (marcar como paga, alterar valor, etc.)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover despesa' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.remove(id, user.sub);
  }
}

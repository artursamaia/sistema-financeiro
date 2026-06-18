/**
 * ExpenseCategoriesController — Rotas para categorias de despesa.
 *
 * Rotas:
 *   GET    /api/expense-categories           → Listar (?onlyActive=true)
 *   GET    /api/expense-categories/:id       → Buscar por ID
 *   POST   /api/expense-categories           → Criar
 *   PATCH  /api/expense-categories/:id       → Atualizar
 *   DELETE /api/expense-categories/:id       → Remover
 */
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Categorias de Despesa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly service: ExpenseCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('onlyActive') onlyActive?: boolean,
  ) {
    return this.service.findAll(user.sub, onlyActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar categoria' })
  create(
    @Body() dto: CreateExpenseCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover categoria' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.remove(id, user.sub);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, CurrentUser } from '../auth/decorators/user.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@Body() createCaseDto: CreateCaseDto, @User() user: CurrentUser) {
    // Ensure tenantId comes from JWT token for security
    const caseData = { ...createCaseDto, tenantId: user.tenantId };
    return this.casesService.create(caseData);
  }

  @Get()
  findAll(@User() user: CurrentUser, @Query('search') search?: string) {
    return this.casesService.findAll(user.tenantId, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: CurrentUser) {
    return this.casesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @User() user: CurrentUser,
  ) {
    return this.casesService.update(id, user.tenantId, updateCaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: CurrentUser) {
    return this.casesService.remove(id, user.tenantId);
  }
}
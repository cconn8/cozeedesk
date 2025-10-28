import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, CurrentUser } from '../auth/decorators/user.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @Body() createTemplateDto: CreateTemplateDto,
    @User() user: CurrentUser,
  ) {
    // Ensure tenantId and createdBy comes from JWT token for security
    const templateData = { 
      ...createTemplateDto, 
      tenantId: user.tenantId,
      createdBy: user.userId
    };
    return this.templatesService.create(templateData);
  }

  @Get()
  findAll(@User() user: CurrentUser) {
    return this.templatesService.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: CurrentUser) {
    return this.templatesService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @User() user: CurrentUser,
  ) {
    return this.templatesService.update(id, user.tenantId, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: CurrentUser) {
    return this.templatesService.remove(id, user.tenantId);
  }
}

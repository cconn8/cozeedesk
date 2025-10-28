import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';
import {
  CaseTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './interfaces/template.interface';

@Injectable()
export class TemplatesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<CaseTemplate> {
    const db = await this.databaseService.getTenantDb(
      createTemplateDto.tenantId,
    );
    const templatesCollection = db.collection<CaseTemplate>('templates');

    const newTemplate: CaseTemplate = {
      ...createTemplateDto,
      createdBy: createTemplateDto.createdBy || 'system',
      createdAt: new Date(),
    };

    const result = await templatesCollection.insertOne(newTemplate);
    return { ...newTemplate, _id: result.insertedId };
  }

  async findAll(tenantId: string): Promise<CaseTemplate[]> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const templatesCollection = db.collection<CaseTemplate>('templates');

    return templatesCollection
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findOne(id: string, tenantId: string): Promise<CaseTemplate> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const templatesCollection = db.collection<CaseTemplate>('templates');

    const template = await templatesCollection.findOne({
      _id: new ObjectId(id),
      tenantId,
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async update(
    id: string,
    tenantId: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<CaseTemplate> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const templatesCollection = db.collection<CaseTemplate>('templates');

    const result = await templatesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId },
      { $set: updateTemplateDto },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return result;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const templatesCollection = db.collection<CaseTemplate>('templates');

    const result = await templatesCollection.deleteOne({
      _id: new ObjectId(id),
      tenantId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ObjectId } from 'mongodb';
import {
  Case,
  CreateCaseDto,
  UpdateCaseDto,
} from './interfaces/case.interface';

@Injectable()
export class CasesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createCaseDto: CreateCaseDto): Promise<Case> {
    const db = await this.databaseService.getTenantDb(createCaseDto.tenantId);
    const casesCollection = db.collection<Case>('cases');

    const newCase: Case = {
      ...createCaseDto,
      createdAt: new Date(),
      extractedFields: createCaseDto.extractedFields || {},
    };

    const result = await casesCollection.insertOne(newCase);
    return { ...newCase, _id: result.insertedId };
  }

  async findAll(tenantId: string, search?: string): Promise<Case[]> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const casesCollection = db.collection<Case>('cases');

    let query: any = { tenantId };

    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } },
          { paymentStatus: { $regex: search, $options: 'i' } },
        ],
      };
    }

    return casesCollection.find(query).sort({ createdAt: -1 }).toArray();
  }

  async findOne(id: string, tenantId: string): Promise<Case> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const casesCollection = db.collection<Case>('cases');

    const caseItem = await casesCollection.findOne({
      _id: new ObjectId(id),
      tenantId,
    });

    if (!caseItem) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return caseItem;
  }

  async update(
    id: string,
    tenantId: string,
    updateCaseDto: UpdateCaseDto,
  ): Promise<Case> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const casesCollection = db.collection<Case>('cases');

    const result = await casesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId },
      { $set: updateCaseDto },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }

    return result;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const db = await this.databaseService.getTenantDb(tenantId);
    const casesCollection = db.collection<Case>('cases');

    const result = await casesCollection.deleteOne({
      _id: new ObjectId(id),
      tenantId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Case with ID ${id} not found`);
    }
  }
}

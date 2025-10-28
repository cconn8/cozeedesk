import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { Tenant, CreateTenantDto } from './interfaces/tenant.interface';

@Injectable()
export class TenantsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const collection = this.databaseService.getTenantsCollection();

    const subdomain = this.generateSubdomain(createTenantDto.businessName);
    const plan = createTenantDto.plan || 'free';

    const existingTenant = await collection.findOne({ subdomain });
    if (existingTenant) {
      throw new Error(
        'Business name already taken. Please choose a different name.',
      );
    }

    const tenant: Omit<Tenant, '_id'> = {
      businessName: createTenantDto.businessName,
      subdomain,
      plan,
      dbMode: plan === 'paid' ? 'dedicated' : 'shared',
      dbName: plan === 'paid' ? `tenant_${subdomain}` : undefined,
      ownerId: createTenantDto.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(tenant);
    return { ...tenant, _id: result.insertedId };
  }

  async findById(tenantId: ObjectId): Promise<Tenant | null> {
    const collection = this.databaseService.getTenantsCollection();
    return collection.findOne({ _id: tenantId }) as Promise<Tenant>;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const collection = this.databaseService.getTenantsCollection();
    return collection.findOne({ subdomain }) as Promise<Tenant>;
  }

  async getUserTenants(userId: ObjectId): Promise<Tenant[]> {
    const collection = this.databaseService.getTenantsCollection();

    const usersCollection = this.databaseService.getUsersCollection();
    const user = await usersCollection.findOne({ _id: userId });

    if (!user || !user.tenantMemberships) {
      return [];
    }

    const tenantIds = user.tenantMemberships.map(
      (membership) => membership.tenantId,
    );
    return collection.find({ _id: { $in: tenantIds } }).toArray() as Promise<
      Tenant[]
    >;
  }

  private generateSubdomain(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  async getTenantMetadata(tenantId: ObjectId): Promise<{
    subdomain: string;
    plan: string;
    dbMode: string;
  } | null> {
    const tenant = await this.findById(tenantId);
    if (!tenant) return null;

    return {
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      dbMode: tenant.dbMode,
    };
  }
}

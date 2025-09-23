import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private masterClient: MongoClient;
  private tenantClients = new Map<string, MongoClient>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('MONGODB_URI');
    this.masterClient = new MongoClient(uri);
    await this.masterClient.connect();
  }

  async onModuleDestroy() {
    await this.masterClient?.close();
    
    for (const client of this.tenantClients.values()) {
      await client.close();
    }
  }

  getMasterDb(): Db {
    return this.masterClient.db('tenant_master');
  }

  async getTenantDb(tenantId: string): Promise<Db> {
    const tenantsCollection = this.getMasterDb().collection('tenants');
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(tenantId) });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    if (tenant.dbMode === 'dedicated') {
      return this.getDedicatedTenantDb(tenant.dbName);
    }

    return this.masterClient.db('shared_tenant_data');
  }

  private async getDedicatedTenantDb(dbName: string): Promise<Db> {
    if (!this.tenantClients.has(dbName)) {
      const uri = this.configService.get<string>('MONGODB_URI').replace(/\/[^\/]*\?/, `/${dbName}?`);
      const client = new MongoClient(uri);
      await client.connect();
      this.tenantClients.set(dbName, client);
    }

    return this.tenantClients.get(dbName).db(dbName);
  }

  getUsersCollection(): Collection {
    return this.getMasterDb().collection('users');
  }

  getTenantsCollection(): Collection {
    return this.getMasterDb().collection('tenants');
  }
}
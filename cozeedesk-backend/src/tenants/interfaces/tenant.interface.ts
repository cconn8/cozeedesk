import { ObjectId } from 'mongodb';

export interface Tenant {
  _id?: ObjectId;
  businessName: string;
  subdomain: string;
  plan: 'free' | 'paid';
  dbMode: 'shared' | 'dedicated';
  dbName?: string;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantDto {
  businessName: string;
  ownerId: ObjectId;
  plan?: 'free' | 'paid';
}

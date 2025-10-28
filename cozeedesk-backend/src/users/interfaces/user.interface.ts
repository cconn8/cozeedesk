import { ObjectId } from 'mongodb';

export interface TenantMembership {
  tenantId: ObjectId;
  businessName: string;
  roles: string[];
  joinedAt: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  tenantMemberships: TenantMembership[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  businessName: string;
}

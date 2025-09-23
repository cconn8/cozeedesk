import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { User, CreateUserDto, TenantMembership } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<User[]> {
    const collection = this.databaseService.getUsersCollection();
    return collection.find({ email }).toArray() as Promise<User[]>;
  }

  async findById(userId: ObjectId): Promise<User | null> {
    const collection = this.databaseService.getUsersCollection();
    return collection.findOne({ _id: userId }) as Promise<User>;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const collection = this.databaseService.getUsersCollection();
    
    const existingUsers = await this.findByEmail(createUserDto.email);
    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user: Omit<User, '_id'> = {
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      passwordHash,
      tenantMemberships: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async addTenantMembership(
    userId: ObjectId,
    tenantMembership: TenantMembership,
  ): Promise<void> {
    const collection = this.databaseService.getUsersCollection();
    
    await collection.updateOne(
      { _id: userId },
      {
        $push: { tenantMemberships: tenantMembership } as any,
        $set: { updatedAt: new Date() },
      },
    );
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async getUserTenants(userId: ObjectId): Promise<TenantMembership[]> {
    const user = await this.findById(userId);
    return user?.tenantMemberships || [];
  }
}
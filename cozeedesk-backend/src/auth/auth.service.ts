import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { User, CreateUserDto } from '../users/interfaces/user.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
}

export interface IntermediateToken {
  sub: string;
  email: string;
  verified: boolean;
  exp: number;
}

export interface LoginResult {
  user: User;
  tenants: Array<{
    tenantId: string;
    businessName: string;
    subdomain: string;
    roles: string[];
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    public usersService: UsersService,
    private tenantsService: TenantsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateLogin(email: string, password: string): Promise<LoginResult> {
    const users = await this.usersService.findByEmail(email);

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = users[0];
    const isPasswordValid = await this.usersService.verifyPassword(
      user,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenants = user.tenantMemberships.map((membership) => ({
      tenantId: membership.tenantId.toString(),
      businessName: membership.businessName,
      subdomain: '', // Will be populated below
      roles: membership.roles,
    }));

    for (const tenant of tenants) {
      const tenantData = await this.tenantsService.findById(
        new ObjectId(tenant.tenantId),
      );
      if (tenantData) {
        tenant.subdomain = tenantData.subdomain;
      }
    }

    return { user, tenants };
  }

  async generateJWT(
    userId: ObjectId,
    tenantId: ObjectId,
    roles: string[],
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId.toString(),
      email: '', // Will be set in controller
      tenantId: tenantId.toString(),
      roles,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
  }

  async generateIntermediateToken(
    userId: ObjectId,
    email: string,
  ): Promise<string> {
    const payload: IntermediateToken = {
      sub: userId.toString(),
      email,
      verified: true,
      exp: Math.floor(Date.now() / 1000) + 2 * 60, // 2 minutes
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('INTERMEDIATE_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>(
        'INTERMEDIATE_TOKEN_EXPIRES_IN',
      ),
    });
  }

  async verifyIntermediateToken(token: string): Promise<IntermediateToken> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('INTERMEDIATE_TOKEN_SECRET'),
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid intermediate token');
    }
  }

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; tenant: any; jwt: string }> {
    const user = await this.usersService.create(createUserDto);

    const tenant = await this.tenantsService.create({
      businessName: createUserDto.businessName,
      ownerId: user._id,
      plan: 'free',
    });

    await this.usersService.addTenantMembership(user._id, {
      tenantId: tenant._id,
      businessName: tenant.businessName,
      roles: ['admin'],
      joinedAt: new Date(),
    });

    const jwt = await this.generateJWT(user._id, tenant._id, ['admin']);

    return { user, tenant, jwt };
  }
}

import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import { AuthService } from './auth.service';
import { TenantsService } from '../tenants/tenants.service';
import { LoginDto, SignupDto, SelectTenantDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, tenants } = await this.authService.validateLogin(
      loginDto.email,
      loginDto.password,
    );

    if (tenants.length === 1) {
      const tenant = tenants[0];
      const jwt = await this.authService.generateJWT(
        user._id,
        new ObjectId(tenant.tenantId),
        tenant.roles,
      );

      const tenantMetadata = await this.tenantsService.getTenantMetadata(
        new ObjectId(tenant.tenantId),
      );

      return {
        jwt,
        subdomain: tenantMetadata?.plan === 'paid' 
          ? `${tenantMetadata.subdomain}.${this.configService.get('PAID_TENANT_DOMAIN')}`
          : this.configService.get('FREE_TENANT_DOMAIN'),
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: {
          id: tenant.tenantId,
          businessName: tenant.businessName,
          plan: tenantMetadata?.plan,
        },
      };
    }

    if (tenants.length > 1) {
      const intermediateToken = await this.authService.generateIntermediateToken(
        user._id,
        user.email,
      );

      return {
        requiresTenantSelection: true,
        intermediateToken,
        tenants: tenants.map(tenant => ({
          tenantId: tenant.tenantId,
          businessName: tenant.businessName,
          subdomain: tenant.subdomain,
          roles: tenant.roles,
        })),
      };
    }

    throw new UnauthorizedException('No tenant memberships found');
  }

  @Post('select-tenant')
  async selectTenant(@Body() selectTenantDto: SelectTenantDto) {
    const tokenPayload = await this.authService.verifyIntermediateToken(
      selectTenantDto.intermediateToken,
    );

    const user = await this.authService.usersService.findById(
      new ObjectId(tokenPayload.sub),
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const selectedTenantId = new ObjectId(selectTenantDto.tenantId);
    const membership = user.tenantMemberships.find(
      m => m.tenantId.toString() === selectTenantDto.tenantId,
    );

    if (!membership) {
      throw new UnauthorizedException('Access denied to selected tenant');
    }

    const jwt = await this.authService.generateJWT(
      user._id,
      selectedTenantId,
      membership.roles,
    );

    const tenantMetadata = await this.tenantsService.getTenantMetadata(selectedTenantId);

    return {
      jwt,
      subdomain: tenantMetadata?.plan === 'paid'
        ? `${tenantMetadata.subdomain}.${this.configService.get('PAID_TENANT_DOMAIN')}`
        : this.configService.get('FREE_TENANT_DOMAIN'),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: selectedTenantId,
        businessName: membership.businessName,
        plan: tenantMetadata?.plan,
      },
    };
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const { user, tenant, jwt } = await this.authService.signup(signupDto);

    const tenantMetadata = await this.tenantsService.getTenantMetadata(tenant._id);

    return {
      jwt,
      subdomain: tenantMetadata?.plan === 'paid'
        ? `${tenantMetadata.subdomain}.${this.configService.get('PAID_TENANT_DOMAIN')}`
        : this.configService.get('FREE_TENANT_DOMAIN'),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant._id,
        businessName: tenant.businessName,
        plan: tenant.plan,
      },
    };
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [ConfigModule, UsersModule, TenantsModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtService],
  exports: [AuthService, JwtAuthGuard, JwtService],
})
export class AuthModule {}

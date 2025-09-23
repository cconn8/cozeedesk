import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { User, CurrentUser } from './auth/decorators/user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@User() user: CurrentUser) {
    return {
      message: 'Protected route accessed successfully',
      user: {
        userId: user.userId,
        email: user.email,
        tenantId: user.tenantId,
        roles: user.roles,
      },
    };
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth') //auth is the default entry route
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup') // POST /auth/signup
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('signin') // POST /auth/signin
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }
}

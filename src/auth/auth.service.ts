import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return { access_token: token };
  }

  async signup(dto: AuthDto) {
    // Generate the password hash
    const hash = await argon.hash(dto.password);
    // Save the new user into DB
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email,
          hash: hash,
        },
      });
      /* Return user
      delete user.hash;
      // Return the saved user
      return user;
      */
      // Return JWT token for the session
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // Find the user in db by email
    const user = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // If user doesn't exist, throw error
    if (!user) throw new ForbiddenException('Credentials Incorrect');

    // Compare password
    const pwMathces = await argon.verify(user.hash, dto.password);
    // If password incorrect, throw error
    if (!pwMathces) throw new ForbiddenException('Credentials Incorrect');
    /* Return user
    delete user.hash;
    // Return the saved user
    return user;
    */
    // Return JWT token for the session
    return this.signToken(user.id, user.email);
  }
}

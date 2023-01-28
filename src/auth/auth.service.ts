import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AuthDto } from './dto';
// import { User, Bookmark } from '@prisma/client';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private db: DbService) {}

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
      delete user.hash;
      // Return the saved user
      return user;
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
    // Send back the user
    delete user.hash;
    return user;
  }
}

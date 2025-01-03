import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/models/User';
import { ValidationException } from 'src/qnatk/src/Exceptions/ValidationException';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      console.log('Could not find token');
      throw new UnauthorizedException();
    }
    // try {
    const decoded: UserJWT = await this.jwtService
      .verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })
      .catch(() => {
        throw new UnauthorizedException('Unauthorized access.');
      });

    // Check if the user exists in the database
    const user = await this.userModel.findByPk(decoded.id);
    if (!user) {
      throw new UnauthorizedException('User not found in the database.');
    }

    request['user'] = decoded;
    // } catch (error) {
    //   if (error instanceof JsonWebTokenError) {
    //     throw new UnauthorizedException('Unauthorized access.');
    //   }
    //   throw new ValidationException({
    //     Error: [error.message || 'Something went wrong.'],
    //   });
    // }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

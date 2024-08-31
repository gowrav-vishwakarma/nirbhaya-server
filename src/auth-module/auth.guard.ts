import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserJWT } from 'src/dto/user-jwt.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      console.log('Could not find token');
      throw new UnauthorizedException();
    }
    try {
      const decoded: UserJWT = await this.jwtService
        .verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        })
        .catch(() => {
          throw new UnauthorizedException('Unauthorized access.');
        });

      request['user'] = decoded;
    } catch (error) {
      console.log('error', error);

      throw new UnauthorizedException('No token provided.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface decodedTokenDTO {
  id: number;
  userType: string;
  service: string;
}
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
      const decoded: decodedTokenDTO = await this.jwtService
        .verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        })
        .catch(() => {
          throw new UnauthorizedException('Unauthorized access.');
        });

      if (decoded.userType !== 'employee' && decoded.userType !== 'poc') {
        throw new UnauthorizedException('Unauthorized access.');
      }
      let tokenExpire = false;
      if (decoded && decoded.id) {
        //todo logic here
        tokenExpire = true;
      }

      if (tokenExpire == true) {
        throw new UnauthorizedException('Unauthorized access.');
      }
      request['user'] = decoded;
      request['token'] = token;
    } catch (error) {
      // console.log('error', error);
      throw error;
      // throw new UnauthorizedException('No token provided.');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

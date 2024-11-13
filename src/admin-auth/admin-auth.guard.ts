import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserJWT } from 'src/dto/user-jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { Admin } from 'src/models/Admin';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Admin)
    private readonly adminModel: typeof Admin,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
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
      const admin = await this.adminModel.findByPk(decoded.id);
      if (!admin) {
        throw new UnauthorizedException('User not found in database.');
      }
      request['user'] = decoded;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Unauthorized access.');
    }
    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

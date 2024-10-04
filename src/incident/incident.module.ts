import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Incident } from '../models/Incident';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { AuthModule } from 'src/auth-module/auth.module';
import { User } from 'src/models/User';

@Module({
  imports: [
    SequelizeModule.forFeature([Incident, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [IncidentController],
  providers: [IncidentService],
})
export class IncidentModule {}

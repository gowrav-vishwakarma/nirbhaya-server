import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { QnatkListDTO } from 'src/qnatk/src/dto/QnatkListDTO';
import {
  AnyFilesInterceptor,
  NoFilesInterceptor,
} from '@nestjs/platform-express';
import { ActionListDTO } from './qnatk/src';
import { GetUser } from './auth-module/getuser.decorator';
import { ApiParam } from '@nestjs/swagger';
import { UserJWT } from './dto/user-jwt.dto';
// import { JwtService } from '@nestjs/jwt';
import { QnatkControllerService } from 'src/qnatk/src/qnatk-controller.service';
@Controller('qnatk')
// @UseGuards(AuthGuard)
export class QnatkController {
  constructor(private qnatkControllerService: QnatkControllerService) {}

  @Post(':baseModel/list')
  async findAll(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Body() body: QnatkListDTO,
    @GetUser() user: UserJWT,
  ) {
    return await this.qnatkControllerService.list(baseModel, body, user);
  }

  @Post(':baseModel/list-and-count')
  async findAndCountAll(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Body() body: QnatkListDTO,
    @GetUser() user: UserJWT,
  ) {
    return this.qnatkControllerService.listAndCount(baseModel, body, user);
  }

  @Post(':baseModel/create')
  @UseInterceptors(NoFilesInterceptor())
  async addNew(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Body() data: any,
    @GetUser() user: UserJWT,
  ) {
    // const token = authorization.replace("Bearer ", "");
    // const decodedToken = await this.jwtService.verifyAsync(token);
    // data.createdById = user.id;
    // data.updatedById = user.id;
    return await this.qnatkControllerService.addNew<UserJWT>(
      baseModel,
      data,
      user,
    );
  }

  @Post(':baseModel/create-with-files')
  @UseInterceptors(AnyFilesInterceptor())
  async addNewWithFile(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: UserJWT,
  ) {
    const data = { ...body };
    data.createdById = user.id;
    data.updatedById = user.id;
    return this.qnatkControllerService.addNewWithFile<UserJWT>(
      baseModel,
      data,
      files,
      user,
    );
  }

  @Post(':baseModel/actionExecute/:actionName/:skipModelLoad?')
  @ApiParam({ name: 'baseModel', type: String })
  @ApiParam({ name: 'actionName', type: String })
  async executeAction(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Param('actionName') action: any,
    @Body() body: { action: ActionListDTO; record: any },
    @GetUser() user: UserJWT,
    @Param('skipModelLoad') skipModelLoad?: boolean,
  ) {
    const data = { ...body };
    return this.qnatkControllerService.executeAction(
      baseModel,
      action,
      data,
      user,
      skipModelLoad,
    );
  }

  @Post(':baseModel/bulkActionExecute/:actionName')
  async bulkExecuteAction(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Param('actionName') action: any,
    @Body() body: { action: ActionListDTO; records: any },
    @GetUser() user: UserJWT,
  ) {
    const data = { ...body };
    return await this.qnatkControllerService.bulkExecuteAction<UserJWT>(
      baseModel,
      action,
      data,
      user,
    );
  }

  @Post(':baseModel/update/:primaryId/:primaryField?')
  @UseInterceptors(NoFilesInterceptor())
  async updateByPk(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Param('primaryId') primaryId: string | number,
    @Body() data: any,
    @GetUser() user: UserJWT,
    @Param('primaryField') primaryField?: string,
  ) {
    primaryField = primaryField || 'id';
    data.updatedById = user.id;
    return await this.qnatkControllerService.updateByPk(
      baseModel,
      primaryId,
      primaryField,
      data,
      user,
    );
  }

  @Get(':baseModel/delete/:primaryId/:primaryField?')
  @UseInterceptors(NoFilesInterceptor())
  async deleteByPk(
    // @Headers('authorization') authorization: string,
    @Param('baseModel') baseModel: string,
    @Param('primaryId') primaryId: string | number,
    @GetUser() user: UserJWT,
    @Param('primaryField') primaryField?: string,
  ) {
    primaryField = primaryField || 'id';

    return await this.qnatkControllerService.deleteByPk(
      baseModel,
      primaryId,
      primaryField,
      user,
    );
  }
}

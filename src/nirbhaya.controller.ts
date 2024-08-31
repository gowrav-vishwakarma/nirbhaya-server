import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NirbhayaQnatkControllerService } from './nirbhaya-qnatk-controller.service';
import {
  NoFilesInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { AuthGuard } from './auth-module/auth.guard';
import { GetUser } from './auth-module/getuser.decorator';
import { QnatkListDTO, ActionListDTO } from './qnatk/src';
import { UserJWT } from './dto/user-jwt.dto';

@Controller('qnatk')
@UseGuards(AuthGuard)
export class NirbhayaQnatkController {
  constructor(private qnatkControllerService: NirbhayaQnatkControllerService) {}

  @Post(':baseModel/list/:hookName?')
  async findAll(
    @Param('baseModel') baseModel: string,
    @Body() body: QnatkListDTO,
    @GetUser() user: UserJWT,
    @Param('hookName') hookName?: string,
  ) {
    return await this.qnatkControllerService.list(
      baseModel,
      body,
      user,
      hookName,
    );
  }

  @Post(':baseModel/list-and-count/:hookName?')
  async findAndCountAll(
    @Param('baseModel') baseModel: string,
    @Body() body: QnatkListDTO,
    @GetUser() user: UserJWT,
    @Param('hookName') hookName?: string,
  ) {
    // console.log('user', user);
    return this.qnatkControllerService.listAndCount(
      baseModel,
      body,
      user,
      hookName,
    );
  }

  @Post(':baseModel/create')
  @UseInterceptors(NoFilesInterceptor())
  async addNew(
    @Param('baseModel') baseModel: string,
    @Body() data: any,
    @GetUser() user: UserJWT,
  ) {
    return await this.qnatkControllerService.addNew<UserJWT>(
      baseModel,
      data,
      user,
    );
  }

  @Post(':baseModel/create-with-files')
  @UseInterceptors(AnyFilesInterceptor())
  async addNewWithFile(
    @Param('baseModel') baseModel: string,
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: UserJWT,
  ) {
    const data = { ...body };
    return await this.qnatkControllerService.addNewWithFile<UserJWT>(
      baseModel,
      data,
      files,
      user,
    );
  }

  @Post(':baseModel/actionExecute/:actionName/:skipModelLoad?')
  async executeAction(
    @Param('baseModel') baseModel: string,
    @Param('actionName') action: any,
    @Body() body: any,
    @GetUser() user: UserJWT,
    @Param('skipModelLoad') skipModelLoad?: boolean,
  ) {
    const data = { ...body };
    // console.log('data', data);
    // throw new Error('stop');

    return this.qnatkControllerService.executeAction(
      baseModel,
      action,
      data,
      user,
      skipModelLoad,
    );
  }

  @Post(':baseModel/actionExecuteWithFiles/:actionName/:skipModelLoad?')
  @UseInterceptors(AnyFilesInterceptor())
  async executeActionWithFiles(
    @Param('baseModel') baseModel: string,
    @Param('actionName') action: any,
    @Body() body: any,
    @GetUser() user: UserJWT,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('skipModelLoad') skipModelLoad?: boolean,
  ) {
    const data = { ...body };
    // console.log('data', data);
    // throw new Error('stop');

    return this.qnatkControllerService.executeActionWithFile(
      baseModel,
      action,
      data,
      user,
      files,
      skipModelLoad,
    );
  }

  @Post(':baseModel/bulkActionExecute/:actionName')
  async bulkExecuteAction(
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
    @Param('baseModel') baseModel: string,
    @Param('primaryId') primaryId: string | number,
    @Body() data: any,
    @GetUser() user: UserJWT,
    @Param('primaryField') primaryField?: string,
  ) {
    primaryField = primaryField || 'id';
    return await this.qnatkControllerService.updateByPk(
      baseModel,
      primaryId,
      primaryField,
      data,
      user,
    );
  }

  @Post(':baseModel/update-with-files/:primaryId/:primaryField?')
  @UseInterceptors(AnyFilesInterceptor())
  async updateByPkWithFiles(
    @Param('baseModel') baseModel: string,
    @Param('primaryId') primaryId: string | number,
    @Body() data: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @GetUser() user: UserJWT,
    @Param('primaryField') primaryField?: string,
  ) {
    primaryField = primaryField || 'id';
    return await this.qnatkControllerService.updateByPkWithFiles(
      baseModel,
      primaryId,
      primaryField,
      data,
      user,
      files,
    );
  }

  @Get(':baseModel/delete/:primaryId/:primaryField?')
  @UseInterceptors(NoFilesInterceptor())
  async deleteByPk(
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

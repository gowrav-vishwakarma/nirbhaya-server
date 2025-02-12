import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';
import { CatalogResponse, UpdateCatalogDto } from './dto/catalog.dto';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
} from './dto/catalog-item.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateOrderDto } from './dto/create-order.dto';
import { Response } from 'express';
import fetch from 'node-fetch';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(AuthGuard)
  @Post('apply')
  async applyToCommunity(@Body() data: any, @GetUser() user: UserJWT) {
    return this.communityService.applyToCommunity(data, user.id);
  }

  @UseGuards(AuthGuard)
  @Get('volunteers-nearby')
  async getVolunteersNearby(
    @Query('location') location: string,
    @Query('range') range: number,
  ) {
    const [latitude, longitude] = location.split(',').map(Number);
    return this.communityService.getVolunteersNearby(
      latitude,
      longitude,
      range,
    );
  }

  @UseGuards(AuthGuard)
  @Get('business-whatsapp/:postId')
  async getBusinessWhatsApp(@Param('postId') postId: string) {
    return this.communityService.getBusinessWhatsApp(postId);
  }

  @UseGuards(AuthGuard)
  @Get('business-catalog/:userId')
  async getBusinessCatalog(
    @Param('userId') userId: number,
  ): Promise<CatalogResponse> {
    return this.communityService.getBusinessCatalog(userId);
  }

  @UseGuards(AuthGuard)
  @Get('business-catalog')
  async getOwnBusinessCatalog(
    @GetUser() user: UserJWT,
  ): Promise<CatalogResponse> {
    return this.communityService.getBusinessCatalog(user.id);
  }

  @UseGuards(AuthGuard)
  @Post('business-catalog')
  async updateBusinessCatalog(
    @Body() catalogData: UpdateCatalogDto,
    @GetUser() user: UserJWT,
  ) {
    return this.communityService.updateBusinessCatalog(user.id, catalogData);
  }

  @UseGuards(AuthGuard)
  @Post('catalog-items')
  @UseInterceptors(FileInterceptor('image'))
  async createCatalogItem(
    @Body() itemData: CreateCatalogItemDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: UserJWT,
  ) {
    return this.communityService.createCatalogItem(user.id, itemData, file);
  }

  @UseGuards(AuthGuard)
  @Put('catalog-items/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateCatalogItem(
    @Param('id') id: number,
    @Body() itemData: UpdateCatalogItemDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: UserJWT,
  ) {
    return this.communityService.updateCatalogItem(id, user.id, itemData, file);
  }

  @UseGuards(AuthGuard)
  @Delete('catalog-items/:id')
  async deleteCatalogItem(@Param('id') id: number, @GetUser() user: UserJWT) {
    return this.communityService.deleteCatalogItem(id, user.id);
  }

  @UseGuards(AuthGuard)
  @Post('orders')
  async createOrder(
    @Body() orderData: CreateOrderDto,
    @GetUser() user: UserJWT,
  ) {
    return this.communityService.createOrder(user.id, orderData);
  }

  @Get('proxy-image/*')
  async proxyImage(@Param('0') imageUrl: string, @Res() res: Response) {
    const response = await fetch(
      'https://xavoc-technocrats-pvt-ltd.blr1.cdn.digitaloceanspaces.com/' +
        imageUrl,
    );
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  }

  @UseGuards(AuthGuard)
  @Put('catalog-items/:id/boxes')
  async updateCatalogItemBoxes(
    @Param('id') id: number,
    @Body() data: { boxes: string },
    @GetUser() user: UserJWT,
  ) {
    const boxes = JSON.parse(data.boxes);
    return [];
    // return this.communityService.updateCatalogItemBoxes(id, user.id, boxes);
  }
}

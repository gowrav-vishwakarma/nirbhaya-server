import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommunityPostService } from './community-post.service';

@Controller('posts')
export class CommunityPostController {
  constructor(private readonly communityPostService: CommunityPostService) {}

  @Post()
  create(@Body() createPostDto: any, @Request() req: any) {
    return this.communityPostService.create({
      ...createPostDto,
      userId: req.user.id,
    });
  }

  @Get('/community-posts')
  findAll(@Param() query: any) {
    console.log('Param.........', query);
    return this.communityPostService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityPostService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: any) {
    return this.communityPostService.update(+id, updatePostDto);
  }
}

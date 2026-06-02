import { Controller, UseGuards, Post, HttpCode, Body, Param, Patch, Delete, Get, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductRequest, ProductResponse, UpdateProductRequest, } from 'src/model/product.model';
import { Paging, WebResponse } from 'src/model/web.model';
import { Role } from 'src/common/roles.enum';
import { Roles } from 'src/common/Guards/roles.decorator';
import { RolesGuard } from 'src/common/Guards/roles.guard';
import { ProductSortBy } from 'src/model/product.model';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('/api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat produk baru (Admin)' })
  @Post()
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() request: CreateProductRequest): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.create(request);
    return { data: result }
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat produk baru (Admin)' })
  @Patch('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id:string, @Body() request: UpdateProductRequest): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.update(id, request);
    return { data: result }
  }

   @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus produk (Admin)' })
  @Delete('/:id')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id:string): Promise<WebResponse<boolean>> {
    const result = await this.productService.delete(id);
    return { data: result }
  }

  @ApiOperation({ summary: 'Get semua product' })
  @Get()
  @HttpCode(200)
  async getAll(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10
  ): Promise<WebResponse<{data: ProductResponse[]; paging: Paging}>> {
    const result = await this.productService.getAll(+page, +size);
    return { 
      data: result,
      paging: result.paging,}
  }

  @ApiOperation({ summary: 'Search & filter product' })
  @Get('/search')
  @HttpCode(200)
  async searc(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<WebResponse<ProductResponse[]>>{
    const result = await this.productService.searchAndFilter({
      search,
      categoryId,
      minPrice: minPrice ? Number(minPrice) : undefined, // konvert string → number
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: sortBy as ProductSortBy,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
    });
    return {
      data: result.data,
      paging: result.paging
    }
  } 

  @ApiOperation({ summary: 'Get Product by id' })
  @Get('/:id')
  @HttpCode(200)
  async getById(@Param('id') id:string): Promise<WebResponse<ProductResponse>> {
    const result = await this.productService.getById(id);
    return { data: result }
  }
}

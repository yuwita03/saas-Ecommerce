import { Injectable, HttpException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston'; // bukan dari @nestjs/common
import { UserValidation } from './user.validation';
import { PrismaService } from 'src/common/prisma.service';
import { UserResponse, RegisterUserRequest, LoginUserRequest, UpdateUserRequest } from 'src/model/user.model';
import { ValidationService } from 'src/common/validation.service';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { AuthService } from 'src/common/Auth/auth.service';
import { Paging } from '../model/web.model';
import { Role } from '../common/roles.enum'
@Injectable()
export class UserService {
  constructor (
    private validationService: ValidationService,
    private prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private authService: AuthService
  ) {}
    async register(request: RegisterUserRequest): Promise<UserResponse>{
      this.logger.debug(`Registering user: ${JSON.stringify(request)}`);
      const registerRequest: RegisterUserRequest = this.validationService.validate<RegisterUserRequest>(
        UserValidation.REGISTER, request);
        const totalUsersWithSameUsername = await this.prismaService.user.count({
          where: {
            username: registerRequest.username
          }
        });

        if(totalUsersWithSameUsername > 0) {
          throw new HttpException('Username already exists', 404);
        }

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
          data: registerRequest
        })


        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        };
    }
    async login(request: LoginUserRequest): Promise<UserResponse> {
      this.logger.debug(`Login attempt for username: ${JSON.stringify(request)}`);
      const loginRequest: LoginUserRequest = this.validationService.validate<LoginUserRequest>(
        UserValidation.LOGIN, request);

      let user = await this.prismaService.user.findUnique({
        where: {
          username: loginRequest.username
        }
      });

      if(!user){
        throw new HttpException('User not found', 404);
      };

      const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);
      if (!isPasswordValid){
        throw new HttpException('Invalid password', 401);
      }
      const token = this.authService.generateToken(user.id);

      user = await this.prismaService.user.update({
        where: {username: user.username},
        data: {token}
      });

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: user.token
      };
    }
    async logout(user: User): Promise<UserResponse> {
      this.logger.debug(`Logging out user: ${user.username}`);
      const result = await this.prismaService.user.update({
        where: {
          username: user.username
        },
        data: {
          token: null
        }
      });
      return {
        id: result.id,
        username: result.username,
        name: result.name,
        email: result.email,
        role: result.role,
        avatar: result.avatar,
        token: result.token
      };
    }
    async update(request: UpdateUserRequest, user: User): Promise<UserResponse> {
      this.logger.debug(`Updating user: ${JSON.stringify(request)} for user: ${user.username}`);
      const updateRequest: UpdateUserRequest = this.validationService.validate(
        UserValidation.UPDATE, request
      )
      // Partial berarti semua field bersifat opsional, jadi kita buat objek data yang hanya berisi field yang ingin diupdate
      const data: Partial<User> = {};

      // Cek setiap field, jika ada di updateRequest, tambahkan ke data
      if (updateRequest.username) data.username = updateRequest.username;
      if (updateRequest.name) data.name = updateRequest.name;
      if (updateRequest.email) data.email = updateRequest.email;
      if (updateRequest.avatar) data.avatar = updateRequest.avatar;
      if (updateRequest.password) data.password = await bcrypt.hash(updateRequest.password, 10);

      // hanya field yang ada di object data 
      const result = await this.prismaService.user.update({
        where:{username: user.username},
        data: data
      });
      return {
        id: result.id,
        username: result.username,
        name: result.name,
        email: result.email,
        role: result.role,
        avatar: result.avatar,
        // token: result.token ?? undefined
      };
    }
    async get(user: User): Promise<UserResponse> {
      this.logger.debug(`Getting user profile for: ${user.username}`);
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      }
    }
    async getUser(page: number = 1, size: number = 10) : Promise<{data: UserResponse[]; paging: Paging}> {
      this.logger.debug(`Getting users for page: ${page} with size: ${size}`);
      const skip = (page - 1) * size;
      const [users, total] = await Promise.all([
        this.prismaService.user.findMany({
          skip, // mulai data -n
          take: size,
          orderBy: {createdAt: 'desc'}, // urutkan berdasarkan createdAt terbaru
          // hanya filed yang di perlukan
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
          }
        }),
        this.prismaService.user.count()
      ]);
      return {
        data: users,
        paging:{
          page,
          size,
          totalPage: Math.ceil(total / size),// totalPage = total data / size per page, dibulatkan ke atas
        }
      }
    }
    async updateByAdmin(request: UpdateUserRequest, id: string): Promise<UserResponse> {
      this.logger.debug(`Admin updating user with id: ${id} and data: ${JSON.stringify(request)}`);
      const data: Partial<User> = {};
      if (request.name) data.name = request.name;
      if (request.username) data.username = request.username;
      if (request.email) data.email = request.email;
      if (request.password) data.password = await bcrypt.hash(request.password, 10);
      if (request.role) data.role = request.role;
      if (request.avatar) data.avatar = request.avatar;
      

      const result = await this.prismaService.user.update({
        where: {id},
        data
      });
      return {
        id: result.id,
        username: result.username,
        name: result.name,
        email: result.email,
        role: result.role,
        avatar: result.avatar,
        token: result.token ?? undefined
      };
    }
    async deleteByAdmin (id:string):Promise<boolean>{
      this.logger.debug(`Delete user ${id}`)
      const existing = await this.prismaService.user.findUnique({ where: { id } })
      if (!existing) throw new HttpException('User not found', 404)
      if(existing.role === Role.ADMIN)throw new HttpException('User not found', 404)

      // Hapus semua relasi dulu sebelum delete user
      await this.prismaService.cartItem.deleteMany({ where: { cart: { userId: id } } })
      await this.prismaService.cart.deleteMany({ where: { userId: id } })
      await this.prismaService.orderItem.deleteMany({ where: { order: { userId: id } } })
      await this.prismaService.order.deleteMany({ where: { userId: id } })
      await this.prismaService.address.deleteMany({ where: { userId: id } })

      await this.prismaService.user.delete({ where: { id } })
      return true;
    }
}

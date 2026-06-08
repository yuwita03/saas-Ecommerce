import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ValidationService {
  validate<T>(zodType: ZodType<T>, data: unknown): T {
    const result = zodType.safeParse(data);
    if (!result.success) {
      // Ambil pesan error pertama dari Zod
      const message = result.error.issues[0]?.message || 'Validation failed';
      throw new HttpException(message, 400);
    }
    return result.data;
  }
}
import { CreateUserInput } from './dto/create-user.input';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  create(createUserInput: CreateUserInput) {
    // this.prismaService.user.create({
    //   data: createUserInput,
    // });
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne({ id, email }: { id?: string; email?: string }) {
    return this.prismaService.user.findUnique({
      where: { id: id, email: email },
    });
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

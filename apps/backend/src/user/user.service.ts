import { Injectable } from '@nestjs/common';

import { PrismaService } from '~/prisma/prisma.service';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  create(_createUserInput: CreateUserInput) {
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
      where: id ? { id } : { email },
    });
  }

  update(_id: string, _updateUserInput: UpdateUserInput) {
    return `This action updates a #${_id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async totalPointsOfUser(userId: string): Promise<number> {
    const result = await this.prismaService.pointsHistory.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }
}

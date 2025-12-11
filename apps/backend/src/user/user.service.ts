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

  async remove(id: string) {
    // Delete or anonymize all user-related data for GDPR compliance
    // 1. Delete posts, comments, etc. (implement as needed)
    await this.prismaService.post.deleteMany({ where: { authorId: id } });
    await this.prismaService.comment.deleteMany({ where: { authorId: id } });
    await this.prismaService.pointsHistory.deleteMany({ where: { userId: id } });
    await this.prismaService.badgeAssignment.deleteMany({ where: { userId: id } });
    await this.prismaService.event.deleteMany({ where: { creatorId: id } });
    await this.prismaService.evenParticipant.deleteMany({ where: { userId: id } });
    await this.prismaService.like.deleteMany({ where: { userId: id } });
    await this.prismaService.userArticle.deleteMany({ where: { userId: id } });
    await this.prismaService.location.deleteMany({ where: { userId: id } });

    // 2. Delete the user
    return this.prismaService.user.delete({ where: { id } });
  }

  async exportUserData(id: string) {
    // Export all user data for GDPR compliance
    const user = await this.prismaService.user.findUnique({ where: { id } });
    const posts = await this.prismaService.post.findMany({ where: { authorId: id } });
    const comments = await this.prismaService.comment.findMany({ where: { authorId: id } });
    const pointsHistory = await this.prismaService.pointsHistory.findMany({
      where: { userId: id },
    });
    const badges = await this.prismaService.badgeAssignment.findMany({ where: { userId: id } });
    const events = await this.prismaService.event.findMany({ where: { creatorId: id } });
    const likes = await this.prismaService.like.findMany({ where: { userId: id } });
    const articles = await this.prismaService.userArticle.findMany({ where: { userId: id } });
    const locations = await this.prismaService.location.findMany({ where: { userId: id } });
    return {
      user,
      posts,
      comments,
      pointsHistory,
      badges,
      events,
      likes,
      articles,
      locations,
    };
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

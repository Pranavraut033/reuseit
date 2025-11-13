import { Injectable } from '@nestjs/common';
import { CreateBadgeInput } from './dto/create-badge.input';
import { UpdateBadgeInput } from './dto/update-badge.input';

@Injectable()
export class BadgeService {
  create(createBadgeInput: CreateBadgeInput) {
    return 'This action adds a new badge';
  }

  findAll() {
    return `This action returns all badge`;
  }

  findOne(id: number) {
    return `This action returns a #${id} badge`;
  }

  update(id: number, updateBadgeInput: UpdateBadgeInput) {
    return `This action updates a #${id} badge`;
  }

  remove(id: number) {
    return `This action removes a #${id} badge`;
  }
}

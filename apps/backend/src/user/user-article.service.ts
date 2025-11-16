import { Injectable } from '@nestjs/common';

import { CreateUserArticleInput } from './dto/create-user-article.input';
import { UpdateUserArticleInput } from './dto/update-user-article.input';

@Injectable()
export class UserArticleService {
  create(createUserArticleInput: CreateUserArticleInput) {
    return 'This action adds a new userArticle';
  }

  findAll() {
    return `This action returns all userArticle`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userArticle`;
  }

  update(id: number, updateUserArticleInput: UpdateUserArticleInput) {
    return `This action updates a #${id} userArticle`;
  }

  remove(id: number) {
    return `This action removes a #${id} userArticle`;
  }
}

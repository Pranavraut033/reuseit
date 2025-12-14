import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateChatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  postId: string;
}

@InputType()
export class CreateChatMessageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;
}

@InputType()
export class BlockUserInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

@InputType()
export class ReportChatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

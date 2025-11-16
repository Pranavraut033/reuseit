// src/points/points.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { POINTS_RULES } from './points.constants';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Increase user points for a given action.
   * @param userId User's ID
   * @param action Action key from POINTS_RULES (e.g., 'CREATE_POST')
   * @param customAmount Optional custom amount (overrides default for action)
   * @returns Updated user
   *
   * Example usages:
   *   addPoints(userId, 'CREATE_POST') // +10 points for post
   *   addPoints(userId, 'COMMENT_POST') // +3 points for comment
   *   addPoints(userId, 'JOIN_EVENT') // +5 points for joining event
   *   addPoints(userId, 'SCAN_ITEM') // +2 points for scanning item
   */
  async addPoints(userId: string, action: keyof typeof POINTS_RULES, customAmount?: number) {
    const amount = customAmount ?? POINTS_RULES[action] ?? 0;
    await this.prisma.pointsHistory.create({
      data: {
        userId,
        amount,
        reason: action,
      },
    });
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: amount },
      },
    });
  }

  /**
   * Helper to get points for a given action (for use in other modules/controllers)
   */
  getPointsForAction(action: keyof typeof POINTS_RULES) {
    return POINTS_RULES[action] ?? 0;
  }
}

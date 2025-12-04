import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { ModelType, PrismaModel, PrismaModelName, SafeUpsertOptions } from './types/safeUpsert';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private supportsTransactions: boolean | null = null;

  async onModuleInit() {
    await this.$connect();
    await this.checkTransactionSupport();
  }

  /**
   * Check if the database supports transactions
   */
  private async checkTransactionSupport(): Promise<void> {
    try {
      // Try a simple transaction to test support
      await this.$transaction([]);
      this.supportsTransactions = true;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (
        err.code === 'P2010' ||
        err.code === 'P2031' ||
        err.message?.includes('Transactions are not supported')
      ) {
        this.supportsTransactions = false;
        this.logger.warn('⚠ Database does not support transactions. Using fallback upsert logic.');
      } else {
        // Unknown error, assume transactions work but log the error
        this.supportsTransactions = true;
        this.logger.warn(`Transaction support check failed: ${err.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Safe upsert that works with and without transaction support
   * @param modelName - The name of the Prisma model (e.g., 'User')
   * @param model - The Prisma model delegate (e.g., prisma.user)
   * @param options - Upsert options with where, create, and update
   * @returns The upserted record
   */
  async safeUpsert<T extends PrismaModelName>(
    _modelName: T,
    model: PrismaModel,
    options: SafeUpsertOptions<T>,
  ): Promise<ModelType<T>> {
    const { where, create, update } = options;

    // If transactions are supported, use native upsert
    if (this.supportsTransactions) {
      try {
        return (await model.upsert({
          where,
          create,
          update,
        })) as ModelType<T>;
      } catch (error: unknown) {
        // If transaction error occurs, mark as unsupported and fall back
        const err = error as { code?: string; message?: string };
        if (
          err.code === 'P2010' ||
          err.code === 'P2031' ||
          err.message?.includes('Transactions are not supported')
        ) {
          this.supportsTransactions = false;
          this.logger.warn('⚠ Transaction error detected. Switching to manual upsert.');
          // Fall through to manual upsert
        } else {
          throw error;
        }
      }
    }

    // Manual upsert for databases without transaction support
    const existing = await model.findUnique({ where });

    if (existing) {
      return (await model.update({
        where,
        data: update,
      })) as ModelType<T>;
    } else {
      return (await model.create({
        data: create,
      })) as ModelType<T>;
    }
  }
}

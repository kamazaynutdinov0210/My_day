import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/decorators/current-user.decorator';
import { CryptoService } from './crypto.service';
import { CryptoHistoryService } from './crypto-history.service';
import { EncryptDto } from './dto/encrypt.dto';
import { DecryptDto } from './dto/decrypt.dto';
import { HashDto } from './dto/hash.dto';
import { KeyPairDto } from './dto/keypair.dto';
import { ListHistoryQuery } from './dto/list-history.query';
import { CreateHistoryDto } from './dto/create-history.dto';

@Controller('crypto')
export class CryptoController {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly historyService: CryptoHistoryService,
  ) {}

  @Get('algorithms')
  getAlgorithms() {
    return { success: true, data: this.cryptoService.getAlgorithms() };
  }

  @Post('encrypt')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async encrypt(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: EncryptDto,
  ) {
    try {
      const result = await this.cryptoService.encrypt(dto);
      // Auto-log to history for authenticated user
      await this.historyService.create(user.id, {
        operationType: 'ENCRYPT',
        algorithm: result.algorithm,
        category: result.algorithm === 'RSA-OAEP' || result.algorithm === 'ECC' ? 'ASYMMETRIC' : 'SYMMETRIC',
        dataType: 'TEXT',
        status: 'SUCCESS',
        metadata: {
          durationMs: result.durationMs,
          inputLength: dto.plaintext.length,
          outputLength: result.ciphertext.length,
          hasAuthTag: Boolean(result.tag),
        },
      });

      return { success: true, data: result };
    } catch (err) {
      // Record failure in history
      await this.historyService.create(user.id, {
        operationType: 'ENCRYPT',
        algorithm: dto.algorithm,
        category: 'SYMMETRIC',
        dataType: 'TEXT',
        status: 'FAILED',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
          inputLength: dto.plaintext.length,
        },
      });
      throw err;
    }
  }

  @Post('decrypt')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async decrypt(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: DecryptDto,
  ) {
    try {
      const result = await this.cryptoService.decrypt(dto);
      await this.historyService.create(user.id, {
        operationType: 'DECRYPT',
        algorithm: dto.algorithm,
        category: dto.algorithm.toUpperCase().includes('RSA') ? 'ASYMMETRIC' : 'SYMMETRIC',
        dataType: 'TEXT',
        status: 'SUCCESS',
        metadata: {
          durationMs: result.durationMs,
          ciphertextLength: dto.ciphertext.length,
          verified: result.verified,
        },
      });

      return { success: true, data: result };
    } catch (err) {
      await this.historyService.create(user.id, {
        operationType: 'DECRYPT',
        algorithm: dto.algorithm,
        category: 'SYMMETRIC',
        dataType: 'TEXT',
        status: 'FAILED',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
          ciphertextLength: dto.ciphertext.length,
        },
      });
      throw err;
    }
  }

  @Post('hash')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async hash(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: HashDto,
  ) {
    const result = await this.cryptoService.hash(dto);
    await this.historyService.create(user.id, {
      operationType: 'HASH',
      algorithm: result.algorithm,
      category: result.algorithm === 'Argon2id' || result.algorithm === 'PBKDF2' ? 'KEY_DERIVATION' : 'HASHING',
      dataType: 'TEXT',
      status: 'SUCCESS',
      metadata: {
        durationMs: result.durationMs,
        inputLength: dto.data.length,
        digestLength: result.digest.length,
      },
    });

    return { success: true, data: result };
  }

  @Post('generate-keypair')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async generateKeyPair(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: KeyPairDto,
  ) {
    const result = this.cryptoService.generateKeyPair(dto);
    await this.historyService.create(user.id, {
      operationType: 'KEYGEN',
      algorithm: result.algorithm,
      category: 'ASYMMETRIC',
      dataType: 'KEY',
      status: 'SUCCESS',
      metadata: {
        keyType: dto.algorithm,
        keySize: dto.keySize || dto.curve,
      },
    });

    return { success: true, data: result };
  }

  // --- Encryption History Management ---

  @Get('history')
  @UseGuards(SessionAuthGuard)
  async listHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() query: ListHistoryQuery,
  ) {
    return this.historyService.list(user.id, query);
  }

  @Get('history/:id')
  @UseGuards(SessionAuthGuard)
  async getHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id') id: string,
  ) {
    const item = await this.historyService.get(user.id, id);
    return { success: true, data: item };
  }

  @Post('history')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async createHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() dto: CreateHistoryDto,
  ) {
    const item = await this.historyService.create(user.id, dto);
    return { success: true, data: item };
  }

  @Delete('history/:id')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async removeHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id') id: string,
  ) {
    await this.historyService.remove(user.id, id);
    return { success: true, data: null };
  }

  @Delete('history')
  @UseGuards(SessionAuthGuard, CsrfGuard)
  async clearHistory(
    @CurrentUser() user: AuthenticatedRequest['user'],
  ) {
    const result = await this.historyService.clear(user.id);
    return { success: true, data: result };
  }
}

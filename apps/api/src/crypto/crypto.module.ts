import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CryptoService } from './crypto.service';
import { CryptoHistoryService } from './crypto-history.service';
import { CryptoController } from './crypto.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CryptoController],
  providers: [CryptoService, CryptoHistoryService],
  exports: [CryptoService, CryptoHistoryService],
})
export class CryptoModule {}


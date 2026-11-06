-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'ENCRYPTION_OPERATION';

-- CreateEnum
CREATE TYPE "EncryptionOperationType" AS ENUM ('ENCRYPT', 'DECRYPT', 'HASH', 'KEYGEN');

-- CreateEnum
CREATE TYPE "EncryptionCategory" AS ENUM ('SYMMETRIC', 'ASYMMETRIC', 'HASHING', 'KEY_DERIVATION');

-- CreateEnum
CREATE TYPE "EncryptionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" "EncryptionOperationType" NOT NULL,
    "algorithm" TEXT NOT NULL,
    "category" "EncryptionCategory" NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'TEXT',
    "status" "EncryptionStatus" NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encryption_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_providerUserId_key" ON "oauth_accounts"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "encryption_histories_userId_createdAt_idx" ON "encryption_histories"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "encryption_histories_userId_algorithm_idx" ON "encryption_histories"("userId", "algorithm");

-- CreateIndex
CREATE INDEX "encryption_histories_userId_operationType_idx" ON "encryption_histories"("userId", "operationType");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encryption_histories" ADD CONSTRAINT "encryption_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


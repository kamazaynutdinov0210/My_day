import type { EntityId, IsoDateTime } from "./common.js";

export type EncryptionCategory = "SYMMETRIC" | "ASYMMETRIC" | "HASHING" | "KEY_DERIVATION";
export type EncryptionOperationType = "ENCRYPT" | "DECRYPT" | "HASH" | "KEYGEN";
export type EncryptionStatus = "SUCCESS" | "FAILED";

export interface EncryptionAlgorithmInfo {
  id: string;
  name: string;
  category: EncryptionCategory;
  purpose: string;
  securityCharacteristics: {
    keySize?: string;
    blockSize?: string;
    authTag?: boolean;
    collisionResistant?: boolean;
    quantumResistanceNotes?: string;
    rating: "RECOMMENDED" | "ACCEPTABLE" | "DEPRECATED" | "INSECURE";
  };
  typicalApplications: string[];
  supportedInputTypes: ("TEXT" | "FILE" | "JSON" | "BINARY")[];
  limitations: string[];
  recommendedUseCases: string[];
  deprecated?: boolean;
  deprecationReason?: string;
}

export interface EncryptInput {
  algorithm: string;
  plaintext: string;
  key?: string;
  recipientPublicKey?: string;
  additionalData?: string;
}

export interface EncryptResult {
  algorithm: string;
  ciphertext: string;
  iv?: string;
  tag?: string;
  key?: string;
  durationMs: number;
}

export interface DecryptInput {
  algorithm: string;
  ciphertext: string;
  key?: string;
  privateKey?: string;
  iv?: string;
  tag?: string;
  additionalData?: string;
}

export interface DecryptResult {
  plaintext: string;
  verified: boolean;
  durationMs: number;
}

export interface HashInput {
  algorithm: string;
  data: string;
  salt?: string;
  iterations?: number;
}

export interface HashResult {
  algorithm: string;
  digest: string;
  salt?: string;
  durationMs: number;
}

export interface KeyPairInput {
  algorithm: "RSA-OAEP" | "ECC";
  keySize?: 2048 | 4096;
  curve?: "prime256v1" | "secp256k1";
}

export interface KeyPairResult {
  publicKey: string;
  privateKey: string;
  algorithm: string;
}

export interface EncryptionHistoryItem {
  id: EntityId;
  userId: EntityId;
  operationType: EncryptionOperationType;
  algorithm: string;
  category: EncryptionCategory;
  dataType: string;
  status: EncryptionStatus;
  metadata: Record<string, unknown> | null;
  createdAt: IsoDateTime;
}

export interface EncryptionHistoryFilterParams {
  algorithm?: string;
  operationType?: EncryptionOperationType;
  category?: EncryptionCategory;
  status?: EncryptionStatus;
  search?: string;
  from?: string;
  to?: string;
}

export type PasswordType =
  | "RANDOM_STRONG"
  | "PASSPHRASE"
  | "ALPHANUMERIC"
  | "SPECIAL_CHARS"
  | "NUMERIC_PIN"
  | "CUSTOM_FORMAT"
  | "HIGH_ENTROPY";

export interface PasswordGenerateOptions {
  type: PasswordType;
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean;
  customCharset?: string;
  wordCount?: number;
  wordSeparator?: string;
  capitalizeWords?: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 (very weak) to 4 (very strong)
  label: "VERY_WEAK" | "WEAK" | "FAIR" | "STRONG" | "VERY_STRONG";
  entropyBits: number;
  crackTimeDisplay: string;
  feedback: string[];
  recommendations: string[];
  checks: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSymbols: boolean;
    noRepeatedChars: boolean;
  };
}


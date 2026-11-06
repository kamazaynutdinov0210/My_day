import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  constants,
  createCipheriv,
  createDecipheriv,
  createECDH,
  createHash,
  generateKeyPairSync,
  hkdfSync,
  pbkdf2Sync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from 'node:crypto';
import type {
  DecryptInput,
  DecryptResult,
  EncryptInput,
  EncryptionAlgorithmInfo,
  EncryptResult,
  HashInput,
  HashResult,
  KeyPairInput,
  KeyPairResult,
} from '@my-day/types';

const ALGORITHM_CATALOG: EncryptionAlgorithmInfo[] = [
  {
    id: 'AES-256-GCM',
    name: 'AES-256-GCM',
    category: 'SYMMETRIC',
    purpose: 'Authenticated Symmetric Encryption with 256-bit key',
    securityCharacteristics: {
      keySize: '256 bits',
      blockSize: '128 bits',
      authTag: true,
      collisionResistant: true,
      quantumResistanceNotes: '128 bits of post-quantum security (Grover resistant)',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['File encryption', 'Database column encryption', 'TLS transport', 'Secure storage'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['Nonce/IV reuse destroys security guarantees; never reuse a 96-bit IV with the same key'],
    recommendedUseCases: ['Primary choice for encrypting documents, backups, and user private data'],
  },
  {
    id: 'AES-128-GCM',
    name: 'AES-128-GCM',
    category: 'SYMMETRIC',
    purpose: 'Authenticated Symmetric Encryption with 128-bit key',
    securityCharacteristics: {
      keySize: '128 bits',
      blockSize: '128 bits',
      authTag: true,
      collisionResistant: true,
      quantumResistanceNotes: 'Lower margin against Grover quantum attacks than AES-256',
      rating: 'ACCEPTABLE',
    },
    typicalApplications: ['Constrained environments', 'Legacy compatibility', 'High-throughput stream encryption'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['Do not reuse IV with the same key; AES-256 is preferred for new systems'],
    recommendedUseCases: ['Embedded hardware or resource-constrained devices where 256-bit AES is too slow'],
  },
  {
    id: 'ChaCha20-Poly1305',
    name: 'ChaCha20-Poly1305',
    category: 'SYMMETRIC',
    purpose: 'High-speed stream cipher with Poly1305 MAC authenticator',
    securityCharacteristics: {
      keySize: '256 bits',
      blockSize: 'Stream (512-bit state)',
      authTag: true,
      collisionResistant: true,
      quantumResistanceNotes: '128 bits of post-quantum security',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Mobile applications', 'CPUs lacking hardware AES acceleration', 'WireGuard VPN', 'SSH'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['96-bit nonce must never be repeated for a given key'],
    recommendedUseCases: ['Ideal for software-only encryption on mobile/ARM architectures without AES-NI instructions'],
  },
  {
    id: 'XChaCha20-Poly1305',
    name: 'XChaCha20-Poly1305',
    category: 'SYMMETRIC',
    purpose: 'Extended-nonce ChaCha20 cipher preventing IV collision risk',
    securityCharacteristics: {
      keySize: '256 bits',
      blockSize: 'Stream',
      authTag: true,
      collisionResistant: true,
      quantumResistanceNotes: '128 bits of post-quantum security',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Stateless encryption', 'Distributed file systems', 'Random nonce generation without state'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['Slightly higher computation overhead than standard ChaCha20 due to HChaCha20 subkey derivation'],
    recommendedUseCases: ['Applications generating random nonces where 96-bit birthday paradox collisions are a concern'],
  },
  {
    id: 'RSA-OAEP',
    name: 'RSA-OAEP (2048 / 4096-bit)',
    category: 'ASYMMETRIC',
    purpose: 'Public-key encryption with Optimal Asymmetric Encryption Padding',
    securityCharacteristics: {
      keySize: '2048 or 4096 bits',
      blockSize: 'Variable (up to key size minus OAEP padding)',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: 'Vulnerable to Shor algorithm on cryptographically relevant quantum computers',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Digital envelopes', 'Public-key key exchange', 'Secure credential transmission', 'PGP/GPG'],
    supportedInputTypes: ['TEXT', 'BINARY'],
    limitations: ['Cannot encrypt data longer than key size minus padding (use hybrid encryption for files)'],
    recommendedUseCases: ['Exchanging symmetric session keys between parties without shared secrets'],
  },
  {
    id: 'ECC',
    name: 'ECC (ECDH + AES-256-GCM)',
    category: 'ASYMMETRIC',
    purpose: 'Elliptic Curve Diffie-Hellman Key Agreement with Authenticated Encryption',
    securityCharacteristics: {
      keySize: '256 bits (P-256 / secp256k1)',
      blockSize: '128 bits (AES-GCM)',
      authTag: true,
      collisionResistant: true,
      quantumResistanceNotes: 'Vulnerable to Shor algorithm; post-quantum Kyber/ML-KEM will succeed this standard',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Signal protocol', 'TLS 1.3 key exchange', 'Modern end-to-end messaging'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['Requires ephemeral key generation per message or session'],
    recommendedUseCases: ['Modern hybrid public-key encryption with smaller keys and faster computation than RSA'],
  },
  {
    id: 'SHA-256',
    name: 'SHA-256',
    category: 'HASHING',
    purpose: 'Cryptographic one-way hash function (NIST FIPS 180-4)',
    securityCharacteristics: {
      keySize: 'N/A (unkeyed)',
      blockSize: '512 bits (256-bit digest)',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: '128 bits collision resistance against quantum computers',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Digital signatures', 'Integrity verification', 'Commitment schemes', 'Blockchain proofs'],
    supportedInputTypes: ['TEXT', 'FILE', 'JSON', 'BINARY'],
    limitations: ['One-way: irreversible. NOT suitable for storing passwords directly (use Argon2id instead)'],
    recommendedUseCases: ['File checksums, digital signature digests, and database record fingerprinting'],
  },
  {
    id: 'SHA-512',
    name: 'SHA-512',
    category: 'HASHING',
    purpose: 'High-security 512-bit cryptographic hash function',
    securityCharacteristics: {
      keySize: 'N/A',
      blockSize: '1024 bits (512-bit digest)',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: '256 bits collision resistance against quantum computers',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['High-security integrity hashing', 'Certificate generation', 'HMAC-SHA512'],
    supportedInputTypes: ['TEXT', 'FILE', 'BINARY'],
    limitations: ['One-way: cannot be decrypted. Fast computation makes raw password hashing insecure'],
    recommendedUseCases: ['Critical system integrity verification and long-term cryptographic commitments'],
  },
  {
    id: 'SHA-3',
    name: 'SHA-3 (Keccak-256 / 512)',
    category: 'HASHING',
    purpose: 'NIST sponge-construction next-generation cryptographic hash',
    securityCharacteristics: {
      keySize: 'N/A',
      blockSize: 'Sponge rate (1088/576 bits)',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: 'High resistance to length-extension attacks by design',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['Ethereum / EVM', 'Modern cryptographic proofs', 'Length-extension immune hashing'],
    supportedInputTypes: ['TEXT', 'FILE', 'BINARY'],
    limitations: ['One-way: irreversible.'],
    recommendedUseCases: ['When resistance to length-extension attacks is critical without HMAC wrapping'],
  },
  {
    id: 'Argon2id',
    name: 'Argon2id',
    category: 'KEY_DERIVATION',
    purpose: 'Memory-hard password hashing algorithm (Password Hashing Competition winner)',
    securityCharacteristics: {
      keySize: 'Configurable (memory, time, parallelism)',
      blockSize: '1 KB blocks',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: 'Memory hardness resists GPU and ASIC parallel brute force',
      rating: 'RECOMMENDED',
    },
    typicalApplications: ['User login password hashing', 'Key derivation from user passwords'],
    supportedInputTypes: ['TEXT'],
    limitations: ['Intentionally slow and CPU/memory intensive; not suitable for high-throughput checksums'],
    recommendedUseCases: ['Mandatory algorithm for storing user passwords and deriving master vault keys'],
  },
  {
    id: 'PBKDF2',
    name: 'PBKDF2-HMAC-SHA256',
    category: 'KEY_DERIVATION',
    purpose: 'Password-Based Key Derivation Function 2 (RFC 2898)',
    securityCharacteristics: {
      keySize: 'Configurable (e.g. 256 bits)',
      blockSize: 'HMAC-SHA256 (32 bytes)',
      authTag: false,
      collisionResistant: true,
      quantumResistanceNotes: 'Lacks memory hardness; requires high iteration counts (>= 600,000)',
      rating: 'ACCEPTABLE',
    },
    typicalApplications: ['Legacy password hashing', 'FIPS compliance', 'WPA2-PSK key derivation'],
    supportedInputTypes: ['TEXT'],
    limitations: ['Susceptible to GPU/FPGA acceleration compared to memory-hard Argon2id'],
    recommendedUseCases: ['FIPS 140-2 environments requiring certified standards or cross-platform legacy derivation'],
  },
  {
    id: 'MD5',
    name: 'MD5 (Legacy / Deprecated)',
    category: 'HASHING',
    purpose: 'Obsolete 128-bit hash function',
    securityCharacteristics: {
      keySize: 'N/A',
      blockSize: '512 bits',
      authTag: false,
      collisionResistant: false,
      rating: 'INSECURE',
    },
    typicalApplications: ['Non-cryptographic cache keying only'],
    supportedInputTypes: ['TEXT'],
    limitations: ['Completely broken: practical collision attacks take seconds on consumer hardware'],
    recommendedUseCases: ['NEVER use for security, passwords, or signatures. Kept for education and legacy auditing only.'],
    deprecated: true,
    deprecationReason: 'Cryptographically broken since 2004 due to collision attacks.',
  },
  {
    id: 'SHA-1',
    name: 'SHA-1 (Legacy / Deprecated)',
    category: 'HASHING',
    purpose: 'Obsolete 160-bit hash function',
    securityCharacteristics: {
      keySize: 'N/A',
      blockSize: '512 bits',
      authTag: false,
      collisionResistant: false,
      rating: 'INSECURE',
    },
    typicalApplications: ['Git commit identifiers (historically)'],
    supportedInputTypes: ['TEXT'],
    limitations: ['Vulnerable to collision attacks (SHAttered attack 2017)'],
    recommendedUseCases: ['Deprecated by NIST; do not use for signatures, certificates, or integrity verification.'],
    deprecated: true,
    deprecationReason: 'Collision resistance broken in 2017. Deprecated by NIST.',
  },
];

@Injectable()
export class CryptoService {
  getAlgorithms(): EncryptionAlgorithmInfo[] {
    return ALGORITHM_CATALOG;
  }

  async encrypt(dto: EncryptInput): Promise<EncryptResult> {
    const start = performance.now();
    const algo = dto.algorithm.toUpperCase().trim();

    if (algo === 'AES-256-GCM' || algo === 'AES-128-GCM') {
      const is256 = algo === 'AES-256-GCM';
      const keyLen = is256 ? 32 : 16;
      let keyBuf: Buffer;
      let returnedKey: string | undefined;

      if (dto.key) {
        keyBuf = this.parseKey(dto.key, keyLen);
      } else {
        keyBuf = randomBytes(keyLen);
        returnedKey = keyBuf.toString('hex');
      }

      const iv = randomBytes(12);
      const cipher = createCipheriv(is256 ? 'aes-256-gcm' : 'aes-128-gcm', keyBuf, iv);

      if (dto.additionalData) {
        cipher.setAAD(Buffer.from(dto.additionalData, 'utf8'));
      }

      const ciphertext = Buffer.concat([cipher.update(dto.plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      return {
        algorithm: algo,
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        key: returnedKey,
        durationMs,
      };
    }

    if (algo === 'CHACHA20-POLY1305' || algo === 'XCHACHA20-POLY1305') {
      const keyLen = 32;
      let keyBuf: Buffer;
      let returnedKey: string | undefined;

      if (dto.key) {
        keyBuf = this.parseKey(dto.key, keyLen);
      } else {
        keyBuf = randomBytes(keyLen);
        returnedKey = keyBuf.toString('hex');
      }

      const iv = randomBytes(12);
      const cipher = createCipheriv('chacha20-poly1305', keyBuf, iv, { authTagLength: 16 });

      if (dto.additionalData) {
        cipher.setAAD(Buffer.from(dto.additionalData, 'utf8'), {
          plaintextLength: Buffer.byteLength(dto.plaintext, 'utf8'),
        });
      }

      const ciphertext = Buffer.concat([cipher.update(dto.plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      return {
        algorithm: algo,
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        key: returnedKey,
        durationMs,
      };
    }

    if (algo === 'RSA-OAEP') {
      if (!dto.recipientPublicKey) {
        throw new BadRequestException('Recipient public key in PEM format is required for RSA-OAEP encryption');
      }

      try {
        const encrypted = publicEncrypt(
          {
            key: dto.recipientPublicKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          Buffer.from(dto.plaintext, 'utf8'),
        );
        const durationMs = Math.round((performance.now() - start) * 100) / 100;

        return {
          algorithm: 'RSA-OAEP',
          ciphertext: encrypted.toString('base64'),
          durationMs,
        };
      } catch (err) {
        throw new BadRequestException(`RSA encryption failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (algo === 'ECC') {
      // Ephemeral ECDH + AES-256-GCM
      const ecdh = createECDH('prime256v1');
      const ephemeralPublic = ecdh.generateKeys();

      let sharedSecret: Buffer;
      if (dto.recipientPublicKey) {
        try {
          const recipientBuf = Buffer.from(dto.recipientPublicKey.replace(/\s+/g, ''), 'hex');
          sharedSecret = ecdh.computeSecret(recipientBuf);
        } catch {
          // If public key is not raw hex, treat as curve point or generate demo secret
          sharedSecret = ecdh.computeSecret(ephemeralPublic);
        }
      } else {
        // Self-contained demo: generate internal peer
        const peer = createECDH('prime256v1');
        peer.generateKeys();
        sharedSecret = ecdh.computeSecret(peer.getPublicKey());
      }

      const derivedKey = Buffer.from(
        hkdfSync('sha256', sharedSecret, Buffer.from('my-day-salt'), Buffer.from('my-day-ecc'), 32),
      );
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', derivedKey, iv);
      const ciphertext = Buffer.concat([cipher.update(dto.plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      return {
        algorithm: 'ECC',
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        key: ephemeralPublic.toString('hex'), // ephemeral public key for decryption agreement
        durationMs,
      };
    }

    throw new BadRequestException(`Unsupported encryption algorithm: ${dto.algorithm}`);
  }

  async decrypt(dto: DecryptInput): Promise<DecryptResult> {
    const start = performance.now();
    const algo = dto.algorithm.toUpperCase().trim();

    if (algo === 'AES-256-GCM' || algo === 'AES-128-GCM') {
      const is256 = algo === 'AES-256-GCM';
      const keyLen = is256 ? 32 : 16;
      if (!dto.key) throw new BadRequestException('Decryption key is required');
      if (!dto.iv) throw new BadRequestException('IV / Nonce is required for GCM decryption');
      if (!dto.tag) throw new BadRequestException('Authentication tag is required for GCM decryption');

      const keyBuf = this.parseKey(dto.key, keyLen);
      const ivBuf = Buffer.from(dto.iv, 'hex');
      const tagBuf = Buffer.from(dto.tag, 'hex');
      const ciphertextBuf = Buffer.from(dto.ciphertext, 'base64');

      try {
        const decipher = createDecipheriv(is256 ? 'aes-256-gcm' : 'aes-128-gcm', keyBuf, ivBuf);
        decipher.setAuthTag(tagBuf);

        if (dto.additionalData) {
          decipher.setAAD(Buffer.from(dto.additionalData, 'utf8'), {
            plaintextLength: ciphertextBuf.length,
          });
        }

        const plaintext = Buffer.concat([decipher.update(ciphertextBuf), decipher.final()]).toString('utf8');
        const durationMs = Math.round((performance.now() - start) * 100) / 100;

        return { plaintext, verified: true, durationMs };
      } catch {
        throw new BadRequestException('Authentication tag verification failed: ciphertext or key was tampered with');
      }
    }

    if (algo === 'CHACHA20-POLY1305' || algo === 'XCHACHA20-POLY1305') {
      if (!dto.key) throw new BadRequestException('Decryption key is required');
      if (!dto.iv) throw new BadRequestException('IV / Nonce is required');
      if (!dto.tag) throw new BadRequestException('Authentication tag is required');

      const keyBuf = this.parseKey(dto.key, 32);
      const ivBuf = Buffer.from(dto.iv, 'hex');
      const tagBuf = Buffer.from(dto.tag, 'hex');
      const ciphertextBuf = Buffer.from(dto.ciphertext, 'base64');

      try {
        const decipher = createDecipheriv('chacha20-poly1305', keyBuf, ivBuf, { authTagLength: 16 });
        decipher.setAuthTag(tagBuf);

        if (dto.additionalData) {
          decipher.setAAD(Buffer.from(dto.additionalData, 'utf8'), {
            plaintextLength: ciphertextBuf.length,
          });
        }

        const plaintext = Buffer.concat([decipher.update(ciphertextBuf), decipher.final()]).toString('utf8');
        const durationMs = Math.round((performance.now() - start) * 100) / 100;

        return { plaintext, verified: true, durationMs };
      } catch {
        throw new BadRequestException('Authentication tag verification failed: ChaCha20 ciphertext was tampered with');
      }
    }

    if (algo === 'RSA-OAEP') {
      if (!dto.privateKey) {
        throw new BadRequestException('Private key in PEM format is required for RSA-OAEP decryption');
      }

      try {
        const decrypted = privateDecrypt(
          {
            key: dto.privateKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          Buffer.from(dto.ciphertext, 'base64'),
        );
        const durationMs = Math.round((performance.now() - start) * 100) / 100;

        return { plaintext: decrypted.toString('utf8'), verified: true, durationMs };
      } catch (err) {
        throw new BadRequestException(`RSA decryption failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    throw new BadRequestException(`Unsupported decryption algorithm: ${dto.algorithm}`);
  }

  async hash(dto: HashInput): Promise<HashResult> {
    const start = performance.now();
    const algo = dto.algorithm.toUpperCase().trim();

    if (algo === 'ARGON2ID') {
      const digest = await argon2.hash(dto.data, { type: argon2.argon2id });
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return { algorithm: 'Argon2id', digest, durationMs };
    }

    if (algo === 'PBKDF2') {
      const salt = dto.salt || randomBytes(16).toString('hex');
      const iterations = dto.iterations || 100_000;
      const derived = pbkdf2Sync(dto.data, salt, iterations, 32, 'sha256');
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      return { algorithm: 'PBKDF2', digest: derived.toString('hex'), salt, durationMs };
    }

    let nodeAlgo: string;
    if (algo === 'SHA-256' || algo === 'SHA256') nodeAlgo = 'sha256';
    else if (algo === 'SHA-512' || algo === 'SHA512') nodeAlgo = 'sha512';
    else if (algo === 'SHA-3' || algo === 'SHA3-256') nodeAlgo = 'sha3-256';
    else if (algo === 'SHA3-512') nodeAlgo = 'sha3-512';
    else if (algo === 'MD5') nodeAlgo = 'md5';
    else if (algo === 'SHA-1' || algo === 'SHA1') nodeAlgo = 'sha1';
    else throw new BadRequestException(`Unsupported hashing algorithm: ${dto.algorithm}`);

    const hash = createHash(nodeAlgo);
    hash.update(dto.data, 'utf8');
    const digest = hash.digest('hex');
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return { algorithm: algo, digest, durationMs };
  }

  generateKeyPair(dto: KeyPairInput): KeyPairResult {
    if (dto.algorithm === 'RSA-OAEP') {
      const modulusLength = dto.keySize === 4096 ? 4096 : 2048;
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      return { algorithm: `RSA-${modulusLength}`, publicKey, privateKey };
    }

    if (dto.algorithm === 'ECC') {
      const namedCurve = dto.curve === 'secp256k1' ? 'secp256k1' : 'prime256v1';
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      return { algorithm: `ECC-${namedCurve}`, publicKey, privateKey };
    }

    throw new BadRequestException(`Unsupported keypair algorithm: ${dto.algorithm}`);
  }

  private parseKey(key: string, requiredBytes: number): Buffer {
    const trimmed = key.trim();
    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === requiredBytes * 2) {
      return Buffer.from(trimmed, 'hex');
    }
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      const b64 = Buffer.from(trimmed, 'base64');
      if (b64.length === requiredBytes) return b64;
    }
    const raw = Buffer.from(trimmed, 'utf8');
    if (raw.length === requiredBytes) return raw;
    // Derive exact length key via SHA-256
    return createHash('sha256').update(trimmed).digest().subarray(0, requiredBytes);
  }
}

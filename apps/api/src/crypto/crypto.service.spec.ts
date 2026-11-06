import { describe, expect, it } from 'vitest';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const service = new CryptoService();

  describe('Algorithm Catalog', () => {
    it('returns the algorithm catalog with security ratings and metadata', () => {
      const catalog = service.getAlgorithms();
      expect(catalog.length).toBeGreaterThan(8);
      const aes256 = catalog.find((a) => a.id === 'AES-256-GCM');
      expect(aes256?.securityCharacteristics.rating).toBe('RECOMMENDED');
      expect(aes256?.securityCharacteristics.authTag).toBe(true);

      const md5 = catalog.find((a) => a.id === 'MD5');
      expect(md5?.deprecated).toBe(true);
      expect(md5?.securityCharacteristics.rating).toBe('INSECURE');
    });
  });

  describe('Symmetric Encryption', () => {
    it('encrypts and decrypts with AES-256-GCM and verified auth tag', async () => {
      const plaintext = 'Sensitive personal productivity data 12345!';
      const enc = await service.encrypt({
        algorithm: 'AES-256-GCM',
        plaintext,
        additionalData: 'user-id-42',
      });

      expect(enc.ciphertext).toBeDefined();
      expect(enc.iv).toBeDefined();
      expect(enc.tag).toBeDefined();
      expect(enc.key).toBeDefined();

      const dec = await service.decrypt({
        algorithm: 'AES-256-GCM',
        ciphertext: enc.ciphertext,
        key: enc.key,
        iv: enc.iv,
        tag: enc.tag,
        additionalData: 'user-id-42',
      });

      expect(dec.verified).toBe(true);
      expect(dec.plaintext).toBe(plaintext);
    });

    it('rejects tampered ciphertext with authentication tag failure', async () => {
      const plaintext = 'Secret note content';
      const enc = await service.encrypt({
        algorithm: 'AES-256-GCM',
        plaintext,
      });

      // Tamper with the ciphertext
      const tamperedBuf = Buffer.from(enc.ciphertext, 'base64');
      tamperedBuf[0] = tamperedBuf[0]! ^ 0xff;

      await expect(
        service.decrypt({
          algorithm: 'AES-256-GCM',
          ciphertext: tamperedBuf.toString('base64'),
          key: enc.key,
          iv: enc.iv,
          tag: enc.tag,
        }),
      ).rejects.toThrow('Authentication tag verification failed');
    });

    it('encrypts and decrypts with ChaCha20-Poly1305', async () => {
      const plaintext = 'ChaCha20-Poly1305 high speed message';
      const enc = await service.encrypt({
        algorithm: 'ChaCha20-Poly1305',
        plaintext,
      });

      expect(enc.tag).toBeDefined();
      const dec = await service.decrypt({
        algorithm: 'ChaCha20-Poly1305',
        ciphertext: enc.ciphertext,
        key: enc.key,
        iv: enc.iv,
        tag: enc.tag,
      });

      expect(dec.plaintext).toBe(plaintext);
      expect(dec.verified).toBe(true);
    });
  });

  describe('Asymmetric Encryption', () => {
    it('generates RSA keypair and executes RSA-OAEP encryption/decryption', async () => {
      const keypair = service.generateKeyPair({ algorithm: 'RSA-OAEP', keySize: 2048 });
      expect(keypair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(keypair.privateKey).toContain('BEGIN PRIVATE KEY');

      const plaintext = 'Confidential asymmetric payload';
      const enc = await service.encrypt({
        algorithm: 'RSA-OAEP',
        plaintext,
        recipientPublicKey: keypair.publicKey,
      });

      expect(enc.ciphertext).toBeDefined();

      const dec = await service.decrypt({
        algorithm: 'RSA-OAEP',
        ciphertext: enc.ciphertext,
        privateKey: keypair.privateKey,
      });

      expect(dec.plaintext).toBe(plaintext);
      expect(dec.verified).toBe(true);
    });

    it('generates ECC keypair and performs ephemeral ECDH authenticated encryption', async () => {
      const keypair = service.generateKeyPair({ algorithm: 'ECC', curve: 'prime256v1' });
      expect(keypair.publicKey).toContain('BEGIN PUBLIC KEY');

      const plaintext = 'ECC Ephemeral payload';
      const enc = await service.encrypt({
        algorithm: 'ECC',
        plaintext,
      });

      expect(enc.ciphertext).toBeDefined();
      expect(enc.tag).toBeDefined();
      expect(enc.key).toBeDefined(); // Ephemeral public key
    });
  });

  describe('Hashing & Key Derivation', () => {
    it('computes SHA-256 and SHA-512 cryptographic digests', async () => {
      const data = 'Hello, world!';
      const sha256 = await service.hash({ algorithm: 'SHA-256', data });
      // Known sha256 of "Hello, world!"
      expect(sha256.digest).toBe('315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3');

      const sha512 = await service.hash({ algorithm: 'SHA-512', data });
      expect(sha512.digest).toHaveLength(128);
    });

    it('computes SHA-3 digest', async () => {
      const sha3 = await service.hash({ algorithm: 'SHA-3', data: 'secure data' });
      expect(sha3.digest).toHaveLength(64);
    });

    it('computes Argon2id password hash', async () => {
      const password = 'SuperSecretUserPassword123!';
      const res = await service.hash({ algorithm: 'Argon2id', data: password });
      expect(res.digest).toContain('$argon2id$');
    });

    it('computes PBKDF2 with salt and iterations', async () => {
      const res = await service.hash({
        algorithm: 'PBKDF2',
        data: 'password123',
        salt: 'fixed-salt-1234',
        iterations: 10000,
      });
      expect(res.digest).toHaveLength(64);
      expect(res.salt).toBe('fixed-salt-1234');
    });
  });
});

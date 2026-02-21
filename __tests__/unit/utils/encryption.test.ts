/**
 * Encryption Utility Tests
 * 
 * Tests AES-256 encryption/decryption functionality.
 * Validates Requirements: 4.2, 15.1
 */

import { encrypt, decrypt, validateEncryption, generateEncryptionKey } from '@/lib/utils/encryption';

// Mock environment variable
const MOCK_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('Encryption Utility', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = MOCK_ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    test('should encrypt a string', () => {
      const plaintext = 'my-secret-token-12345';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      
      // Check format: iv:authTag:encrypted
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
    });

    test('should produce different ciphertext for same plaintext', () => {
      // Due to random IV, same plaintext should produce different ciphertext
      const plaintext = 'same-token';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('should throw error if ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });

    test('should throw error if ENCRYPTION_KEY is invalid length', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'short-key';
      
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 32 bytes');
      
      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('decrypt', () => {
    test('should decrypt encrypted string back to original', () => {
      const plaintext = 'my-secret-token-12345';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should handle special characters', () => {
      const plaintext = 'token!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should handle long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should handle unicode characters', () => {
      const plaintext = 'Türkçe karakterler: ğüşıöç ĞÜŞIÖÇ';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should throw error for invalid encrypted data format', () => {
      expect(() => decrypt('invalid-format')).toThrow();
    });

    test('should throw error for tampered data', () => {
      const plaintext = 'my-secret-token';
      const encrypted = encrypt(plaintext);
      
      // Tamper with the encrypted data
      const tampered = encrypted.replace(/.$/, '0');
      
      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('validateEncryption', () => {
    test('should return true when encryption is working', () => {
      const isValid = validateEncryption();
      expect(isValid).toBe(true);
    });

    test('should return false when ENCRYPTION_KEY is invalid', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'invalid';
      
      const isValid = validateEncryption();
      expect(isValid).toBe(false);
      
      process.env.ENCRYPTION_KEY = originalKey;
    });
  });

  describe('generateEncryptionKey', () => {
    test('should generate a valid 64-character hex string', () => {
      const key = generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    test('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Round-trip encryption', () => {
    test('should handle Meta API token format', () => {
      const metaToken = 'EAABsbCS1iHgBO7ZCxqZCZCqZCZCqZCZCqZCZCqZCZCqZCZCqZCZCqZCZCqZCZCq';
      const encrypted = encrypt(metaToken);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(metaToken);
    });

    test('should handle empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should handle JSON strings', () => {
      const jsonData = JSON.stringify({ token: 'abc123', expires: 1234567890 });
      const encrypted = encrypt(jsonData);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(jsonData);
      expect(JSON.parse(decrypted)).toEqual({ token: 'abc123', expires: 1234567890 });
    });
  });
});

import * as bs58 from 'bs58';
import RIPEMD160 from 'ripemd160';
import * as secp256k1 from 'secp256k1';
import * as shajs from 'sha.js';
import { HASH_LENGTH } from '../common';
import { isHex } from './serialize';

export const PRIVATE_KEY_LENGTH = 64;

export type AddressHash = Buffer;
export type Address = string;
export type Hash = string;
export type AgentHash = Hash;

export function publicKeyFromPrivateKey(privateKey: Buffer): Buffer {

  return secp256k1.publicKeyCreate(privateKey);

}

export function isValidPrivateKey(privateKey: string): boolean {

  if (!privateKey || !isHex(privateKey)) {

    return false;

  }

  if (privateKey.substr(0, 2) === '00') {

    privateKey = privateKey.substr(2);

  }

  if (privateKey.length !== PRIVATE_KEY_LENGTH) {

    return false;

  }

  try {

    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    publicKeyFromPrivateKey(privateKeyBuffer);

    return true;

  } catch (e) {

    return false;

  }

}

export function isValidAddress(address: string): boolean {

  return /^(Ns|TT)([a-zA-Z-0-9]{30})$/.test(address);

}

export function isValidHash(hash: string): boolean {

  return Buffer.from(hash, 'hex').length === HASH_LENGTH;

}

export function getPrivateKeyBuffer(privateKey: string): Buffer {

  if (!isValidPrivateKey(privateKey)) {

    throw new Error('Invalid private key provided.');

  }

  if (privateKey.substr(0, 2) === '00') {

    privateKey = privateKey.substr(2);

  }

  return Buffer.from(privateKey, 'hex');

}

export function getXOR(bytes: Buffer): number {

  return bytes.reduce((xor: number, value: number) => xor ^ value);

}

export function addressFromHash(hash: AddressHash): string {

  return bs58.encode(Buffer.concat([hash, Buffer.from([getXOR(hash)])]));

}

export function hashFromAddress(address: Address): AddressHash {

  const hash: number[] = bs58.decode(address);
  return Buffer.from(hash.slice(0, hash.length - 1));

}

export function sha256(data: string | Buffer): Buffer {

  return new shajs.sha256().update(data).digest();

}

export function sha256Twice(buffer: Buffer): Buffer {

  return sha256(sha256(buffer));

}

export function ripemd160(data: string | Buffer): Buffer {

  return new RIPEMD160().update(data).digest();

}

import { Transaction } from '../protocol/transaction';
import { IDigestData } from '../protocol/nulsDigestData';
import * as secp256k1 from 'secp256k1';
import { publicKeyFromPrivateKey } from './crypto';
import { P2PKHScriptSigSerializer, IP2PKHScriptSigData } from './serialize/transaction/signature/P2PKHScriptSig';
import { INulsSignDataData } from './serialize/transaction/signature/nulsSignData';

// https://github.com/nuls-io/nuls/blob/d8227554ce35dfd7557ed489fb5949b528a738bf/core-module/kernel/src/main/java/io/nuls/kernel/script/P2PHKSignature.java#L44
export type IP2PHKSignature = IP2PKHScriptSigData;

export enum NulsSignDataAlgTypes {
  ECC = 0
}

// https://github.com/nuls-io/nuls/blob/d8227554ce35dfd7557ed489fb5949b528a738bf/core-module/kernel/src/main/java/io/nuls/kernel/model/NulsSignData.java
export type INulsSignData = INulsSignDataData;

export type SignatureHash = Buffer;

// https://github.com/nuls-io/nuls/blob/6e22e5ba554fae9e690faaa3797cdddb49f90c44/core-module/kernel/src/main/java/io/nuls/kernel/script/SignatureUtil.java#L147
// TODO: Implement P2SH "P2PKHScriptSignature"
export function createTransactionSignature(tx: Transaction, privateKey: Buffer): SignatureHash {
  
  const signatureData: IP2PHKSignature = createSignatureByEckey(tx, privateKey);
  
  const signatureSize: number = P2PKHScriptSigSerializer.size(signatureData);
  const signatureHash: SignatureHash = Buffer.allocUnsafe(signatureSize);

  P2PKHScriptSigSerializer.write(signatureData, signatureHash, 0);

  return signatureHash;

}

// https://github.com/nuls-io/nuls/blob/6e22e5ba554fae9e690faaa3797cdddb49f90c44/core-module/kernel/src/main/java/io/nuls/kernel/script/SignatureUtil.java#L193
function createSignatureByEckey(tx: Transaction, privateKey: Buffer): IP2PHKSignature {

  const publicKey: Buffer = publicKeyFromPrivateKey(privateKey);
  const signData: INulsSignData = signDigest(tx, privateKey);

  return {
    publicKey,
    signData
  };

}

// https://github.com/nuls-io/nuls/blob/6e22e5ba554fae9e690faaa3797cdddb49f90c44/core-module/kernel/src/main/java/io/nuls/kernel/script/SignatureUtil.java#L400
function signDigest(tx: Transaction, privateKey: Buffer): INulsSignData {

  const digestData: IDigestData = tx.getDigest();

  const sigResult = secp256k1.sign(digestData.digest, privateKey);
  const signature: Buffer = secp256k1.signatureExport(sigResult.signature);

  return {
    signAlgType: NulsSignDataAlgTypes.ECC,
    signature
  };

}
import { Address, isValidAddress } from './../../utils/crypto';
import { TransactionType } from '../../common';
import { ITransactionData } from '../../utils/serialize/transaction/transaction';
import { BaseTransaction, TransactionConfig } from './baseTransaction';
import { ITxDataRegisterData } from '../../utils/serialize/transaction/txData/txDataRegister';
import { UTXO } from '../utxo';
import { MAX_FEE_PRICE_1024_BYTES, nulsToNa } from '../../utils';

// https://github.com/nuls-official/nuls/blob/4c60055c9fae38c66c62b432e0b634117e2876fe/consensus-module/poc/consensus-poc-protocol/src/main/java/io/nuls/consensus/poc/protocol/tx/CreateAgentTransaction.java#L38
// https://github.com/nuls-official/nuls/blob/4c60055c9fae38c66c62b432e0b634117e2876fe/consensus-module/poc/consensus-poc-rpc/src/main/java/io/nuls/consensus/poc/rpc/resource/PocConsensusResource.java#L447
export class RegisterTransaction extends BaseTransaction {

  private static CONSENSUS_LOCK_TIME = -1;

  protected _fee_price = MAX_FEE_PRICE_1024_BYTES;
  protected _type = TransactionType.Register;
  protected _txData: ITxDataRegisterData = {} as any;

  private _consensusOutputIndex: number | undefined;

  static fromBytes(bytes: Buffer) {

    let tx = new RegisterTransaction();
    return this._fromBytes(bytes, tx);

  }

  static fromRawData(rawData: ITransactionData): RegisterTransaction {

    let tx = new RegisterTransaction();
    return this._fromRawData(rawData, tx);

  }

  static async fromAddress(address: string, config?: TransactionConfig): Promise<RegisterTransaction> {

    let tx = new RegisterTransaction();
    return this._fromAddress<RegisterTransaction>(address, tx, config);

  };

  static fromUtxos(utxos: UTXO[]): RegisterTransaction {

    let tx = new RegisterTransaction();
    return this._fromUtxos<RegisterTransaction>(utxos, tx);

  };

  packingAddress(address: Address): this {

    this._txData.packingAddress = address;
    return this;
    
  }

  agentAddress(address: Address): this {

    this._txData.agentAddress = address;

    if (!this._txData.rewardAddress) {
      this._txData.rewardAddress = address;
    }

    if (!this._changeAddress) {
      this.change(address);
    }

    this.updateConsensusOutput();
    this.updateInputsAndOutputs();

    return this;
    
  }

  rewardAddress(address: Address): this {

    this._txData.rewardAddress = address;
    
    this.updateInputsAndOutputs();
    return this;
    
  }

  deposit(amount: number): this {

    this._txData.deposit = amount;

    this.updateInputsAndOutputs();
    return this;
    
  }

  commission(percentage: number): this {

    this._txData.commissionRate = percentage;

    this.updateInputsAndOutputs();
    return this;
    
  }

  protected validateTxData(): boolean {

    if (this._config.safeCheck) {

      if (!isValidAddress(this._txData.agentAddress)) {
        throw new Error('Invalid agentAddress');
      }

      if (!isValidAddress(this._txData.packingAddress)) {
        throw new Error('Invalid packingAddress');
      }

      if (!isValidAddress(this._txData.rewardAddress)) {
        throw new Error('Invalid rewardAddress');
      }

      if (!this._txData.commissionRate || (this._txData.commissionRate < 10 || this._txData.commissionRate > 100)) {
        throw new Error('Invalid commission rate, should be between [10, 100]');
      }

      if (!this._txData.deposit || this._txData.deposit < nulsToNa(20000)) {
        throw new Error('Invalid deposit, should be equal or greater than 20000 nuls');
      }

    }

    return super.validateTxData();

  }

  private updateConsensusOutput() {

    this._coinData.removeOutput(this._consensusOutputIndex);
    this._consensusOutputIndex = this._coinData.addOutput(this._txData.agentAddress, this._txData.deposit, RegisterTransaction.CONSENSUS_LOCK_TIME);

  }

}
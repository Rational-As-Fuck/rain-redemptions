import * as Anchor from "@project-serum/anchor";
import * as Web3 from '@solana/web3.js';

export default class WebWallet implements Anchor.Wallet {
  _signTransaction: (transaction: Web3.Transaction) => Promise<Web3.Transaction>;
  _signAllTransactions: (transaction: Web3.Transaction[]) => Promise<Web3.Transaction[]>;
  sendTransaction: (transaction: Anchor.web3.Transaction, connection: Anchor.web3.Connection, options?: any) => Promise<string>;
  _publicKey: Web3.PublicKey;
  payer: Anchor.web3.Keypair;

  constructor(
    publicKey: Web3.PublicKey,
    signTransaction: (transaction: Web3.Transaction) => Promise<Web3.Transaction>,
    signAllTransactions: (transaction: Web3.Transaction[]) => Promise<Web3.Transaction[]>,
    sendTransaction: any
  ) {
    this._publicKey = publicKey;
    this._signTransaction = signTransaction;
    this._signAllTransactions = signAllTransactions;
    this.sendTransaction = sendTransaction;
    this.payer = new Anchor.web3.Keypair(); 
  }

  async signTransaction(tx: Web3.Transaction): Promise<Web3.Transaction> {
    return this._signTransaction(tx);
  }

  async signAllTransactions(txs: Web3.Transaction[]): Promise<Web3.Transaction[]> {
    return this._signAllTransactions(txs);
  }

  get publicKey(): Web3.PublicKey {
    return this._publicKey;
  }
}

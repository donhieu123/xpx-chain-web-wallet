import { Transaction, PublicAccount } from 'proximax-nem2-sdk';

export interface TransactionsInterface {
  data: Transaction;
  nameType: string;
  timestamp: string;
  fee: string;
  sender: PublicAccount;
  recipientRentalFeeSink: string;
  recipient: PublicAccount;
  isRemitent: boolean;
}


export interface MosaicXPXInterface {
  mosaic: "prx:xpx",
  mosaicId: "d423931bd268d1f4",
  divisibility: 6
}
import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { EncryptedMessage } from 'tsjs-xpx-chain-sdk';
import { TransactionsInterface, TransactionsService } from '../../../transactions/services/transactions.service';
import { ProximaxProvider } from '../../../shared/services/proximax.provider';
import { environment } from '../../../../environments/environment';
import { SharedService } from '../../../shared/services/shared.service';
import { WalletService } from '../../../wallet/services/wallet.service';
import { NamespacesService } from '../../../servicesModule/services/namespaces.service';

@Component({
  selector: 'app-transfer-type',
  templateUrl: './transfer-type.component.html',
  styleUrls: ['./transfer-type.component.css']
})
export class TransferTypeComponent implements OnInit, OnChanges {

  @Input() transferTransaction: TransactionsInterface;
  searching = true;
  simple = null;
  typeTransactionHex: string;
  msg = '';
  typeMsg = null;
  amountTwoPart: { part1: string; part2: string; };
  decryptedMessage: any;
  nis1hash: any;
  routeNis1Explorer = environment.nis1.urlExplorer;
  message: any;
  namespaceName = '';
  panelDecrypt = 0;
  password = null;
  passwordMain = 'password';
  recipientPublicAccount = null;
  senderPublicAccount = null;
  showEncryptedMessage = false;

  constructor(
    private namesapceService: NamespacesService,
    public transactionService: TransactionsService,
    public sharedService: SharedService,
    public proximaxProvider: ProximaxProvider,
    public walletService: WalletService
  ) { }

  ngOnInit() {
  }


  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    this.verifyRecipientInfo();
    this.hideMessage();
    this.searching = true;
    this.typeTransactionHex = `${this.transferTransaction.data['type'].toString(16).toUpperCase()}`;
    this.message = null;
    this.message = this.transferTransaction.data.message;
    this.amountTwoPart = { part1: '', part2: '' };
    this.namespaceName = '';
    if (this.transferTransaction.data.transactionInfo) {
      const height = this.transferTransaction.data.transactionInfo.height.compact();
    }

    if (this.transferTransaction.data['message'].payload !== '') {
      try {
        const addressAccountMultisig = environment.swapAccount.addressAccountMultisig;
        const addressAccountSimple = environment.swapAccount.addressAccountSimple;
        const addressSender = this.transferTransaction.sender.address.plain();
        if ((addressSender === addressAccountMultisig) || (addressSender === addressAccountSimple)) {
          const msg = JSON.parse(this.transferTransaction.data['message'].payload);
          if (msg && msg['type'] === 'Swap') {
            this.msg = msg['message'];
            this.nis1hash = msg['nis1Hash'];
            if (this.transferTransaction.data['mosaics'].length > 0) {
              const id = this.transferTransaction.data['mosaics'][0].id;
              this.build(id);
            }

            this.simple = false;
            return;
          } else {
            this.simple = true;
          }
        } else {
          this.simple = true;
        }
      } catch (error) {
        // console.log(error);
        this.simple = true;
      }
    } else {
      this.simple = true;
    }
  }

  /**
   *
   *
   * @param {*} id
   * @memberof TransferTypeComponent
   */
  async build(id: any) {
    let d = 6;
    const n = await this.namesapceService.getNamespaceFromId([id]);
    this.namespaceName = id.toHex();
    if ((n.length > 0)) {
      this.namespaceName = (n[0].namespaceName.name === 'prx.xpx') ? 'XPX' : n[0].namespaceName.name;
      const x = environment.swapAllowedMosaics.find(r => `${r.namespaceId}.${r.name}` === n[0].namespaceName.name);
      if (x) { d = x.divisibility; }
    }
    const amount = this.transactionService.amountFormatterSimple(this.transferTransaction.data['mosaics'][0].amount.compact(), d);
    this.amountTwoPart = this.transactionService.getDataPart(amount.toString(), d);
  }

  /**
   *
   *
   * @memberof TransferTypeComponent
   */
  async verifyRecipientInfo() {
    const address = this.proximaxProvider.createFromRawAddress(this.transferTransaction.recipient['address']);
    try {
      const accountInfo = await this.proximaxProvider.getAccountInfo(address).toPromise();
      this.recipientPublicAccount = accountInfo.publicAccount;
    } catch (e) { }

    this.senderPublicAccount = this.transferTransaction.data.signer;
    const firstAccount = this.walletService.currentAccount;

    const availableAddress = [
      this.recipientPublicAccount.address.address,
      this.senderPublicAccount.address.address
    ];

    if (availableAddress.includes(firstAccount.address)) {
      this.showEncryptedMessage = true;
    }
  }

  /**
   *
   *
   * @param {*} inputType
   * @memberof TransferTypeComponent
   */
  changeInputType(inputType: string) {
    const newType = this.sharedService.changeInputType(inputType);
    this.passwordMain = newType;
  }

  /**
   *
   *
   * @memberof TransferTypeComponent
   */
  decryptMessage() {
    const common = { password: this.password };
    const firstAccount = this.walletService.currentAccount;
    if (this.walletService.decrypt(common, firstAccount)) {
      let recipientMsg = EncryptedMessage.decrypt(this.message, common['privateKey'], this.senderPublicAccount);
      let senderMsg = EncryptedMessage.decrypt(this.message, common['privateKey'], this.recipientPublicAccount);
      if (firstAccount.address === this.recipientPublicAccount.address.address) {
        recipientMsg = EncryptedMessage.decrypt(this.message, common['privateKey'], this.senderPublicAccount);
        this.decryptedMessage = recipientMsg;
      } else {
        senderMsg = EncryptedMessage.decrypt(this.message, common['privateKey'], this.recipientPublicAccount);
        this.decryptedMessage = senderMsg;
      }

      this.panelDecrypt = 2;
    } else {
      this.panelDecrypt = 0;
    }
  }

  /**
   *
   *
   * @memberof TransferTypeComponent
   */
  hideMessage() {
    this.password = '';
    this.decryptedMessage = null;
    this.panelDecrypt = 0;
  }
}

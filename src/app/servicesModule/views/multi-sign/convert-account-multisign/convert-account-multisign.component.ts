
import { Component, OnInit } from '@angular/core';
import { NgBlockUI, BlockUI } from 'ng-block-ui';
import { AppConfig } from 'src/app/config/app.config';
import { SharedService, ConfigurationForm } from 'src/app/shared/services/shared.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { WalletService, AccountsInfoInterface, AccountsInterface } from 'src/app/wallet/services/wallet.service';
import {
  Account,
  PublicAccount,
  ModifyMultisigAccountTransaction,
  Deadline,
  MultisigCosignatoryModification,
  UInt64,
  NetworkType,
  Address,
  MultisigCosignatoryModificationType,
  HashLockTransaction,
  Listener,
  LockFundsTransaction,
  TransactionHttp,
  SignedTransaction,
  AggregateTransaction,
  Mosaic,
  MosaicId,
  AccountInfo
} from 'tsjs-xpx-chain-sdk';
import { environment } from 'src/environments/environment';
import { MultiSignService } from 'src/app/servicesModule/services/multi-sign.service';
import { ServicesModuleService } from 'src/app/servicesModule/services/services-module.service';
import { ProximaxProvider } from 'src/app/shared/services/proximax.provider';
import { NodeService } from 'src/app/servicesModule/services/node.service';
import { DataBridgeService } from 'src/app/shared/services/data-bridge.service';
import { TransactionsService } from 'src/app/transfer/services/transactions.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-convert-account-multisign',
  templateUrl: './convert-account-multisign.component.html',
  styleUrls: ['./convert-account-multisign.component.css']
})
export class ConvertAccountMultisignComponent implements OnInit {

  convertAccountMultsignForm: FormGroup;
  configurationForm: ConfigurationForm = {};
  publicAccountToConvert: PublicAccount;
  routes = {
    backToService: `/${AppConfig.routes.service}`,
    createNewAccount: `/${AppConfig.routes.selectTypeCreationAccount}`,
    viewDetails: `/${AppConfig.routes.account}/`
  };
  subscribe: Subscription[] = [];
  minApprovaMaxLength: number = 1;
  minApprovaMinLength: number = 1;
  currentAccounts: any = [];
  currentAccountToConvert: AccountsInterface;
  subscribeAccount = null;
  accountInfo: AccountsInfoInterface = null;
  accountToConvertSign: Account;
  accountValid: boolean;
  mdbBtnAddCosignatory: boolean;
  cosignatoryList: CosignatoryList[] = [];
  transactionHttp: TransactionHttp
  listContact: any = [];
  showContacts: boolean;
  isMultisig: boolean;
  searchContact: boolean;
  btnBlock: boolean;
  blockSend: boolean;
  ban: any;
  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
    private walletService: WalletService,
    private multiSignService: MultiSignService,
    private serviceModuleService: ServicesModuleService,
    private proximaxProvider: ProximaxProvider,
    private nodeService: NodeService,
    private transactionService: TransactionsService,
    private dataBridge: DataBridgeService,
  ) {
    this.currentAccounts = [];
    this.configurationForm = this.sharedService.configurationForm;
    this.accountValid = false;
    this.mdbBtnAddCosignatory = true;
    this.showContacts = false;
    this.cosignatoryList = [];
    this.isMultisig = false;
    this.ban = false;
    this.transactionHttp = new TransactionHttp(environment.protocol + "://" + `${this.nodeService.getNodeSelected()}`);
  }

  ngOnInit() {
    this.createForm();
    this.getAccounts();
    this.booksAddress();
    this.subscribeValueChange();
    this.changeformStatus();
    this.load();
  }
  /**
*
*
* @memberof CreateTransferComponent
*/
  ngOnDestroy(): void {
    // this.subscribeAccount.unsubscribe();
    this.subscribe.forEach(subscription => {
      console.log(subscription);
      subscription.unsubscribe();
    });
    // this.subscribe.forEach(element => {
    //   if (this.subscribe[element] !== undefined) {
    //     this.subscribe[element].unsubscribe();
    //   }
    // });
  }
  /**
 *
 *
 * @memberof MultiSignatureContractComponent
 */
  load() {
    // console.log(this.walletService.accountsInfo);
    this.subscribe.push(this.walletService.getAccountsInfo$().subscribe(
      next => {
        this.getAccounts();
      }
    ));

  }

  /**
   *
   *
   * @memberof ConvertAccountMultisignComponent
   */
  createForm() {
    //Form create multisignature default
    this.convertAccountMultsignForm = this.fb.group({
      selectAccount: ['', [
        Validators.required
      ]
      ],
      cosignatory: [''],
      contact: [''],
      minApprovalDelta: [1, [
        Validators.required, Validators.minLength(1),
        Validators.maxLength(1)]],
      minRemovalDelta: [1, [
        Validators.required, Validators.minLength(1),
        Validators.maxLength(1)]],
      password: ['', [
        Validators.required,
        Validators.minLength(this.configurationForm.passwordWallet.minLength),
        Validators.maxLength(this.configurationForm.passwordWallet.maxLength)
      ]
      ],
    });
    // this.validatorsCosignatory();
    // this.changeformStatus()
  }


  /**
 *
 *
 * @param {string} [nameInput='']
 * @param {string} [nameControl='']
 * @param {string} [nameValidation='']
 * @returns
 * @memberof CreateMultiSignatureComponent
 */
  validateInput(nameInput: string = '', nameControl: string = '', nameValidation: string = '') {
    let validation: AbstractControl = null;
    if (nameInput !== '' && nameControl !== '') {
      validation = this.convertAccountMultsignForm.controls[nameControl].get(nameInput);
    } else if (nameInput === '' && nameControl !== '' && nameValidation !== '') {
      validation = this.convertAccountMultsignForm.controls[nameControl].getError(nameValidation);
    } else if (nameInput !== '') {
      validation = this.convertAccountMultsignForm.get(nameInput);
    }
    return validation;
  }


  /**
   *
   * Get accounts wallet
   * @memberof ConvertAccountMultisignComponent
   */
  getAccounts() {
    this.currentAccounts = [];
    const currentWallet = Object.assign({}, this.walletService.currentWallet);
    // console.log("poooo", currentWallet)
    if (currentWallet && Object.keys(currentWallet).length > 0) {
      for (let element of currentWallet.accounts) {
        const accountFiltered = this.walletService.filterAccountInfo(element.name);
        if (accountFiltered && accountFiltered.accountInfo) {
          if (!this.isMultisign(element)) {
            this.currentAccounts.push({
              label: element.name,
              value: element
            })
          }
        }
      }
    }
  }
  isMultisign(accounts: AccountsInterface): boolean {
    return Boolean(accounts.isMultisign !== null && accounts.isMultisign !== undefined && this.isMultisigValidate(accounts.isMultisign.minRemoval, accounts.isMultisign.minApproval));
  }
  /**
     * Checks if the account is a multisig account.
     * @returns {boolean}
     */
  isMultisigValidate(minRemoval: number, minApprova: number) {
    return minRemoval !== 0 && minApprova !== 0;
  }

  /**
  *
  *
  * @memberof ConvertAccountMultisignComponent
  */
  booksAddress() {
    const data = this.listContact.slice(0);
    const bookAddress = this.serviceModuleService.getBooksAddress();
    this.listContact = [];
    if (bookAddress !== undefined && bookAddress !== null) {
      for (let x of bookAddress) {
        data.push(x);
      }
      this.listContact = data;
    }
  }



  selectAccount($event: Event) {
    console.log("Event")
    this.mdbBtnAddCosignatory = true;
    this.clearData();
    const account: any = $event;
    if (account !== null && account !== undefined) {
      this.currentAccountToConvert = account.value;
      this.subscribeAccount = this.walletService.getAccountsInfo$().subscribe(
        async accountInfo => {
          console.log('accountInfo')


          this.validateAccount(account.value.name)
        });
    }
  }
  validateAccount(name: string) {
    this.accountInfo = this.walletService.filterAccountInfo(name);
    this.accountValid = (
      this.accountInfo !== null &&
      this.accountInfo !== undefined && this.accountInfo.accountInfo !== null);
    if (this.subscribeAccount) {
      console.log("unsubscribe")
      this.subscribeAccount.unsubscribe();
    }
    //Validate Account 
    if (!this.accountValid)
      return this.sharedService.showError('Attention', 'Account to convert is not valid');
    console.log(this.accountInfo)

    //Validate Multisign 
    this.isMultisig = (this.accountInfo.multisigInfo !== null && this.accountInfo.multisigInfo !== undefined && this.accountInfo.multisigInfo.isMultisig());
    if (this.isMultisig)
      return this.sharedService.showError('Attention', 'Is Multisig');

    //Validate Balance
    if (!this.accountInfo.accountInfo.mosaics.find(next => next.id.toHex() === environment.mosaicXpxInfo.id))
      return this.sharedService.showError('Attention', 'Insufficient balance');
    this.publicAccountToConvert = PublicAccount.createFromPublicKey(this.currentAccountToConvert.publicAccount.publicKey, this.currentAccountToConvert.network)
    this.mdbBtnAddCosignatory = false;
  }

  /**
*
*
* @memberof CreateMultiSignatureComponent
*/
  convertIntoMultisigTransaction() {
    this.blockSend = true;
    let common: any = { password: this.convertAccountMultsignForm.get("password").value };
    let accountDecrypt: AccountsInterface;
    accountDecrypt = this.currentAccountToConvert
    if (this.walletService.decrypt(common, accountDecrypt)) {
      if (this.convertAccountMultsignForm.valid && this.cosignatoryList.length > 0 && !this.ban) {
        this.ban = true;
        this.accountToConvertSign = Account.createFromPrivateKey(common.privateKey, accountDecrypt.network)

        let convertIntoMultisigTransaction: ModifyMultisigAccountTransaction;
        convertIntoMultisigTransaction = ModifyMultisigAccountTransaction.create(
          Deadline.create(),
          this.convertAccountMultsignForm.get('minApprovalDelta').value,
          this.convertAccountMultsignForm.get('minRemovalDelta').value,
          this.multisigCosignatoryModification(this.getCosignatoryList()),
          this.currentAccountToConvert.network);
        console.log('convertIntoMultisigTransaction', convertIntoMultisigTransaction)

        /**
         * Create Bonded
         */
        const aggregateTransaction = AggregateTransaction.createBonded(
          Deadline.create(),
          [convertIntoMultisigTransaction.toAggregate(this.currentAccountToConvert.publicAccount)],
          this.currentAccountToConvert.network);
        const signedTransaction = this.accountToConvertSign.sign(aggregateTransaction)

        // /**
        // * Create Hash lock transaction
        // */
        const hashLockTransaction = HashLockTransaction.create(
          Deadline.create(),
          new Mosaic(new MosaicId(environment.mosaicXpxInfo.id), UInt64.fromUint(Number(10000000))),
          UInt64.fromUint(480),
          signedTransaction,
          this.currentAccountToConvert.network);
        this.hashLock(this.accountToConvertSign.sign(hashLockTransaction), signedTransaction)
      }
    } else {
      this.blockSend = false;
    }
  }
  /**
     * Before sending an aggregate bonded transaction, the future 
     * multisig account needs to lock at least 10 cat.currency.
     * This transaction is required to prevent network spamming and ensure that the inner
     * transactions are cosigned. After the hash lock transaction has been confirmed,
     * announce the aggregate transaction.
     *
     * @memberof CreateMultiSignatureComponent
     * @param {SignedTransaction} hashLockTransactionSigned  - Hash lock funds transaction.
     * @param {SignedTransaction} signedTransaction  - Signed transaction of Bonded.
     */

  hashLock(hashLockTransactionSigned: SignedTransaction, signedTransaction: SignedTransaction) {
    this.transactionHttp
      .announce(hashLockTransactionSigned)
      .subscribe(
        async () => {
          this.getTransactionStatushashLock(hashLockTransactionSigned, signedTransaction)
          // this.blockSend = false;
        },
        err => {
          this.ban = false;
          this.blockSend = false;
          this.btnBlock = true;
          this.sharedService.showError('', err);
          // this.blockSend = false;
        });

  }

  /**
 *
 *
 * @memberof CreateMultiSignatureComponent
 *  @param {SignedTransaction} signedTransaction  - Signed transaction.
 */
  getTransactionStatushashLock(signedTransactionHashLock: SignedTransaction, signedTransactionBonded: SignedTransaction) {
    // Get transaction status
    this.subscribe['transactionStatus'] = this.dataBridge.getTransactionStatus().subscribe(
      statusTransaction => {
        // //  this.blockSend = false;
        if (statusTransaction !== null && statusTransaction !== undefined && signedTransactionHashLock !== null) {
          const statusTransactionHash = (statusTransaction['type'] === 'error') ? statusTransaction['data'].hash : statusTransaction['data'].transactionInfo.hash;
          const match = statusTransactionHash === signedTransactionHashLock.hash;
          if (statusTransaction['type'] === 'confirmed' && match) {
            this.announceAggregateBonded(signedTransactionBonded)
            signedTransactionHashLock = null;
            this.sharedService.showSuccess('', 'Transaction confirmed hash Lock');
          } else if (statusTransaction['type'] === 'unconfirmed' && match) {
            // signedTransactionHashLock = null;
            this.sharedService.showInfo('', 'Transaction unconfirmed hash Lock');
          } else if (match) {
            this.blockSend = false;
            this.ban = false;
            this.btnBlock = true;
            signedTransactionHashLock = null;
            this.sharedService.showWarning('', statusTransaction['data'].status.split('_').join(' '));
          }
        }
      }
    );
  }
  /**
  *
  *
  * @memberof CreateMultiSignatureComponent
  *  @param {SignedTransaction} signedTransaction  - Signed transaction.
  */
  announceAggregateBonded(signedTransaction: SignedTransaction) {
    this.clearData();
    this.clearForm();
    this.transactionHttp.announceAggregateBonded(signedTransaction).subscribe(
      async () => {
        this.getTransactionStatus(signedTransaction)
        this.blockSend = false;
        this.btnBlock = true;
        this.ban = false;
      },
      err => {
        this.sharedService.showError('', err);
        this.ban = false;
        this.blockSend = false;
        this.btnBlock = true;
      });

  }
  /**
  *
  *
  * @memberof CreateMultiSignatureComponent
  *  @param {SignedTransaction} signedTransaction  - Signed transaction.
  */
  getTransactionStatus(signedTransaction: SignedTransaction) {
    // Get transaction status
    this.subscribe['transactionStatus'] = this.dataBridge.getTransactionStatus().subscribe(
      statusTransaction => {
        // this.blockSend = false;
        if (statusTransaction !== null && statusTransaction !== undefined && signedTransaction !== null) {
          const statusTransactionHash = (statusTransaction['type'] === 'error') ? statusTransaction['data'].hash : statusTransaction['data'].transactionInfo.hash;
          const match = statusTransactionHash === signedTransaction.hash;
          if (statusTransaction['type'] === 'confirmed' && match) {
            signedTransaction = null;
            this.sharedService.showSuccess('', 'Transaction confirmed');
          } else if (statusTransaction['type'] === 'unconfirmed' && match) {
            this.transactionService.searchAccountsInfo([this.currentAccountToConvert])
            signedTransaction = null;
            this.sharedService.showInfo('', 'Transaction unconfirmed');
          } else if (match) {
            signedTransaction = null;
            this.sharedService.showWarning('', statusTransaction['data'].status.split('_').join(' '));
          }
        }
      }
    );
  }



  /**
     * With a multisig cosignatory modification a cosignatory is added to or deleted from a multisig account.
     *
     * @memberof CreateMultiSignatureComponent
     * @param {CosignatoryList}  cosignatoryList  - Cosignatory list.
     * @param {MultisigCosignatoryModificationType} type  - type modification.
     */
  multisigCosignatoryModification(cosignatoryList: CosignatoryList[]): MultisigCosignatoryModification[] {
    const cosignatory = []
    console.log(cosignatoryList)
    if (cosignatoryList.length > 0) {
      for (let index = 0; index < cosignatoryList.length; index++) {
        cosignatory.push(
          new MultisigCosignatoryModification(
            MultisigCosignatoryModificationType.Add,
            cosignatoryList[index].publicAccount,
          )
        )
      }
    }
    return cosignatory
  }
  /**
  *
  *
  * @param {*} event
  * @memberof CreateMultiSignatureComponent
  */
  async selectContact(event: { label: string, value: string }) {
    if (event !== undefined && event.value !== '') {
      this.searchContact = true;
      this.convertAccountMultsignForm.get('cosignatory').patchValue('', { emitEvent: false, onlySelf: true });
      this.proximaxProvider.getAccountInfo(Address.createFromRawAddress(event.value)).subscribe((res: AccountInfo) => {
        this.searchContact = false;
        if (res.publicKeyHeight.toHex() === '0000000000000000') {
          this.sharedService.showWarning('', 'you need a public key');
          this.convertAccountMultsignForm.get('contact').patchValue('', { emitEvent: false, onlySelf: true });
          this.convertAccountMultsignForm.get('contact').patchValue('', { emitEvent: false, onlySelf: true });
          // this.showContacts = false;
        } else {
          this.convertAccountMultsignForm.get('cosignatory').patchValue(res.publicKey, { emitEvent: true })
          this.convertAccountMultsignForm.get('contact').patchValue('', { emitEvent: false, onlySelf: true });
        }
      }, err => {
        this.convertAccountMultsignForm.get('contact').patchValue('', { emitEvent: false, onlySelf: true });
        this.searchContact = false;
        this.sharedService.showWarning('', 'Address is not valid');
      })
    }
  }

  /**
   *
   *
   * @param {(string | (string | number)[])} [custom]
   * @param {(string | number)} [formControl]
   * @returns
   * @memberof CreateTransferComponent
   */
  clearForm(custom?: string | (string | number)[], formControl?: string | number) {
    this.showContacts = false;
    this.mdbBtnAddCosignatory = true;
    this.isMultisig = false;
    this.publicAccountToConvert = undefined;
    this.cosignatoryList = [];
    if (custom !== undefined) {
      if (formControl !== undefined) {
        this.convertAccountMultsignForm.controls[formControl].get(custom).reset();
        return;
      }
      this.convertAccountMultsignForm.get(custom).reset();
      return;
    }
    this.convertAccountMultsignForm.reset();
    return;
  }
  /**
*
*
* @memberof CreateMultiSignatureComponent
*/
  clearData() {
    // this.createMultsignForm.get('selectAccount').patchValue('');
    this.convertAccountMultsignForm.get('cosignatory').patchValue('', { emitEvent: false, onlySelf: true });
    this.convertAccountMultsignForm.get('contact').patchValue('', { emitEvent: false, onlySelf: true });
    this.convertAccountMultsignForm.get('minApprovalDelta').patchValue(1, { emitEvent: false, onlySelf: true });
    this.convertAccountMultsignForm.get('minRemovalDelta').patchValue(1, { emitEvent: false, onlySelf: true });
    this.publicAccountToConvert = undefined;
    this.isMultisig = false;
    this.cosignatoryList = [];
    this.showContacts = false;
    this.mdbBtnAddCosignatory = true;
    this.minApprovaMaxLength = 1;
  }

  addCosignatory() {
    if (this.convertAccountMultsignForm.get('cosignatory').valid && this.convertAccountMultsignForm.get('cosignatory').value != '') {
      this.showContacts = false;
      const cosignatory: PublicAccount = PublicAccount.createFromPublicKey(
        this.convertAccountMultsignForm.get('cosignatory').value,
        this.walletService.currentAccount.network
      );
      // Cosignatory needs a public key
      // if (!this.cosignatoryPubKey) return this._Alert.cosignatoryhasNoPubKey();

      // Multisig cannot be cosignatory
      if (this.publicAccountToConvert.address.plain() === cosignatory.address.plain())
        return this.sharedService.showError('Attention', 'A multisig account cannot be set as cosignatory');
      // Check presence in cosignatory List array
      if (!Boolean(this.cosignatoryList.find(item => { return item.publicAccount.address.plain() === cosignatory.address.plain() }))) {
        this.btnblckfun()
        this.cosignatoryList.push({ publicAccount: cosignatory, action: 'Add', type: 1, disableItem: false, id: cosignatory.address });
        this.setCosignatoryList(this.cosignatoryList);
        this.convertAccountMultsignForm.get('cosignatory').patchValue('');
      } else {
        this.sharedService.showError('Attention', 'Cosignatory is already present in modification list');
      }
    }
  }

  changeformStatus() {
    this.convertAccountMultsignForm.statusChanges.subscribe(res => {
      this.btnblckfun()
    }
    );
  }

  btnblckfun() {
    console.log('this.convertAccountMultsignForm.valid', this.convertAccountMultsignForm.valid)
    console.log('this.cosignatoryList.length', this.cosignatoryList.length)
    this.btnBlock = true;
    if (this.convertAccountMultsignForm.valid && this.cosignatoryList.length > 0) {
      this.btnBlock = false;
    }
  }
  /**
  * Delete cosignatory to the cosignatory List
  * @memberof CreateMultiSignatureComponent
  * @param id  - Address in cosignatory.
  */
  deleteCosignatory(id: Address, disableItem: boolean, type: number) {
    const cosignatoryList = this.cosignatoryList.filter(item => item.id.plain() !== id.plain())
    this.setCosignatoryList(cosignatoryList);
    this.btnblckfun()
  }

  /**
  * Set cosignatory list
  * @memberof CreateMultiSignatureComponent
  * @param {CosignatoryList} [cosignatoryListParam] - list cosignatory
  */
  setCosignatoryList(cosignatoryListParam: CosignatoryList[]) {
    this.cosignatoryList = cosignatoryListParam;
    this.validatorsMinApprovalDelta();
    this.validatorsMinRemovalDelta();

  }
  /**
   * Get cosignatory list add and remove 
   * @memberof CreateMultiSignatureComponent
   * @return {CosignatoryList} list cosignatory
   */
  getCosignatoryList(): CosignatoryList[] {
    return this.cosignatoryList;

  }


  /**
* Change the form validator (minApprovalDelta)
* @memberof CreateMultiSignatureComponent
*/
  validatorsMinApprovalDelta() {
    console.log(this.getCosignatoryList().length)
    const validators = [Validators.required,
    Validators.minLength(1),
    Validators.maxLength(this.getCosignatoryList().length)];
    this.minApprovaMaxLength = 1;
    this.minApprovaMaxLength = this.getCosignatoryList().length
    if (this.getCosignatoryList().length > 0) {
      this.convertAccountMultsignForm.get('minApprovalDelta').patchValue(this.getCosignatoryList().length, { emitEvent: false, onlySelf: true })
    } else {
      this.convertAccountMultsignForm.get('minApprovalDelta').patchValue(1, { emitEvent: false, onlySelf: true })
    }
    this.convertAccountMultsignForm.controls['minApprovalDelta'].setValidators(validators);
    this.convertAccountMultsignForm.controls['minApprovalDelta'].updateValueAndValidity({ emitEvent: false, onlySelf: true });
  }

  /**
  * Change the form validator (minRemovalDelta)
  * @memberof CreateMultiSignatureComponent
  */
  validatorsMinRemovalDelta() {
    const validators = [Validators.required,
    Validators.minLength(1),
    Validators.maxLength(this.getCosignatoryList().length)];
    this.minApprovaMaxLength = 1;
    this.minApprovaMaxLength = this.getCosignatoryList().length
    if (this.getCosignatoryList().length > 0) {
      this.convertAccountMultsignForm.get('minRemovalDelta').patchValue(this.getCosignatoryList().length, { emitEvent: false, onlySelf: true })
    } else {
      this.convertAccountMultsignForm.get('minRemovalDelta').patchValue(1, { emitEvent: false, onlySelf: true })
    }
    this.convertAccountMultsignForm.controls['minRemovalDelta'].setValidators(validators);
    this.convertAccountMultsignForm.controls['minRemovalDelta'].updateValueAndValidity({ emitEvent: false, onlySelf: true });

  }

  /**
  *
  *
  * @memberof CreateNamespaceComponent
  * 
  */
  subscribeValueChange() {
    // Cosignatory ValueChange
    this.convertAccountMultsignForm.get('cosignatory').valueChanges.subscribe(
      next => {
        if (next !== null && next !== undefined) {

        }
        this.validatorsCosignatory()
      }
    );
  }


  /**
  * Change the form validator (cosignatory)
  * @memberof CreateMultiSignatureComponent
  */
  validatorsCosignatory() {
    const validators = [
      Validators.required,
      Validators.minLength(this.configurationForm.publicKey.minLength),
      Validators.maxLength(this.configurationForm.publicKey.maxLength),
      Validators.pattern('^(0x|0X)?[a-fA-F0-9]+$')];
    if (this.cosignatoryList.length > 0 && (this.convertAccountMultsignForm.get('cosignatory').value === null
      || this.convertAccountMultsignForm.get('cosignatory').value === undefined
      || this.convertAccountMultsignForm.get('cosignatory').value === '')) {
      this.convertAccountMultsignForm.controls['cosignatory'].setValidators(null);
    } else {
      this.convertAccountMultsignForm.controls['cosignatory'].setValidators(validators);
    }
    this.convertAccountMultsignForm.controls['cosignatory'].updateValueAndValidity({ emitEvent: false });
  }



}
/**
 * cosignatory List
 * @param publicAccount
 * @param action - event (Add or delete)
 * @param type - 1 = Add , 2 = remove , 3 = view
 * @param disableItem - Disable item list
 * @param id - Address in cosignatory
*/
export interface CosignatoryList {
  publicAccount: PublicAccount;
  action: string;
  type: number,
  disableItem: boolean;
  id: Address;
}
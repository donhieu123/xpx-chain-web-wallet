import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl
} from "@angular/forms";
import { WalletService, SharedService } from "../../../shared";
import { TransactionsService } from "../../../transactions/service/transactions.service";
import { ServiceModuleService } from "../../../servicesModule/services/service-module.service";
import { MosaicService } from "../../../servicesModule/services/mosaic.service";
import { NamespaceName } from "proximax-nem2-sdk";
import { ProximaxProvider } from "../../../shared/services/proximax.provider";

@Component({
  selector: "app-transfer",
  templateUrl: "./transfer.component.html",
  styleUrls: ["./transfer.component.scss"]
})
export class TransferComponent implements OnInit {
  searchMosaics = true;
  showContacts = false;
  inputBLocked: boolean;
  contacts = [];
  transferForm: FormGroup;
  contactForm: FormGroup;
  transferIsSend = false;
  mosaicsSelect: any = [
    {
      value: "0",
      label: "Select mosaic",
      selected: true,
      disabled: true
    },
    {
      value: this.proximaxProvider.mosaicXpx.mosaic,
      label: this.proximaxProvider.mosaicXpx.mosaic,
      selected: false,
      disabled: false
    }
  ];

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService,
    private sharedService: SharedService,
    private transactionService: TransactionsService,
    private ServiceModuleService: ServiceModuleService,
    private mosaicServices: MosaicService,
    private proximaxProvider: ProximaxProvider
  ) { }

  ngOnInit() {
    this.contacts = this.ServiceModuleService.getBooksAddress();
    this.createForm();
    this.createFormContact();
    this.getMosaics();
  }

  /**
   * Create form send transfer
   *
   * @memberof TransferComponent
   */
  createForm() {
    this.transferForm = this.fb.group({
      mosaicsSelect: [
        this.proximaxProvider.mosaicXpx.mosaic,
        [Validators.required]
      ],
      acountRecipient: [
        null,
        [
          Validators.required,
          Validators.minLength(40),
          Validators.maxLength(46)
        ]
      ],
      amount: [null, [Validators.maxLength(20)]],
      message: ["", [Validators.maxLength(80)]],
      password: [
        null,
        [Validators.required, Validators.minLength(8), Validators.maxLength(30)]
      ]
    });
  }

  /**
   * Create form contact
   *
   * @memberof TransferComponent
   */
  createFormContact() {
    this.contactForm = this.fb.group({
      user: [
        null,
        [Validators.required, Validators.minLength(2), Validators.maxLength(30)]
      ],
      address: [
        null,
        [
          Validators.required,
          Validators.minLength(46),
          Validators.maxLength(46)
        ]
      ]
    });
  }

  /**
   * Clean form
   *
   * @param {(string | (string | number)[])} [custom]
   * @param {(string | number)} [formControl]
   * @returns
   * @memberof TransferComponent
   */
  cleanForm(
    custom?: string | (string | number)[],
    formControl?: string | number
  ) {
    if (custom !== undefined) {
      if (formControl !== undefined) {
        this.transferForm.controls[formControl].get(custom).reset();
        return;
      }
      this.transferForm.get(custom).reset();
      return;
    }
    this.transferForm.reset();
    return;
  }

  /**
   * Get mosaics name
   *
   * @memberof TransferComponent
   */
  async getMosaics() {
    const mosaicsSelect = this.mosaicsSelect.slice(0);
    console.log(mosaicsSelect);
    const response: any = await this.mosaicServices.getMosaicFromAddress(
      this.walletService.address,
      false
    );
    console.log("Response mosaics", response);
    if (response && response.mosaicsName) {
      for (let mosaicsName of response.mosaicsName) {
        const namespaceName = response.namespaceName.find(function (
          namespaceName: NamespaceName
        ) {
          return (
            namespaceName.namespaceId.toHex() ===
            mosaicsName.namespaceId.toHex()
          );
        });

        mosaicsSelect.push({
          label: `${namespaceName.name}:${mosaicsName.name}`,
          value: `${namespaceName.name}:${mosaicsName.name}`,
          selected: false,
          disabled: false
        });
      }
    }

    this.searchMosaics = false;
    this.mosaicsSelect = mosaicsSelect;
  }

  /**
   * Gets errors
   *
   * @param {(string | (string | number)[])} control
   * @param {*} [typeForm]
   * @param {(string | number)} [formControl]
   * @returns
   * @memberof TransferComponent
   */
  getError(
    control: string | (string | number)[],
    typeForm?: any,
    formControl?: string | number
  ) {
    const form = typeForm === undefined ? this.transferForm : this.contactForm;
    if (formControl === undefined) {
      if (form.get(control).getError("required")) {
        return `This field is required`;
      } else if (form.get(control).getError("minlength")) {
        return `This field must contain minimum ${
          form.get(control).getError("minlength").requiredLength
          } characters`;
      } else if (form.get(control).getError("maxlength")) {
        return `This field must contain maximum ${
          form.get(control).getError("maxlength").requiredLength
          } characters`;
      }
    } else {
      if (form.controls[formControl].get(control).getError("required")) {
        return `This field is required`;
      } else if (
        form.controls[formControl].get(control).getError("minlength")
      ) {
        return `This field must contain minimum ${
          form.controls[formControl].get(control).getError("minlength")
            .requiredLength
          } characters`;
      } else if (
        form.controls[formControl].get(control).getError("maxlength")
      ) {
        return `This field must contain maximum ${
          form.controls[formControl].get(control).getError("maxlength")
            .requiredLength
          } characters`;
      } else if (form.controls[formControl].getError("noMatch")) {
        return `Password doesn't match`;
      }
    }
  }

  /**
   * Send a transfer transaction
   *
   * @memberof TransferComponent
   */
  sendTransfer() {
    if (this.transferForm.invalid) {
      this.validateAllFormFields(this.transferForm);
      this.inputBLocked = false;
    } else {
      this.inputBLocked = true;
      const acountRecipient = this.transferForm.get("acountRecipient").value;
      const amount = this.transferForm.get("amount").value;
      const message =
        this.transferForm.get("message").value === null
          ? ""
          : this.transferForm.get("message").value;
      const password = this.transferForm.get("password").value;
      const node = this.transferForm.get("mosaicsSelect").value;
      console.log(message);
      const common = { password: password };
      if (this.walletService.decrypt(common)) {
        const rspBuildSend = this.transactionService.buildToSendTransfer(
          common,
          acountRecipient,
          message,
          amount,
          this.walletService.network,
          node
        );
        rspBuildSend.transactionHttp
          .announce(rspBuildSend.signedTransaction)
          .subscribe(
            rsp => {
              this.showContacts = false;
              this.inputBLocked = false;
              this.sharedService.showSuccess(
                "Congratulations!",
                "Transaction sent"
              );
              this.cleanForm();
            },
            err => {
              this.inputBLocked = false;
              this.cleanForm();
              this.sharedService.showError("Error", err);
              console.error(err);
            }
          );
      }
    }
  }

  /**
   * Save contact
   *
   * @returns
   * @memberof TransferComponent
   */
  saveContact() {
    if (this.contactForm.valid) {
      const dataStorage = this.ServiceModuleService.getBooksAddress();
      const books = {
        value: this.contactForm.get("address").value,
        label: this.contactForm.get("user").value
      };
      if (dataStorage === null) {
        this.ServiceModuleService.setBookAddress([books]);
        this.contactForm.reset();
        this.sharedService.showSuccess("", `Successfully created user`);
        this.contacts = this.ServiceModuleService.getBooksAddress();
        return;
      }

      const issetData = dataStorage.find(
        (element: { label: any }) =>
          element.label === this.contactForm.get("user").value
      );
      if (issetData === undefined) {
        dataStorage.push(books);
        this.ServiceModuleService.setBookAddress(dataStorage);
        this.contactForm.reset();
        this.sharedService.showSuccess("", `Successfully created contact`);
        this.contacts = this.ServiceModuleService.getBooksAddress();
        return;
      }

      this.sharedService.showError(
        "User repeated",
        `The contact "${this.contactForm.get("user").value}" already exists`
      );
    }
  }

  /**
   * Options selected
   *
   * @param {{ value: any; }} event
   * @memberof TransferComponent
   */
  optionSelected(event: { value: any }) {
    console.log(event);
    this.transferForm.get("acountRecipient").patchValue(event.value);
  }

  /**
   *
   *
   * @param {FormGroup} formGroup
   * @memberof TransferComponent
   */
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { WalletService } from '../../../../wallet/services/wallet.service';
import { HeaderServicesInterface, ServicesModuleService } from '../../../../servicesModule/services/services-module.service';
import { AppConfig } from '../../../../config/app.config';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-export-wallet',
  templateUrl: './export-wallet.component.html',
  styleUrls: ['./export-wallet.component.css']
})
export class ExportWalletComponent implements OnInit {

  title: string;
  description: string;
  wallets: Array<any>;

  paramsHeader: HeaderServicesInterface = {
    moduleName: 'Wallet',
    componentName: 'Export Wallet',
    extraButton: 'Delete Wallet',
    routerExtraButton: `/${AppConfig.routes.deleteWallet}`
  };

  constructor(
    private walletService: WalletService
  ) { }

  ngOnInit() {
    this.title = 'Export Wallet';
    this.description = 'Select the wallet you want to export';
    this.wallets = this.walletService.getWalletStorage();
    // console.log(this.wallets);

  }

  exportWallet(wallet) {
    let wordArray = CryptoJS.enc.Utf8.parse(JSON.stringify(wallet));
    let file = CryptoJS.enc.Base64.stringify(wordArray);
    // Word array to base64
    // let other = CryptoJS.enc.Base64.parse(file);
    // // Word array to JSON string
    // console.log('This is resp descryp---------------------------->', JSON.parse(other.toString(CryptoJS.enc.Utf8)));
    const now = Date.now()
    const date = new Date(now);
    const year = date.getFullYear();
    const month = ((date.getMonth() + 1) < 10) ? `0${(date.getMonth() + 1)}` : date.getMonth() + 1;
    const day = (date.getDate() < 10) ? `0${date.getDate()}` : date.getDate();

    const blob = new Blob([file], { type: '' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // the filename you want
    let networkTypeName = environment.typeNetwork.label
    networkTypeName = (networkTypeName.includes(' ')) ? networkTypeName.split(' ').join('') : networkTypeName;
    a.download = `${wallet.name}_${networkTypeName}_${year}-${month}-${day}.wlt`;
    // a.download = `${wallet.name}.wlt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

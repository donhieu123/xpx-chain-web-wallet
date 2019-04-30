import { Component, OnInit, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { MdbTableService, MdbTablePaginationComponent } from 'ng-uikit-pro-standard';
import { first } from "rxjs/operators";
import { ProximaxProvider } from "../../../shared/services/proximax.provider";
import { WalletService } from "../../../shared";

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']

})
export class TransactionsComponent implements OnInit {
  previous: any;

  firstItemIndex: number;
  lastItemIndex: number;
  items: any;
  elements: any = [];
  searchText: string;
  dataSelected: any;
  headElements = ['Account', 'Amount', 'Mosaic', 'Date'];
  @ViewChild(MdbTablePaginationComponent) mdbTablePagination: MdbTablePaginationComponent;

  constructor(
    private tableService: MdbTableService,
    private cdRef: ChangeDetectorRef,
    private proximaxProvider: ProximaxProvider,
    private walletService: WalletService
  ) {
  }

  @HostListener('input') oninput() {
    this.mdbTablePagination.searchText = this.searchText;
  }

  ngAfterViewInit() {
    this.mdbTablePagination.setMaxVisibleItemsNumberTo(5);
    this.firstItemIndex = this.mdbTablePagination.firstItemIndex;
    this.lastItemIndex = this.mdbTablePagination.lastItemIndex;

    this.mdbTablePagination.calculateFirstItemIndex();
    this.mdbTablePagination.calculateLastItemIndex();
    this.cdRef.detectChanges();
  }

  ngOnInit() {
    this.getAllTransactions();
  }

  getAllTransactions() {
    this.proximaxProvider.getAllTransactionsFromAccount(this.walletService.publicAccount, this.walletService.network).pipe(first()).subscribe(
      trans => {
        trans.forEach(element => {
          const date = `${element.deadline.value.monthValue()}/${element.deadline.value.dayOfMonth()}/${element.deadline.value.year()}`;
          this.elements.push({
            address: element.signer.address['address'],
            amount: element['mosaics'][0].amount.compact(),
            message: element['message'],
            transactionInfo: element.transactionInfo,
            fee: element.fee.compact(),
            mosaic: 'xpx',
            date: date,
            recipient: element['recipient'],
            signer: element.signer
          });
        });

        this.tableService.setDataSource(this.elements);
        this.elements = this.tableService.getDataSource();
        this.previous = this.tableService.getDataSource();
      },
      error => {
        console.error(error);
      });
  }

  onNextPageClick(event: any) {

  }

  onPreviousPageClick(event: any) {

  }
}

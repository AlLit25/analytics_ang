import {Component, signal} from '@angular/core';
import { Balance } from '../screen/balance/balance';
import { Detail } from '../screen/detail/detail';
import { Verify } from '../screen/verify/verify';
import { AddTransaction } from '../screen/add-transaction/add-transaction';

@Component({
  selector: 'app-main',
  imports: [Balance, Detail, AddTransaction, Verify],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  protected activeTab = signal<string>('balances');

  setTab(tabName: string) {
    this.activeTab.set(tabName);
  }
}

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService, BalanceItem } from '../../../services/supabase';
import {config} from 'rxjs';

@Component({
  selector: 'app-verify',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify implements OnInit {
  protected supabaseService = inject(SupabaseService);
  protected type = signal<'UAH' | 'USD'>('UAH');
  protected usdBalance = signal<number>(0.0);
  protected uahBalanceDB = signal<number>(0.0);
  protected totalId:number = 0;
  protected isSubmittingUsd = signal<boolean>(false);
  protected allBalances: BalanceItem[] = [];
  protected isSubmittingAllBalances = signal<boolean>(false);
  protected hasChanges(): boolean {
    return this.allBalances.some(item => item.uah !== item.originalUah);
  }
  protected getUahBalanceActual(): number {
    return this.allBalances.reduce((sum, item) => sum + Number(item.uah || 0), 0);
  }
  protected successMessage = signal<boolean>(false);

  ngOnInit() {
    this.loadCurrentBalance();
  }

  protected setType(newType: 'UAH' | 'USD') {
    this.type.set(newType);
  }

  private async loadCurrentBalance() {
    try {
      const data = await this.supabaseService.getBalance(false);
      const tempBalances: BalanceItem[] = [];

      if (data && data.length > 0) {
        data.forEach((item) => {
          if (item.type === 'total') {
            this.totalId = item.id;
            this.usdBalance.set(Number(item.usd));
            this.uahBalanceDB.set(Number(item.uah));
          }
          else {
            tempBalances.push({
              ...item,
              originalUah: Number(item.uah || 0)
            });
          }
        });

        this.allBalances = tempBalances.sort((a, b) => {
          if (a.id < b.id) return -1;
          if (a.id > b.id) return 1;
          return 0;
        });
      }
    } catch (error) {
      console.error('Помилка при завантаженні балансу:', error);
    }
  }

  protected isChanged(item: BalanceItem): boolean {
    return item.uah !== item.originalUah;
  }

  async onSubmitUsd() {
    if (confirm('Підтвердити оновлення балансу?')) {
      this.isSubmittingUsd.set(true);

      try {
        await this.supabaseService.updateUsd(this.usdBalance(), this.totalId);
      } catch (error) {
        console.error('Помилка при оновленні балансу:', error);
      } finally {
        this.successMessage.set(true);

        setTimeout(() => this.successMessage.set(false), 3000);
        this.isSubmittingUsd.set(false);
      }
    }
  }

  async onSubmitAllBalances() {
    if (confirm('Підтвердити оновлення балансу?')) {
      this.isSubmittingAllBalances.set(true);

      try {
        const updatePromises = this.allBalances
          .filter(item => item.uah !== item.originalUah)
          .map(item => this.supabaseService.updateUah(item.uah, item.id));

        updatePromises.push(
          this.supabaseService.updateUah(this.getUahBalanceActual(), this.totalId)
        );

        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Помилка при оновленні:', error);
      } finally {
        this.successMessage.set(true);

        setTimeout(() => this.successMessage.set(false), 3000);
        this.isSubmittingAllBalances.set(false);
      }
    }
  }

  formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '';
    }

    return Number(value).toLocaleString('uk-UA');
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../../../services/supabase';

@Component({
  selector: 'app-balance',
  imports: [],
  templateUrl: './balance.html',
  styleUrl: './balance.css',
})
export class Balance implements OnInit {
  public supabaseService = inject(SupabaseService);
  protected balances = signal<any[]>([]);
  protected todayTransactions = signal<any[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  // 1. Сигнал для вкладки: за замовчуванням показуємо витрати
  protected activeTxType = signal<'expense' | 'income'>('expense');

  // 2. Автоматично відфільтрований список транзакцій
  protected filteredTransactions = computed(() => {
    return this.todayTransactions().filter(tx => tx.type === this.activeTxType());
  });

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      const today = new Date().toISOString().split('T')[0];
      // const today = '2026-06-25';

      const [balanceData, transactionsData] = await Promise.all([
        this.supabaseService.getBalance(true),
        this.supabaseService.getTransactions(today)
      ]);

      this.balances.set(balanceData || []);
      this.todayTransactions.set(transactionsData || []);
    } catch (error: any) {
      this.errorMessage.set('Не вдалося завантажити дані.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Метод для перемикання типу
  protected setTxType(type: 'expense' | 'income') {
    this.activeTxType.set(type);
  }
}

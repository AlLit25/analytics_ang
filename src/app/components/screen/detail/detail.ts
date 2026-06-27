import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SupabaseService } from '../../../services/supabase';

interface GroupedCategory {
  code: string;
  name: string;
  sum: number;
  percentage: number;
}

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './detail.html',
  styleUrl: './detail.css'
})
export class Detail implements OnInit {
  protected supabaseService = inject(SupabaseService);
  protected fromDate = signal<string>('');
  protected toDate = signal<string>('');
  protected transactions = signal<any[]>([]);
  protected isLoading = signal<boolean>(false);
  protected activeType = signal<'expense' | 'income'>('expense');

  ngOnInit() {
    this.setDefaultDates();
    this.loadData();
  }

  private setDefaultDates() {
    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.fromDate.set(this.formatDate(firstDay));
    this.toDate.set(this.formatDate(lastDay));
  }

  private formatDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  async loadData() {
    if (!this.fromDate() || !this.toDate()) return;

    try {
      this.isLoading.set(true);
      const data = await this.supabaseService.getTransactions(this.fromDate(), this.toDate());
      this.transactions.set(data || []);
    } catch (error) {
      console.error('Помилка завантаження історії:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected totalExpense = computed(() => {
    return this.transactions()
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.sum), 0);
  });

  protected totalIncome = computed(() => {
    return this.transactions()
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.sum), 0);
  });

  protected groupedCategories = computed<GroupedCategory[]>(() => {
    const expenses = this.transactions().filter(tx => tx.type === 'expense');
    const total = this.totalExpense();

    if (total === 0) return [];

    const groups: { [key: string]: number } = {};
    expenses.forEach(tx => {
      groups[tx.category] = (groups[tx.category] || 0) + Number(tx.sum);
    });

    return Object.keys(groups)
      .map(code => {
        const sum = groups[code];
        return {
          code,
          name: this.supabaseService.category[code] || 'Інше',
          sum,
          percentage: Math.round((sum / total) * 100)
        };
      })
      .sort((a, b) => b.sum - a.sum);
  });

  protected incomeTransactions = computed(() => {
    return this.transactions()
      .filter(tx => tx.type === 'income')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { SupabaseService } from '../../../services/supabase';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [FormsModule, KeyValuePipe],
  templateUrl: './add-transaction.html',
  styleUrl: './add-transaction.css',
})
export class AddTransaction {
  protected supabaseService = inject(SupabaseService);

  protected date = signal<string>(new Date().toISOString().split('T')[0]);
  protected type = signal<'expense' | 'income'>('expense');
  protected category = signal<string>('pr');
  protected sum = signal<number | null>(null);
  protected comment = signal<string>('');
  protected isSubmitting = signal<boolean>(false);
  protected successMessage = signal<boolean>(false);

  protected setType(newType: 'expense' | 'income') {
    this.type.set(newType);
    if (newType === 'income') {
      this.category.set('');
    } else {
      this.category.set('pr');
    }
  }

  async onSubmit() {
    if (!this.sum() || this.sum()! <= 0) {
      alert('Будь ласка, введіть коректну суму');
      return;
    }

    try {
      this.isSubmitting.set(true);
      this.successMessage.set(false);

      // 1. Готуємо значення локально
      const txDate = this.date();
      const txType = this.type();
      const txSum = this.sum()!; // знак !, бо ми вже перевірили, що там не null
      const txCategory = this.type() === 'expense' ? this.category() : null;
      const txComment = this.comment().trim() || null;

      // 2. Викликаємо метод, передаючи параметри по черзі
      await this.supabaseService.insertRecord(
        txDate,
        txType,
        txSum,
        txCategory,
        txComment
      );

      // Успішно додано! Очищаємо поля
      this.sum.set(null);
      this.comment.set('');
      this.successMessage.set(true);

      setTimeout(() => this.successMessage.set(false), 3000);

    } catch (error) {
      console.error('Помилка при додаванні транзакції:', error);
      alert('Не вдалося зберегти транзакцію.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

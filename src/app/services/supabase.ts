import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {
  private supabaseUrl = 'https://vntunuzrneoakdckqjvk.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHVudXpybmVvYWtkY2txanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTI5NzEsImV4cCI6MjA2NzI4ODk3MX0.CWJIVqq-x5_doDk8rsl8ZJWP7um9VakuIDBihcfsrsU';
  private supabase: SupabaseClient;
  public currentUser = signal<User | null>(null);
  private balanceTable = 'fin_balance';
  private statisticsTable = 'fin_statistic';
  public category: { [key: string]: string } = {
    "pr": "Продукти",
    "cf": "Кафе",
    "cm": "Комунальні платежі",
    "md": "Аптека",
    "eva": "Eva/Makeup",
    "zoo": "Зоотовари",
    "cl": "Одяг",
    "usd": "Валюта",
    "ot": "Інше",
    "ch": "Благодійність",
  };

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.checkAutoLogin();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    localStorage.setItem('login_timestamp', Date.now().toString());
    this.currentUser.set(data.user);
    return data;
  }

  async signOut() {
    localStorage.removeItem('login_timestamp');
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
  }

  async checkAutoLogin() {
    const { data: { session } } = await this.supabase.auth.getSession();

    if (!session) {
      this.currentUser.set(null);
      return;
    }

    const loginTimestamp = localStorage.getItem('login_timestamp');
    const thirtyMinutes = 30 * 60 * 1000; // 30 хвилин у мілісекундах

    if (loginTimestamp && (Date.now() - parseInt(loginTimestamp)) > thirtyMinutes) {
      await this.signOut();
    } else {
      this.currentUser.set(session.user);
    }
  }

  async getBalance(total: boolean = true) {
    let query = this.supabase
      .from(this.balanceTable)
      .select('*');

    if (total) {
      query = query.eq('type', 'total');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async insertRecord(
    date: string,
    type: 'expense' | 'income',
    sum: number,
    category: string | null = null,
    comment: string | null = null
  ) {
    // 1. Отримуємо поточного залогіненого користувача
    const { data: { user }, error: authError } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Користувач не авторизований для виконання цієї операції');
    }

    // 2. Додаємо транзакцію, обов'язково вказавши user_id
    const { data: txData, error: txError } = await this.supabase
      .from(this.statisticsTable)
      .insert([
        {
          created_at: date,
          type: type,
          sum: sum,
          category: category,
          comment: comment,
          user_id: user.id // <--- Передаємо ID користувача в базу даних
        }
      ])
      .select();

    if (txError) {
      console.error('Помилка вставки транзакції:', txError);
      throw txError;
    }

    // 3. Оновлюємо баланс
    try {
      await this.updateBalanceAfterTransaction(type, sum);
    } catch (balanceError) {
      console.error('Транзакцію додано, але не вдалося оновити баланс:', balanceError);
      throw balanceError;
    }

    return txData;
  }

  private async updateBalanceAfterTransaction(type: 'expense' | 'income', sum: number) {
    const { data: balanceData, error: getError } = await this.supabase
      .from(this.balanceTable)
      .select('id, uah')
      .eq('type', 'total')
      .single();

    if (getError) throw getError;
    if (!balanceData) throw new Error('Запис балансу не знайдено в БД');

    const currentBalance = Number(balanceData.uah);
    const newBalance = type === 'income'
      ? currentBalance + sum
      : currentBalance - sum;

    const { error: updateError } = await this.supabase
      .from(this.balanceTable)
      .update({ uah: newBalance })
      .eq('id', balanceData.id);

    if (updateError) throw updateError;
  }

  async getTransactions(fromDate: string, toDate: string | null = null) {
    let query = this.supabase
      .from(this.statisticsTable)
      .select('*');

    if (toDate) {
      query = query
        .gte('created_at', fromDate)
        .lte('created_at', toDate);
    } else {
      query = query.eq('created_at', fromDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
}

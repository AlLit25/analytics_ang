import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class LoginComponent {
  protected supabaseService = inject(SupabaseService);

  // Поля форми
  protected email = '';
  protected password = '';

  protected errorMessage = signal<string | null>(null);
  protected isLoading = signal(false);

  async onSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.supabaseService.signIn(this.email, this.password);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Невірний логін або пароль');
    } finally {
      this.isLoading.set(false);
    }
  }
}

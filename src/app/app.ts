import { Component, inject, signal } from '@angular/core';
import { Header } from './components/header/header';
import { LoginComponent } from './components/login/login';
import { SupabaseService } from './services/supabase';
import {Main} from './components/main/main';

@Component({
  selector: 'app-root',
  imports: [Header, LoginComponent, Main],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected supabaseService = inject(SupabaseService);
}

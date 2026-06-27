import {Component, inject} from '@angular/core';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  protected supabaseService = inject(SupabaseService);
}

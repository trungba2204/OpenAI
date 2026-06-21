import { Component, inject, input, ViewEncapsulation } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-auth-layout',
  imports: [],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {
  theme = inject(ThemeService);
  title = input.required<string>();
  subtitle = input.required<string>();
}

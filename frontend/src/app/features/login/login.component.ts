import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  // Declared before the forms below: TypeScript emits field initializers in
  // declaration order, and constructor parameter properties are assigned
  // *after* them — so `this.fb` in a field initializer would otherwise be
  // read before it's set. inject() sidesteps that ordering issue entirely.
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly registerForm = this.fb.group({
    organizationName: ['', [Validators.required]],
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submitLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.errorMessage.set(null);
    this.loading.set(true);

    const { email, password } = this.loginForm.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Invalid email or password.');
      },
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.errorMessage.set(null);
    this.loading.set(true);

    const { organizationName, fullName, email, password } = this.registerForm.getRawValue();
    this.auth
      .register({ organizationName: organizationName!, fullName: fullName!, email: email!, password: password! })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.loading.set(false);
          const message = err?.error?.message ?? 'Could not create the organization. Please try again.';
          this.errorMessage.set(message);
        },
      });
  }
}

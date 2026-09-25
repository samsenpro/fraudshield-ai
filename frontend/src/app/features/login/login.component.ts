import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LanguageSwitchComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  // Declared before the forms below: TypeScript emits field initializers in
  // declaration order, and constructor parameter properties are assigned
  // *after* them — so `this.fb` in a field initializer would otherwise be
  // read before it's set. inject() sidesteps that ordering issue entirely.
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly mode = signal<Mode>('login');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

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

  ngOnInit(): void {
    document.title = `${this.i18n.t('titles.login')} · FraudShield AI`;
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.showPassword.set(false);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.loading.set(true);

    const { email, password } = this.loginForm.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          this.i18n.t(err?.status === 0 ? 'login.unreachable' : 'login.invalid'),
        );
      },
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
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
          const message = err?.error?.message ?? this.i18n.t('login.registerError');
          this.errorMessage.set(message);
        },
      });
  }

  invalid(form: 'login' | 'register', name: string): boolean {
    const control = form === 'login' ? this.loginForm.get(name) : this.registerForm.get(name);
    return !!control && control.invalid && control.touched;
  }
}

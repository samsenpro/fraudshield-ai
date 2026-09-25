import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './organizations.component.html',
  styleUrl: './organizations.component.scss',
})
export class OrganizationsComponent {
  constructor(readonly auth: AuthService) {}
}

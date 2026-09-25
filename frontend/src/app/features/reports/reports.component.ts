import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DEMO_REPORTS, ReportInfo } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { downloadFile, toCsv } from '../../core/ui/risk';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SegmentedComponent } from '../../shared/segmented/segmented.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';

const REPORT_TYPES = ['Fraud Summary', 'Compliance', 'Transaction Audit', 'Risk Assessment'];
const RANGES: Record<string, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  quarter: 'This quarter',
  ytd: 'Year to date',
};
const FORMATS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'XLSX', label: 'XLSX' },
  { value: 'CSV', label: 'CSV' },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    StatTileComponent,
    IconComponent,
    DialogComponent,
    SegmentedComponent,
    StatusBadgeComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly types = REPORT_TYPES;
  readonly ranges = Object.entries(RANGES).map(([value, label]) => ({ value, label }));
  readonly formats = FORMATS;

  readonly reports = signal<ReportInfo[]>(DEMO_REPORTS);
  readonly showDialog = signal(false);
  readonly newestId = signal<string | null>(null);

  readonly generatedCount = computed(() => 42 + (this.reports().length - DEMO_REPORTS.length));

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    type: [REPORT_TYPES[0], Validators.required],
    range: ['30d', Validators.required],
    format: ['PDF', Validators.required],
  });

  openDialog(): void {
    this.form.reset({ name: '', type: REPORT_TYPES[0], range: '30d', format: 'PDF' });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }

  setFormat(value: string): void {
    this.form.controls.format.setValue(value);
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, type, range, format } = this.form.getRawValue();
    const id = `r-${Date.now()}`;
    const report: ReportInfo = {
      id,
      name: name!.trim(),
      type: type!,
      range: RANGES[range!],
      generated: new Date().toISOString(),
      format: format as ReportInfo['format'],
      size: '—',
      status: 'GENERATING',
    };
    this.reports.update((list) => [report, ...list]);
    this.newestId.set(id);
    this.showDialog.set(false);

    // Generation runs server-side in production; here it settles after a short delay.
    setTimeout(() => {
      this.reports.update((list) =>
        list.map((r) => (r.id === id ? { ...r, status: 'READY', size: `${(1 + Math.random() * 6).toFixed(1)} MB` } : r)),
      );
      this.toast.success(this.i18n.t('reports.ready'), this.i18n.t('reports.readyText', { name: report.name }));
    }, 2200);
  }

  download(report: ReportInfo): void {
    const csv = toCsv([
      ['FraudShield AI', this.i18n.lit(report.name)],
      [this.i18n.t('reports.colType'), this.i18n.lit(report.type)],
      [this.i18n.t('reports.colRange'), this.i18n.lit(report.range)],
      [this.i18n.t('reports.colGenerated'), report.generated.slice(0, 10)],
      [this.i18n.t('reports.colFormat'), report.format],
    ]);
    const slug = report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadFile(`${slug}.csv`, csv);
    this.toast.info(this.i18n.t('reports.downloadStarted'), this.i18n.lit(report.name));
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }
}

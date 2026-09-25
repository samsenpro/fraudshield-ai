import { Component } from '@angular/core';

import { DEMO_MODELS, PIPELINE_STAGES } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-models',
  standalone: true,
  imports: [PageHeaderComponent, IconComponent, StatusBadgeComponent, ...I18N_PIPES],
  template: `
    <div class="page page-enter">
      <app-page-header [title]="'models.title' | t" [subtitle]="'models.subtitle' | t"></app-page-header>

      <section class="panel panel--roomy pipeline-panel" [attr.aria-label]="'models.pipeline' | t">
        <ol class="pipeline">
          @for (stage of stages; track stage.label; let last = $last; let i = $index) {
            <li class="pipeline__step">
              <div class="pipeline__stage" [style.animation-delay.ms]="i * 90" [attr.title]="stage.detail | lit">
                <app-icon [name]="stage.icon" [size]="18" color="var(--color-accent-2)" class="pipeline__icon"></app-icon>
                <div class="pipeline__label">{{ stage.label | lit }}</div>
                <span class="pipeline__flow"></span>
              </div>
              @if (!last) {
                <app-icon name="arrow-right" [size]="20" color="var(--color-neutral-600)" class="pipeline__arrow"></app-icon>
              }
            </li>
          }
        </ol>
      </section>

      <div class="grid grid--models">
        @for (m of models; track m.name; let i = $index) {
          <article class="panel model" [style.animation-delay.ms]="i * 60">
            <div class="model__head">
              <div class="model__name">{{ m.name | lit }}</div>
              <app-status-badge [status]="m.status" size="sm"></app-status-badge>
            </div>
            <div class="model__metrics">
              <div>
                <div class="model__metric">{{ m.accuracy }}%</div>
                <div class="model__metric-label">{{ 'models.accuracy' | t }}</div>
              </div>
              <div>
                <div class="model__metric">{{ m.precision }}%</div>
                <div class="model__metric-label">{{ 'models.precision' | t }}</div>
              </div>
              <div>
                <div class="model__metric">{{ m.recall }}%</div>
                <div class="model__metric-label">{{ 'models.recall' | t }}</div>
              </div>
              <div>
                <div class="model__metric">{{ m.f1 }}%</div>
                <div class="model__metric-label">{{ 'models.f1' | t }}</div>
              </div>
            </div>
            @if (m.status === 'TRAINING') {
              <div class="model__training" [attr.aria-label]="'models.training' | t"><span></span></div>
            }
            <div class="model__meta">{{ 'models.lastTrained' | t: { date: m.status === 'TRAINING' ? (m.trained | lit) : (m.trained | fsDate: 'date'), version: m.version } }}</div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .pipeline-panel {
        overflow-x: auto;
      }
      .pipeline {
        display: flex;
        align-items: center;
        min-width: 640px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .pipeline__step {
        display: flex;
        align-items: center;
        flex: 1;
      }
      .pipeline__stage {
        position: relative;
        flex: 1;
        background: var(--color-neutral-100);
        border: 1px solid var(--color-divider);
        padding: 14px;
        text-align: center;
        overflow: hidden;
        animation: fs-fade-up 0.35s var(--ease-out) backwards;
        transition: border-color 0.2s, background 0.2s;
      }
      .pipeline__stage:hover {
        border-color: var(--color-accent-2);
        background: var(--color-neutral-200);
      }
      .pipeline__icon {
        display: flex;
        justify-content: center;
        margin: 0 auto 8px;
      }
      .pipeline__label {
        font-size: 12.5px;
        font-weight: 700;
      }
      .pipeline__flow {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 2px;
        width: 25%;
        background: var(--color-accent-2);
        animation: fs-scan 2.8s linear infinite;
      }
      .pipeline__step:nth-child(2) .pipeline__flow {
        animation-delay: 0.7s;
      }
      .pipeline__step:nth-child(3) .pipeline__flow {
        animation-delay: 1.4s;
      }
      .pipeline__step:nth-child(4) .pipeline__flow {
        animation-delay: 2.1s;
      }
      .pipeline__arrow {
        margin: 0 6px;
      }
      .model {
        padding: 16px;
        animation: fs-fade-up 0.35s var(--ease-out) backwards;
      }
      .model:hover {
        border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
      }
      .model__head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 10px;
      }
      .model__name {
        font-size: 14.5px;
        font-weight: 700;
        color: var(--color-text);
      }
      .model__metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }
      .model__metric {
        font-size: 16px;
        font-weight: 800;
        font-family: var(--font-heading);
        line-height: 1.3;
      }
      .model__metric-label {
        font-size: 10px;
        color: var(--color-neutral-700);
      }
      .model__training {
        height: 3px;
        background: var(--color-neutral-200);
        overflow: hidden;
        margin-bottom: 10px;
      }
      .model__training span {
        display: block;
        height: 100%;
        width: 25%;
        background: var(--color-warning);
        animation: fs-scan 1.6s linear infinite;
      }
      .model__meta {
        font-size: 11px;
        color: var(--color-neutral-700);
      }
    `,
  ],
})
export class ModelsComponent {
  readonly stages = PIPELINE_STAGES;
  readonly models = DEMO_MODELS;
}

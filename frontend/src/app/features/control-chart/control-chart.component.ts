import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { catchError, of } from 'rxjs';

import {
  ChartStatus,
  ControlLimits,
  evaluateStatus,
  ProductCode,
  ProductSeries,
  Timeframe,
} from '../../core/models/control-chart.models';
import { SalesDataService } from '../../core/services/sales-data.service';
import { ControlLimitsService } from '../../core/services/control-limits.service';
import { LimitsDialogComponent, LimitsDialogResult } from '../limits-dialog/limits-dialog.component';

const PRODUCT_LABELS: Record<ProductCode, string> = {
  A: 'Product A',
  B: 'Product B',
  C: 'Product C',
  D: 'Product D',
};

@Component({
  selector: 'app-control-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatIconButtonModule, BaseChartDirective],
  templateUrl: './control-chart.component.html',
  styleUrl: './control-chart.component.scss',
})
export class ControlChartComponent implements OnInit, OnChanges {
  @Input({ required: true }) productCode!: ProductCode;
  @Input({ required: true }) timeframe!: Timeframe;

  private readonly salesData = inject(SalesDataService);
  private readonly limitsApi = inject(ControlLimitsService);
  private readonly dialog = inject(MatDialog);

  productLabel = '';
  loading = true;
  loadError = false;
  status: ChartStatus = 'in-control';
  limits: ControlLimits | null = null;

  chartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'line'>['options'] = {};

  ngOnInit(): void {
    this.productLabel = PRODUCT_LABELS[this.productCode];
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeframe'] && !changes['timeframe'].firstChange) {
      this.load();
    }
  }

  openSettings(): void {
    if (!this.limits) return;
    const ref = this.dialog.open<LimitsDialogComponent, ControlLimits, LimitsDialogResult>(
      LimitsDialogComponent,
      { data: this.limits, width: '420px' }
    );
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.limitsApi
        .updateLimits({ ...this.limits!, ...result })
        .pipe(catchError(() => of(null)))
        .subscribe((updated) => {
          if (updated) {
            this.limits = updated;
            this.load();
          }
        });
    });
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;
    this.salesData
      .getSeries(this.productCode, this.timeframe)
      .pipe(catchError(() => of(null)))
      .subscribe((series) => {
        this.loading = false;
        if (!series) {
          this.loadError = true;
          return;
        }
        this.limits = series.limits;
        this.status = evaluateStatus(series);
        this.buildChart(series);
      });
  }

  private buildChart(series: ProductSeries): void {
    const { limits } = series;
    const labels = series.points.map((p) => formatLabel(p.timestamp, this.timeframe));
    const values = series.points.map((p) => p.value);

    const lineColor = this.status === 'in-control' ? '#4fc3ff' : '#ff5d78';

    this.chartData = {
      labels,
      datasets: [
        {
          data: values,
          borderColor: lineColor,
          backgroundColor: 'transparent',
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: lineColor,
          borderWidth: 2,
          tension: 0.25,
        },
      ],
    };

    const annotations: Record<string, AnnotationOptions> = {
      ucl: limitLine(limits.upperControlLimit, 'UCL'),
      lcl: limitLine(limits.lowerControlLimit, 'LCL'),
    };
    if (limits.centerLine !== undefined) {
      annotations['cl'] = {
        type: 'line',
        yMin: limits.centerLine,
        yMax: limits.centerLine,
        borderColor: 'rgba(139, 155, 209, 0.5)',
        borderWidth: 1,
        borderDash: [2, 3],
      };
    }

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { intersect: false, mode: 'index' },
      // The raw sales figures are intentionally never rendered — no y-axis
      // ticks and no numeric tooltip value, only relative chart shape.
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#132145',
          borderColor: '#2c3d70',
          borderWidth: 1,
          titleColor: '#e8ecfb',
          bodyColor: '#8b9bd1',
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              if (v > limits.upperControlLimit) return 'Above upper control limit';
              if (v < limits.lowerControlLimit) return 'Below lower control limit';
              return 'Within control limits';
            },
          },
        },
        annotation: { annotations },
      },
      scales: {
        x: {
          grid: { color: 'rgba(30, 44, 86, 0.6)' },
          ticks: { color: '#5b6aa0', maxRotation: 0, autoSkip: true, font: { size: 10 } },
        },
        y: {
          display: false,
          // padding so the trace never touches the card edges even though
          // no numeric scale is shown
          grace: '15%',
        },
      },
    };
  }
}

function limitLine(value: number, label: string): AnnotationOptions {
  return {
    type: 'line',
    yMin: value,
    yMax: value,
    borderColor: 'rgba(255, 93, 120, 0.55)',
    borderWidth: 1,
    borderDash: [6, 4],
    label: {
      display: true,
      content: label,
      position: 'end',
      backgroundColor: 'transparent',
      color: '#ff9fb0',
      font: { size: 10, weight: 'normal' },
      padding: 0,
    },
  };
}

function formatLabel(iso: string, timeframe: Timeframe): string {
  const d = new Date(iso);
  if (timeframe === '1d') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timeframe === '6m') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

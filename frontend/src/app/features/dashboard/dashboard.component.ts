import { Component, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { PRODUCT_CODES, Timeframe, TIMEFRAME_OPTIONS } from '../../core/models/control-chart.models';
import { ControlChartComponent } from '../control-chart/control-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatToolbarModule, MatButtonToggleModule, MatIconModule, ControlChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly productCodes = PRODUCT_CODES;
  readonly timeframeOptions = TIMEFRAME_OPTIONS;
  readonly timeframe = signal<Timeframe>('1w');

  setTimeframe(value: Timeframe): void {
    this.timeframe.set(value);
  }
}

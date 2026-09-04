import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ControlLimits, ProductCode } from '../models/control-chart.models';

@Injectable({ providedIn: 'root' })
export class ControlLimitsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** GET /products/{code}/limits */
  getLimits(productCode: ProductCode): Observable<ControlLimits> {
    return this.http.get<ControlLimits>(`${this.base}/products/${productCode}/limits`);
  }

  /**
   * PUT /products/{code}/limits
   * Persists new UCL/LCL/notification emails. The backend re-evaluates the
   * most recent data point immediately, and a scheduled Lambda keeps
   * checking on every new ingest, emailing notifyEmails via SES on breach.
   */
  updateLimits(limits: ControlLimits): Observable<ControlLimits> {
    return this.http.put<ControlLimits>(
      `${this.base}/products/${limits.productCode}/limits`,
      limits
    );
  }
}

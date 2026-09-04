import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductCode, ProductSeries, Timeframe } from '../models/control-chart.models';

@Injectable({ providedIn: 'root' })
export class SalesDataService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * Fetches the bucketed control-chart series for one product.
   * Backend endpoint: GET /products/{code}/series?timeframe=1d|1w|1m|6m
   * The API is responsible for querying the underlying AWS data store
   * (DynamoDB / Timestream / RDS) and pre-aggregating points — the
   * frontend never talks to AWS directly.
   */
  getSeries(productCode: ProductCode, timeframe: Timeframe): Observable<ProductSeries> {
    return this.http.get<ProductSeries>(
      `${this.base}/products/${productCode}/series`,
      { params: { timeframe } }
    );
  }
}

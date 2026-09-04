import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ControlLimits } from '../../core/models/control-chart.models';

export interface LimitsDialogResult {
  upperControlLimit: number;
  lowerControlLimit: number;
  centerLine?: number;
  notifyEmails: string[];
}

@Component({
  selector: 'app-limits-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './limits-dialog.component.html',
  styleUrl: './limits-dialog.component.scss',
})
export class LimitsDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<LimitsDialogComponent>);
  readonly data = inject<ControlLimits>(MAT_DIALOG_DATA);

  emails: string[] = [...this.data.notifyEmails];

  form = this.fb.nonNullable.group({
    upperControlLimit: [this.data.upperControlLimit, Validators.required],
    lowerControlLimit: [this.data.lowerControlLimit, Validators.required],
    centerLine: [this.data.centerLine ?? null],
    newEmail: [''],
  });

  addEmail(): void {
    const value = this.form.controls.newEmail.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && emailPattern.test(value) && !this.emails.includes(value)) {
      this.emails.push(value);
    }
    this.form.controls.newEmail.setValue('');
  }

  removeEmail(email: string): void {
    this.emails = this.emails.filter((e) => e !== email);
  }

  save(): void {
    if (this.form.invalid) return;
    const { upperControlLimit, lowerControlLimit, centerLine } = this.form.getRawValue();
    if (lowerControlLimit >= upperControlLimit) {
      this.form.controls.lowerControlLimit.setErrors({ mustBeBelowUcl: true });
      return;
    }
    this.ref.close({
      upperControlLimit,
      lowerControlLimit,
      centerLine: centerLine ?? undefined,
      notifyEmails: this.emails,
    } satisfies LimitsDialogResult);
  }

  cancel(): void {
    this.ref.close();
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private counters: Map<string, number> = new Map();
  private observers: Map<string, number[]> = new Map();

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelString = Object.entries(labels)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelString}}`;
  }

  increment(name: string, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + 1);
  }

  observe(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    if (!this.observers.has(key)) {
      this.observers.set(key, []);
    }
    this.observers.get(key)!.push(value);
  }

  getCounters(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }

  getObservers(): Record<string, number[]> {
    return Object.fromEntries(this.observers.entries());
  }
}

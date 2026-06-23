import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats the time remaining until an ISO date as a compact countdown,
 * e.g. "2d 4h", "5h 12m", "08:30" (mm:ss in the final minutes), or "Ended".
 *
 * Pure pipe driven by an external "tick" input so the component controls
 * refresh cadence without making the pipe impure.
 */
@Pipe({ name: 'countdown' })
export class CountdownPipe implements PipeTransform {
  transform(endsAt: string | null | undefined, _tick?: number | null): string {
    if (!endsAt) {
      return '';
    }

    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) {
      return '';
    }

    const diff = end - Date.now();
    if (diff <= 0) {
      return 'Ended';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    // Final hour: show mm:ss for urgency.
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }
}

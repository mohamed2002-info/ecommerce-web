import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * A single app-wide 1-second tick. Countdown displays subscribe to this instead
 * of each spinning up its own interval, so timers stay cheap and in sync.
 */
@Injectable({ providedIn: 'root' })
export class TickerService {
  /** Emits an incrementing counter every second (starts immediately). */
  readonly tick$: Observable<number> = timer(0, 1000).pipe(
    map(() => Date.now()),
    shareReplay({ bufferSize: 1, refCount: false })
  );
}

import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'All Soft Multimedia';

  // Injecting ThemeService here ensures the persisted theme is applied to
  // <html> as soon as the app bootstraps.
  constructor(private theme: ThemeService) {}
}

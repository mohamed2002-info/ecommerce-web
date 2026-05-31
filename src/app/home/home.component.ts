import { Component, OnInit } from '@angular/core';
import { ViewService } from '../services/view.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private viewService: ViewService) {}

  ngOnInit(): void {
    // Subscribe to view mode changes
    this.viewService.viewMode$.subscribe(mode => {
      this.viewMode = mode;
    });
  }
}

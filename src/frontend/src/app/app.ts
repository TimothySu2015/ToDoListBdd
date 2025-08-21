import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, HealthResponse } from './core/services/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('todolist-frontend');
  protected readonly apiStatus = signal<string>('檢查中...');
  protected readonly apiResponse = signal<HealthResponse | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.checkApiHealth();
  }

  checkApiHealth(): void {
    this.apiService.checkHealth().subscribe({
      next: (response) => {
        this.apiResponse.set(response);
        this.apiStatus.set('連線正常');
      },
      error: (error) => {
        console.error('API 連線失敗:', error);
        this.apiStatus.set('連線失敗');
      }
    });
  }
}

import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, HealthResponse } from './core/services/api';
import { TaskInputComponent } from './features/todo/components/task-input/task-input.component';
import { TaskListComponent } from './features/todo/components/task-list/task-list.component';
import { TaskViewSwitcherComponent } from './features/todo/components/task-view-switcher/task-view-switcher.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, TaskInputComponent, TaskListComponent, TaskViewSwitcherComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('待辦事項管理系統');
  protected readonly apiStatus = signal<string>('檢查中...');
  protected readonly apiResponse = signal<HealthResponse | null>(null);
  protected readonly isApiStatusCollapsed = signal<boolean>(false);

  constructor(private apiService: ApiService) {}

  showKeyboardHelp(): void {
    // 觸發快捷鍵說明對話框
    const helpEvent = new CustomEvent('showShortcutHelp');
    document.dispatchEvent(helpEvent);
  }

  ngOnInit(): void {
    this.checkApiHealth();
  }

  checkApiHealth(): void {
    this.apiService.checkHealth().subscribe({
      next: (response) => {
        this.apiResponse.set(response);
        this.apiStatus.set('連線正常');
        // 連線成功後自動收起狀態面板
        setTimeout(() => {
          this.isApiStatusCollapsed.set(true);
        }, 2000);
      },
      error: (error) => {
        console.error('API 連線失敗:', error);
        this.apiStatus.set('連線失敗');
        this.isApiStatusCollapsed.set(false);
      }
    });
  }

  toggleApiStatus(): void {
    this.isApiStatusCollapsed.update(collapsed => !collapsed);
  }
}

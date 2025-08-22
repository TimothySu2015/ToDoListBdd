import { Injectable, signal, OnDestroy } from '@angular/core';
import { TaskService } from './task.service';
import { ViewStateService } from './view-state.service';
import { Task, TaskViewType } from '../models/task.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchService implements OnDestroy {
  // 搜尋狀態
  private searchTermSignal = signal<string>('');
  private searchLoadingSignal = signal<boolean>(false);
  private searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

  // 公開的只讀 signals
  public readonly searchTerm = this.searchTermSignal.asReadonly();
  public readonly searchLoading = this.searchLoadingSignal.asReadonly();

  constructor(
    private taskService: TaskService,
    private viewStateService: ViewStateService
  ) {}

  /**
   * 執行搜尋
   * @param term 搜尋關鍵字
   */
  search(term: string): void {
    this.searchTermSignal.set(term);
    
    // 清除之前的防抖動計時器
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
    
    // 設定 300ms 防抖動
    this.searchDebounceTimeout = setTimeout(() => {
      this.performSearch(term);
    }, 300);
  }

  /**
   * 執行實際搜尋
   */
  private performSearch(term: string): void {
    // 效能優化：如果搜尋詞太短，不執行搜尋
    if (term.trim().length > 0 && term.trim().length < 2) {
      return;
    }
    
    this.searchLoadingSignal.set(true);
    
    const currentView = this.viewStateService.getCurrentView();
    
    // 記錄搜尋開始時間（用於效能監控）
    const startTime = performance.now();
    
    this.taskService.searchTasks(term, currentView).subscribe({
      next: () => {
        // 搜尋結果已經在 TaskService 中更新
        this.searchLoadingSignal.set(false);
        
        // 效能監控
        const duration = performance.now() - startTime;
        if (duration > 300) {
          console.warn(`搜尋回應時間過長: ${duration}ms`);
        }
      },
      error: (error) => {
        console.error('搜尋失敗:', error);
        this.searchLoadingSignal.set(false);
      }
    });
  }

  /**
   * 清除搜尋
   */
  clearSearch(): void {
    this.searchTermSignal.set('');
    
    // 清除防抖動計時器
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
      this.searchDebounceTimeout = null;
    }
    
    // 重新載入當前檢視的所有任務
    const currentView = this.viewStateService.getCurrentView();
    this.taskService.getTasksByStatus(currentView).subscribe({
      next: () => {
        // 任務列表已恢復
      },
      error: (error) => {
        console.error('重新載入任務失敗:', error);
      }
    });
  }

  /**
   * 取得當前搜尋關鍵字
   */
  getCurrentSearchTerm(): string {
    return this.searchTermSignal();
  }

  /**
   * 檢查是否正在搜尋
   */
  isSearching(): boolean {
    return this.searchTermSignal().trim().length > 0;
  }

  /**
   * 清理資源
   */
  ngOnDestroy(): void {
    // 清理防抖動計時器
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
      this.searchDebounceTimeout = null;
    }
  }
}
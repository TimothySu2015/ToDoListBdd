import { Injectable, signal } from '@angular/core';
import { TaskViewType } from '../models/task.interface';

@Injectable({
  providedIn: 'root'
})
export class ViewStateService {
  private readonly STORAGE_KEY = 'taskView';
  
  // 預設檢視為待辦
  private currentViewSignal = signal<TaskViewType>(TaskViewType.TODO);
  
  // 公開的只讀 signal
  public readonly currentView = this.currentViewSignal.asReadonly();

  constructor() {
    // 從 localStorage 恢復檢視狀態
    this.restoreViewFromStorage();
  }

  /**
   * 設定當前檢視
   * @param view 檢視類型
   */
  setView(view: TaskViewType): void {
    this.currentViewSignal.set(view);
    localStorage.setItem(this.STORAGE_KEY, view);
  }

  /**
   * 取得當前檢視
   * @returns 當前檢視類型
   */
  getCurrentView(): TaskViewType {
    return this.currentViewSignal();
  }

  /**
   * 從 localStorage 恢復檢視狀態
   */
  restoreViewFromStorage(): void {
    try {
      const savedView = localStorage.getItem(this.STORAGE_KEY) as TaskViewType;
      if (savedView && Object.values(TaskViewType).includes(savedView)) {
        this.currentViewSignal.set(savedView);
      }
    } catch (error) {
      // localStorage 不可用時使用預設值
      console.warn('無法從 localStorage 載入檢視狀態:', error);
    }
  }

  /**
   * 重設檢視為預設狀態 (主要用於測試)
   */
  resetView(): void {
    this.currentViewSignal.set(TaskViewType.TODO);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
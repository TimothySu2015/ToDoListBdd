import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskViewType } from '../../models/task.interface';
import { ViewStateService } from '../../services/view-state.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-view-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-view-switcher.component.html',
  styleUrls: ['./task-view-switcher.component.scss']
})
export class TaskViewSwitcherComponent {
  private viewStateService = inject(ViewStateService);
  private taskService = inject(TaskService);

  // 公開的 signals
  currentView = this.viewStateService.currentView;
  loading = this.taskService.loading;

  // 檢視選項設定
  viewTypes = [
    { 
      type: TaskViewType.TODO, 
      label: '待辦',
      testId: 'view-todo'
    },
    { 
      type: TaskViewType.COMPLETED, 
      label: '已完成',
      testId: 'view-completed'
    },
    { 
      type: TaskViewType.ALL, 
      label: '全部',
      testId: 'view-all'
    }
  ];

  // 計算各檢視的任務數量
  todoCount = computed(() => this.taskService.pendingTaskCount());
  completedCount = computed(() => this.taskService.completedTaskCount());
  allCount = computed(() => this.taskService.taskCount());

  /**
   * 切換檢視
   * @param view 要切換到的檢視類型
   */
  switchView(view: TaskViewType): void {
    if (this.loading()) {
      return; // 載入中時不允許切換
    }

    this.viewStateService.setView(view);
    this.loadTasksForView(view);
  }

  /**
   * 取得指定檢視的任務數量
   * @param view 檢視類型
   * @returns 任務數量
   */
  getCountForView(view: TaskViewType): number {
    switch (view) {
      case TaskViewType.TODO:
        return this.todoCount();
      case TaskViewType.COMPLETED:
        return this.completedCount();
      case TaskViewType.ALL:
        return this.allCount();
      default:
        return 0;
    }
  }

  /**
   * 檢查是否為當前活躍檢視
   * @param view 檢視類型
   * @returns 是否為當前檢視
   */
  isActiveView(view: TaskViewType): boolean {
    return this.currentView() === view;
  }

  /**
   * TrackBy 函數優化性能
   * @param index 索引
   * @param item 檢視類型項目
   * @returns 唯一識別符
   */
  trackByType(index: number, item: any): string {
    return item.type;
  }

  /**
   * 為指定檢視載入任務
   * @param view 檢視類型
   */
  private loadTasksForView(view: TaskViewType): void {
    this.taskService.getTasksByStatus(view).subscribe({
      next: () => {
        // 載入成功，無需額外處理
      },
      error: (error) => {
        console.error('載入任務失敗:', error);
      }
    });
  }
}
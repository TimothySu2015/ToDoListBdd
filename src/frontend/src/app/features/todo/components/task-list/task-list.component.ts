import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.interface';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent {
  // 計算屬性
  public readonly isEmpty = computed(() => this.taskService.tasks().length === 0);
  public readonly hasError = computed(() => !!this.taskService.error());

  // 動畫狀態管理
  private animatingTasks = signal<Map<number, string>>(new Map());

  constructor(public taskService: TaskService) {}

  /**
   * 追蹤函數用於 *ngFor
   */
  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  /**
   * 格式化日期顯示
   */
  formatDate(date: Date): string {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return '剛剛';
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * 重新載入任務列表
   */
  reloadTasks(): void {
    this.taskService.getAllTasks().subscribe({
      error: (error) => {
        console.error('重新載入任務時發生錯誤:', error);
      }
    });
  }

  /**
   * 清除錯誤並重試
   */
  retry(): void {
    this.taskService.clearError();
    this.reloadTasks();
  }

  /**
   * 切換任務完成狀態
   */
  onTaskStatusToggle(task: Task): void {
    // 開始動畫
    const animationType = task.isCompleted ? 'uncompleting' : 'completing';
    this.setTaskAnimation(task.id, animationType);

    this.taskService.toggleTaskStatus(task).subscribe({
      next: () => {
        // 顯示成功回饋
        this.showSuccessAnimation(task.id);
      },
      error: (error) => {
        console.error('更新任務狀態失敗:', error);
        this.clearTaskAnimation(task.id);
        // 錯誤訊息會由 service 處理
      }
    });
  }

  /**
   * 勾選框鍵盤事件處理
   */
  onCheckboxKeydown(event: KeyboardEvent, task: Task): void {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      this.onTaskStatusToggle(task);
    }
  }

  /**
   * 任務項目鍵盤事件處理
   */
  onTaskItemKeydown(event: KeyboardEvent, task: Task): void {
    if (event.code === 'Space') {
      event.preventDefault();
      this.onTaskStatusToggle(task);
    }
  }

  /**
   * 檢查任務是否在動畫狀態
   */
  isTaskAnimating(taskId: number, animationType: string): boolean {
    const currentAnimation = this.animatingTasks().get(taskId);
    return currentAnimation === animationType;
  }

  /**
   * 設定任務動畫狀態
   */
  private setTaskAnimation(taskId: number, animationType: string): void {
    this.animatingTasks.update(tasks => {
      const newTasks = new Map(tasks);
      newTasks.set(taskId, animationType);
      return newTasks;
    });

    // 300ms 後清除動畫狀態
    setTimeout(() => {
      this.clearTaskAnimation(taskId);
    }, 300);
  }

  /**
   * 清除任務動畫狀態
   */
  private clearTaskAnimation(taskId: number): void {
    this.animatingTasks.update(tasks => {
      const newTasks = new Map(tasks);
      newTasks.delete(taskId);
      return newTasks;
    });
  }

  /**
   * 顯示成功動畫
   */
  private showSuccessAnimation(taskId: number): void {
    // 可以加入成功的視覺回饋
    console.log(`任務 ${taskId} 狀態更新成功`);
  }
}
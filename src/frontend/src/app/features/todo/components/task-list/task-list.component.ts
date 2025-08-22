import { Component, computed, signal, HostListener, ViewChild, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { ViewStateService } from '../../services/view-state.service';
import { SearchService } from '../../services/search.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { Task, TaskViewType } from '../../models/task.interface';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ToastNotificationComponent } from '../toast-notification/toast-notification.component';
import { TaskSearchComponent } from '../task-search/task-search.component';
import { TaskHighlightComponent } from '../task-highlight/task-highlight.component';
import { ClearCompletedComponent } from '../clear-completed/clear-completed.component';
import { ShortcutHelpComponent } from '../shortcut-help/shortcut-help.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent, ToastNotificationComponent, TaskSearchComponent, TaskHighlightComponent, ClearCompletedComponent, ShortcutHelpComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  // 計算屬性
  public readonly isEmpty = computed(() => this.taskService.tasks().length === 0);
  public readonly hasError = computed(() => !!this.taskService.error());

  // 動畫狀態管理
  private animatingTasks = signal<Map<number, string>>(new Map());

  // 刪除確認對話框狀態
  public showDeleteConfirm = signal(false);
  public taskToDelete = signal<Task | null>(null);
  public selectedTaskId = signal<number | null>(null);

  // 內嵌編輯狀態
  public editingTaskId = signal<number | null>(null);
  public editingText = signal<string>('');
  public originalText = signal<string>('');

  @ViewChild(ToastNotificationComponent) 
  private toastComponent!: ToastNotificationComponent;

  private viewStateService = inject(ViewStateService);
  public searchService = inject(SearchService);
  private keyboardService = inject(KeyboardShortcutService);

  constructor(public taskService: TaskService) {
    // 當檢視狀態改變時，重新載入任務
    effect(() => {
      const currentView = this.viewStateService.currentView();
      this.loadTasksForCurrentView(currentView);
    });
  }

  ngOnInit(): void {
    // 初始載入當前檢視的任務
    this.loadTasksForCurrentView(this.viewStateService.getCurrentView());
    
    // 初始化鍵盤快捷鍵服務
    this.keyboardService.init();
    
    // 監聽任務相關的鍵盤事件
    this.setupKeyboardEventListeners();
  }

  ngOnDestroy(): void {
    // 清理鍵盤快捷鍵服務
    this.keyboardService.destroy();
    
    // 移除事件監聽器
    this.removeKeyboardEventListeners();
  }

  /**
   * 設置鍵盤事件監聽器
   */
  private setupKeyboardEventListeners(): void {
    // 監聽自定義鍵盤事件 - 使用 any 類型來避免 TypeScript 類型檢查問題
    document.addEventListener('toggleTask', this.handleToggleTask.bind(this) as any);
    document.addEventListener('editTask', this.handleEditTask.bind(this) as any);
    document.addEventListener('deleteTask', this.handleDeleteTask.bind(this) as any);
    document.addEventListener('cancelEdit', this.handleCancelEdit.bind(this) as any);
  }

  /**
   * 移除鍵盤事件監聽器
   */
  private removeKeyboardEventListeners(): void {
    document.removeEventListener('toggleTask', this.handleToggleTask.bind(this) as any);
    document.removeEventListener('editTask', this.handleEditTask.bind(this) as any);
    document.removeEventListener('deleteTask', this.handleDeleteTask.bind(this) as any);
    document.removeEventListener('cancelEdit', this.handleCancelEdit.bind(this) as any);
  }

  /**
   * 處理切換任務狀態事件
   */
  private handleToggleTask(event: Event): void {
    const customEvent = event as CustomEvent;
    const taskId = customEvent.detail?.taskId;
    if (taskId) {
      const task = this.taskService.tasks().find(t => t.id === taskId);
      if (task) {
        this.onTaskStatusToggle(task);
      }
    }
  }

  /**
   * 處理編輯任務事件
   */
  private handleEditTask(event: Event): void {
    const target = event.target as HTMLElement;
    const taskId = target?.dataset['taskId'];
    if (taskId) {
      const task = this.taskService.tasks().find(t => t.id === parseInt(taskId));
      if (task) {
        this.startEditing(task);
      }
    }
  }

  /**
   * 處理刪除任務事件
   */
  private handleDeleteTask(event: Event): void {
    const customEvent = event as CustomEvent;
    const taskId = customEvent.detail?.taskId;
    if (taskId) {
      const task = this.taskService.tasks().find(t => t.id === taskId);
      if (task) {
        this.showDeleteDialog(task);
      }
    }
  }

  /**
   * 處理取消編輯事件
   */
  private handleCancelEdit(event: Event): void {
    this.cancelEditing();
  }

  /**
   * 根據當前檢視載入任務
   */
  private loadTasksForCurrentView(viewType: TaskViewType): void {
    this.taskService.getTasksByStatus(viewType).subscribe({
      next: () => {
        // 載入成功，無需額外處理
      },
      error: (error) => {
        console.error('載入任務失敗:', error);
        this.showErrorToast(`載入任務失敗：${error.message}`);
      }
    });
  }

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
    this.loadTasksForCurrentView(this.viewStateService.getCurrentView());
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

    const currentView = this.viewStateService.getCurrentView();
    const willBeCompleted = !task.isCompleted;

    this.taskService.toggleTaskStatus(task).subscribe({
      next: () => {
        // 顯示成功回饋
        this.showSuccessAnimation(task.id);
        
        // 檢查是否需要重新載入當前檢視
        if (currentView === TaskViewType.TODO && willBeCompleted) {
          // 在待辦檢視中完成任務，需要從列表中移除
          setTimeout(() => this.loadTasksForCurrentView(currentView), 500);
        } else if (currentView === TaskViewType.COMPLETED && !willBeCompleted) {
          // 在已完成檢視中將任務標記為待辦，需要從列表中移除
          setTimeout(() => this.loadTasksForCurrentView(currentView), 500);
        }
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

  /**
   * 顯示刪除確認對話框
   */
  showDeleteDialog(task: Task): void {
    this.taskToDelete.set(task);
    this.showDeleteConfirm.set(true);
  }

  /**
   * 確認刪除操作
   */
  confirmDelete(): void {
    const task = this.taskToDelete();
    if (task) {
      const taskDescription = task.description;
      this.setTaskAnimation(task.id, 'deleting');
      
      this.taskService.deleteTask(task.id).subscribe({
        next: (success) => {
          if (success) {
            this.playDeleteAnimation(task.id);
            this.showSuccessToast(`任務「${taskDescription}」已成功刪除`);
          }
        },
        error: (error) => {
          console.error('刪除失敗:', error);
          this.clearTaskAnimation(task.id);
          this.showErrorToast(`刪除任務「${taskDescription}」時發生錯誤：${error.message}`);
        }
      });
    }
    this.closeDeleteDialog();
  }

  /**
   * 取消刪除操作
   */
  cancelDelete(): void {
    this.closeDeleteDialog();
  }

  /**
   * 關閉刪除確認對話框
   */
  closeDeleteDialog(): void {
    this.showDeleteConfirm.set(false);
    this.taskToDelete.set(null);
  }

  /**
   * 播放刪除動畫
   */
  playDeleteAnimation(taskId: number): void {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.classList.add('deleting');
      setTimeout(() => {
        // 動畫完成後任務已經從狀態中移除了
        // 檢查是否所有任務都已刪除
        if (this.taskService.tasks().length === 0) {
          this.showInfoToast('所有任務已完成，列表已清空！');
        }
      }, 300);
    }
  }

  /**
   * 任務項目點擊選擇
   */
  selectTask(taskId: number): void {
    this.selectedTaskId.set(taskId);
  }

  /**
   * 顯示成功 toast 通知
   */
  private showSuccessToast(message: string): void {
    if (this.toastComponent) {
      this.toastComponent.showNotification(message, 'success', 4000);
    }
  }

  /**
   * 顯示錯誤 toast 通知
   */
  private showErrorToast(message: string): void {
    if (this.toastComponent) {
      this.toastComponent.showNotification(message, 'error', 6000);
    }
  }

  /**
   * 顯示資訊 toast 通知
   */
  private showInfoToast(message: string): void {
    if (this.toastComponent) {
      this.toastComponent.showNotification(message, 'info', 3000);
    }
  }

  /**
   * 鍵盤操作支援
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const tasks = this.taskService.tasks();
    const selectedId = this.selectedTaskId();
    
    // 如果沒有任務，不處理鍵盤事件
    if (tasks.length === 0) {
      return;
    }

    // 獲取當前選中任務的索引
    const currentIndex = selectedId ? tasks.findIndex(t => t.id === selectedId) : -1;

    switch (event.key) {
      case 'Delete':
        // 刪除選中的任務
        if (selectedId) {
          event.preventDefault();
          const task = tasks.find(t => t.id === selectedId);
          if (task) {
            this.showDeleteDialog(task);
          }
        }
        break;

      case 'ArrowDown':
        // 向下選擇任務
        event.preventDefault();
        const nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
        this.selectedTaskId.set(tasks[nextIndex].id);
        this.scrollToTask(tasks[nextIndex].id);
        break;

      case 'ArrowUp':
        // 向上選擇任務
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
        this.selectedTaskId.set(tasks[prevIndex].id);
        this.scrollToTask(tasks[prevIndex].id);
        break;

      case 'Enter':
      case ' ':
        // 切換任務完成狀態
        if (selectedId) {
          event.preventDefault();
          const task = tasks.find(t => t.id === selectedId);
          if (task) {
            this.onTaskStatusToggle(task);
          }
        }
        break;

      case 'Escape':
        // 取消選擇
        event.preventDefault();
        this.selectedTaskId.set(null);
        break;

      case 'Home':
        // 選擇第一個任務
        event.preventDefault();
        if (tasks.length > 0) {
          this.selectedTaskId.set(tasks[0].id);
          this.scrollToTask(tasks[0].id);
        }
        break;

      case 'End':
        // 選擇最後一個任務
        event.preventDefault();
        if (tasks.length > 0) {
          this.selectedTaskId.set(tasks[tasks.length - 1].id);
          this.scrollToTask(tasks[tasks.length - 1].id);
        }
        break;
    }
  }

  /**
   * 滾動到指定任務
   */
  private scrollToTask(taskId: number): void {
    setTimeout(() => {
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        // 聚焦到任務元素以提供視覺回饋
        (taskElement as HTMLElement).focus();
      }
    }, 0);
  }

  // ====== 內嵌編輯功能 ======

  /**
   * 開始編輯任務
   */
  startEditing(task: Task): void {
    this.editingTaskId.set(task.id);
    this.editingText.set(task.description);
    this.originalText.set(task.description);

    // 在下一個變更檢測週期設置焦點和選取文字
    setTimeout(() => {
      const editInput = document.querySelector('.edit-input') as HTMLInputElement;
      if (editInput) {
        editInput.focus();
        editInput.select();
      }
    }, 0);
  }

  /**
   * 取消編輯
   */
  cancelEditing(): void {
    this.editingTaskId.set(null);
    this.editingText.set('');
    this.originalText.set('');
  }

  /**
   * 保存編輯
   */
  saveEdit(): void {
    const taskId = this.editingTaskId();
    const newDescription = this.editingText().trim();

    if (!taskId) return;

    // 驗證空白內容
    if (!newDescription) {
      this.showErrorToast('任務描述不能為空白');
      return;
    }

    // 如果內容沒有變化，直接取消編輯
    if (newDescription === this.originalText()) {
      this.cancelEditing();
      return;
    }

    // 更新任務描述
    this.taskService.updateTaskDescription(taskId, newDescription).subscribe({
      next: (updatedTask) => {
        this.showSuccessToast(`任務已更新為「${updatedTask.description}」`);
        this.cancelEditing();
      },
      error: (error) => {
        // 根據錯誤類型顯示不同訊息
        if (error.message.includes('Network') || error.message.includes('網路')) {
          this.showErrorToast('保存失敗，請檢查網路連接');
        } else {
          this.showErrorToast(`保存失敗：${error.message}`);
        }
        this.cancelEditing();
      }
    });
  }

  /**
   * 處理編輯輸入框的鍵盤事件
   */
  onEditKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.saveEdit();
        break;
      case 'Escape':
        event.preventDefault();
        this.cancelEditing();
        break;
      case 'z':
        // Ctrl+Z 撤銷編輯
        if (event.ctrlKey) {
          event.preventDefault();
          this.undoEdit();
        }
        break;
    }
  }

  /**
   * 處理編輯文字變更
   */
  onEditTextChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editingText.set(target.value);
  }

  /**
   * 處理編輯輸入框失去焦點
   */
  onEditBlur(): void {
    // 延遲一點執行以允許其他事件（如點擊保存按鈕）先執行
    setTimeout(() => {
      if (this.editingTaskId()) {
        this.saveEdit();
      }
    }, 100);
  }

  /**
   * 處理任務文字雙擊事件
   */
  onTaskTextDoubleClick(task: Task): void {
    // 防止在已經編輯時重複觸發
    if (this.editingTaskId()) return;
    
    this.startEditing(task);
  }

  /**
   * 檢查是否正在編輯指定任務
   */
  isEditing(taskId: number): boolean {
    return this.editingTaskId() === taskId;
  }

  /**
   * 撤銷編輯操作 (Ctrl+Z)
   */
  undoEdit(): void {
    // 將編輯文字恢復到原始值
    this.editingText.set(this.originalText());
    
    // 重新聚焦到輸入框並選取文字
    setTimeout(() => {
      const editInput = document.querySelector('.edit-input') as HTMLInputElement;
      if (editInput) {
        editInput.focus();
        editInput.select();
      }
    }, 0);
  }
}
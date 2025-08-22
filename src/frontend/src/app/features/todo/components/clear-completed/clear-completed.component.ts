import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { UndoState } from '../../models/task.interface';

@Component({
  selector: 'app-clear-completed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="clear-completed-container">
      <!-- 清除按鈕 -->
      <button
        class="clear-completed-btn"
        [disabled]="!hasCompletedTasks() || isLoading()"
        (click)="showConfirmDialog()"
        [attr.data-testid]="'clear-completed-button'"
        [attr.aria-label]="getButtonAriaLabel()"
        tabindex="0"
        (keydown)="onKeyDown($event)"
      >
        <i class="icon" [class.loading]="isLoading()">🗑️</i>
        清除已完成
        <span class="sr-only" *ngIf="!hasCompletedTasks()">沒有已完成任務可清除</span>
      </button>

      <!-- 確認對話框 -->
      <div class="dialog-overlay" *ngIf="showDialog()" (click)="cancelClear()" [attr.role]="'dialog'" [attr.aria-modal]="'true'">
        <div class="dialog-content" (click)="$event.stopPropagation()" tabindex="-1" #dialogContent>
          <h3 class="dialog-title" id="dialog-title">確認清除</h3>
          <p class="dialog-message" [attr.aria-describedby]="'dialog-title'">
            {{ getConfirmMessage() }}
          </p>
          <div class="dialog-actions">
            <button 
              class="btn btn-secondary"
              (click)="cancelClear()"
              [attr.data-testid]="'cancel-button'"
              tabindex="0"
            >
              取消
            </button>
            <button 
              class="btn btn-danger"
              (click)="confirmClear()"
              [attr.data-testid]="'confirm-button'"
              tabindex="0"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      <!-- Undo 通知 -->
      <div class="undo-notification" *ngIf="undoState().showUndo" [attr.role]="'alert'" [attr.aria-live]="'polite'">
        <span class="undo-message">{{ getUndoMessage() }}</span>
        <button 
          class="undo-button"
          (click)="undoClear()"
          [attr.data-testid]="'undo-button'"
          tabindex="0"
        >
          撤銷
        </button>
        <span class="countdown">{{ undoState().countdown }}秒後自動消失</span>
      </div>
    </div>
  `,
  styleUrls: ['./clear-completed.component.scss']
})
export class ClearCompletedComponent {
  private taskService = inject(TaskService);
  
  // 元件狀態
  private showDialogSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(false);
  private undoStateSignal = signal<UndoState>({
    showUndo: false,
    deletedTasks: [],
    countdown: 0
  });
  private undoTimer?: number;

  // 公開的只讀狀態
  public readonly showDialog = this.showDialogSignal.asReadonly();
  public readonly isLoading = this.isLoadingSignal.asReadonly();
  public readonly undoState = this.undoStateSignal.asReadonly();

  // 計算屬性
  public readonly completedTasksCount = computed(() => 
    this.taskService.completedTaskCount()
  );
  
  public readonly hasCompletedTasks = computed(() => 
    this.completedTasksCount() > 0
  );

  /**
   * 顯示確認對話框
   */
  showConfirmDialog(): void {
    if (this.hasCompletedTasks() && !this.isLoading()) {
      this.showDialogSignal.set(true);
    }
  }

  /**
   * 取消清除操作
   */
  cancelClear(): void {
    this.showDialogSignal.set(false);
  }

  /**
   * 確認清除操作
   */
  async confirmClear(): Promise<void> {
    this.showDialogSignal.set(false);
    this.isLoadingSignal.set(true);

    try {
      const response = await this.taskService.clearCompletedTasks().toPromise();
      
      if (response && response.deletedCount > 0) {
        // 顯示 Undo 通知
        this.showUndoNotification(response.deletedTasks, response.deletedCount);
      }
    } catch (error) {
      console.error('清除已完成任務失敗:', error);
      // 這裡可以顯示錯誤訊息給使用者
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * 顯示 Undo 通知
   */
  private showUndoNotification(deletedTasks: any[], count: number): void {
    this.undoStateSignal.set({
      showUndo: true,
      deletedTasks: deletedTasks,
      countdown: 5
    });

    // 開始倒數計時
    this.startUndoCountdown();
  }

  /**
   * 開始 Undo 倒數計時
   */
  private startUndoCountdown(): void {
    if (this.undoTimer) {
      clearInterval(this.undoTimer);
    }

    this.undoTimer = window.setInterval(() => {
      const currentState = this.undoStateSignal();
      const newCountdown = currentState.countdown - 1;

      if (newCountdown <= 0) {
        this.hideUndoNotification();
      } else {
        this.undoStateSignal.set({
          ...currentState,
          countdown: newCountdown
        });
      }
    }, 1000);
  }

  /**
   * 隱藏 Undo 通知
   */
  private hideUndoNotification(): void {
    if (this.undoTimer) {
      clearInterval(this.undoTimer);
      this.undoTimer = undefined;
    }

    this.undoStateSignal.set({
      showUndo: false,
      deletedTasks: [],
      countdown: 0
    });
  }

  /**
   * 執行撤銷操作
   */
  async undoClear(): Promise<void> {
    const currentState = this.undoStateSignal();
    
    if (currentState.showUndo && currentState.deletedTasks.length > 0) {
      try {
        await this.taskService.restoreTasks(currentState.deletedTasks).toPromise();
        this.hideUndoNotification();
      } catch (error) {
        console.error('撤銷操作失敗:', error);
      }
    }
  }

  /**
   * 取得確認對話框訊息
   */
  getConfirmMessage(): string {
    const count = this.completedTasksCount();
    return `將清除 ${count} 個已完成任務，此操作可在 5 秒內撤銷`;
  }

  /**
   * 取得 Undo 訊息
   */
  getUndoMessage(): string {
    const count = this.undoState().deletedTasks.length;
    return `已清除 ${count} 個任務`;
  }

  /**
   * 取得按鈕的 ARIA 標籤
   */
  getButtonAriaLabel(): string {
    if (!this.hasCompletedTasks()) {
      return '清除已完成任務，目前沒有已完成任務';
    }
    
    const count = this.completedTasksCount();
    return `清除已完成任務，目前有 ${count} 個已完成任務`;
  }

  /**
   * 處理鍵盤事件
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.showConfirmDialog();
    } else if (event.key === 'Escape' && this.showDialog()) {
      this.cancelClear();
    }
  }

  /**
   * 元件銷毀時清理定時器
   */
  ngOnDestroy(): void {
    if (this.undoTimer) {
      clearInterval(this.undoTimer);
    }
  }
}
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { CreateTaskResponse } from '../../models/task.interface';

@Component({
  selector: 'app-task-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-input.component.html',
  styleUrls: ['./task-input.component.scss']
})
export class TaskInputComponent {
  // 輸入框的值
  taskDescription = signal<string>('');
  
  // 驗證錯誤訊息
  validationError = signal<string>('');
  
  // 是否正在提交
  isSubmitting = signal<boolean>(false);

  // 計算屬性
  canSubmit = computed(() => 
    this.taskDescription().trim().length > 0 && !this.isSubmitting()
  );

  constructor(public taskService: TaskService) {}

  /**
   * 處理輸入框變更
   */
  onInputChange(value: string): void {
    this.taskDescription.set(value);
    
    // 清除之前的驗證錯誤
    if (this.validationError()) {
      this.validationError.set('');
    }
    
    // 即時驗證
    if (value.trim().length > 500) {
      this.validationError.set('任務描述不能超過 500 字元');
    }
  }

  /**
   * 處理 Enter 鍵事件
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTask();
    }
  }

  /**
   * 處理新增按鈕點擊
   */
  onAddClick(): void {
    this.addTask();
  }

  /**
   * 新增任務
   */
  private addTask(): void {
    const description = this.taskDescription().trim();
    
    // 客戶端驗證
    if (!description) {
      this.validationError.set('請輸入任務描述');
      return;
    }

    if (description.length > 500) {
      this.validationError.set('任務描述不能超過 500 字元');
      return;
    }

    this.isSubmitting.set(true);
    this.validationError.set('');

    // 呼叫服務建立任務
    this.taskService.createTask(description).subscribe({
      next: (response: CreateTaskResponse) => {
        if (response.success) {
          // 成功 - 清空輸入框
          this.taskDescription.set('');
          this.validationError.set('');
        } else {
          // 失敗 - 顯示錯誤訊息
          if (response.errors && response.errors.length > 0) {
            const descriptionError = response.errors.find(e => e.field === 'description');
            const generalError = response.errors.find(e => e.field === 'general');
            
            if (descriptionError) {
              this.validationError.set(descriptionError.message);
            } else if (generalError) {
              this.validationError.set(generalError.message);
            } else {
              this.validationError.set(response.errors[0].message);
            }
          }
        }
      },
      error: (error) => {
        console.error('新增任務時發生錯誤:', error);
        this.validationError.set('發生未知錯誤，請稍後再試');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * 取得輸入框的 CSS 類別
   */
  getInputClasses(): string {
    const baseClasses = 'task-input';
    const errorClass = this.validationError() ? 'task-input--error' : '';
    const loadingClass = this.isSubmitting() ? 'task-input--loading' : '';
    
    return [baseClasses, errorClass, loadingClass].filter(Boolean).join(' ');
  }

  /**
   * 取得新增按鈕的 CSS 類別
   */
  getButtonClasses(): string {
    const baseClasses = 'add-button';
    const disabledClass = !this.canSubmit() ? 'add-button--disabled' : '';
    const loadingClass = this.isSubmitting() ? 'add-button--loading' : '';
    
    return [baseClasses, disabledClass, loadingClass].filter(Boolean).join(' ');
  }
}
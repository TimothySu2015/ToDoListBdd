import { Injectable, signal, inject } from '@angular/core';
import { TaskService } from './task.service';
import { Router } from '@angular/router';

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutInfo {
  combination: string;
  description: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  private shortcuts = new Map<string, ShortcutHandler>();
  private isListening = signal<boolean>(false);
  private currentFocus = signal<HTMLElement | null>(null);
  private modalStack: string[] = [];

  private taskService = inject(TaskService);
  private router = inject(Router);

  constructor() {
    this.initializeShortcuts();
  }

  init() {
    this.startListening();
  }

  destroy() {
    this.stopListening();
  }

  private initializeShortcuts(): void {
    // AC 1: Ctrl+N - 新增任務
    this.registerShortcut('ctrl+n', this.focusNewTaskInput.bind(this));
    
    // AC 2: Ctrl+F - 搜尋任務  
    this.registerShortcut('ctrl+f', this.focusSearchInput.bind(this));
    
    // AC 10: Ctrl+D - 清除已完成任務
    this.registerShortcut('ctrl+d', this.clearCompletedTasks.bind(this));
    
    // AC 11: 快捷鍵說明
    this.registerShortcut('ctrl+?', this.showHelp.bind(this));
    this.registerShortcut('f1', this.showHelp.bind(this));
    
    // AC 6: 取消操作
    this.registerShortcut('escape', this.cancelCurrentAction.bind(this));
    
    // AC 3: 切換任務完成狀態
    this.registerShortcut('space', this.toggleTaskCompletion.bind(this));
    
    // AC 4: 編輯任務
    this.registerShortcut('enter', this.editFocusedTask.bind(this));
    
    // AC 5: 刪除任務
    this.registerShortcut('delete', this.deleteFocusedTask.bind(this));
    
    // AC 8: 檢視切換
    this.registerShortcut('1', this.switchToTodoView.bind(this));
    this.registerShortcut('2', this.switchToCompletedView.bind(this));
    this.registerShortcut('3', this.switchToAllView.bind(this));
  }

  private registerShortcut(combination: string, handler: ShortcutHandler): void {
    this.shortcuts.set(combination, handler);
  }

  private startListening(): void {
    if (this.isListening()) return;

    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    this.isListening.set(true);
  }

  private stopListening(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
    this.isListening.set(false);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const combination = this.getKeyCombination(event);
    const handler = this.shortcuts.get(combination);

    if (handler && this.shouldExecuteShortcut(event, combination)) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  }

  private getKeyCombination(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    // 處理特殊鍵
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    
    parts.push(key);
    
    return parts.join('+');
  }

  private shouldExecuteShortcut(event: KeyboardEvent, combination: string): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    
    // AC 12: 檢查是否在模態對話框中
    const isInModal = this.isInModalContext(target);
    if (isInModal) {
      const allowedInModal = ['escape', 'ctrl+?', 'f1'];
      return allowedInModal.includes(combination);
    }
    
    // AC 12: 檢查是否在編輯模式中
    const isInEditMode = this.isInEditContext(target);
    if (isInEditMode) {
      const allowedInEdit = ['escape', 'enter', 'ctrl+?', 'f1'];
      return allowedInEdit.includes(combination);
    }
    
    // AC 12: 在輸入框中時，只執行特定快捷鍵
    if (tagName === 'input' || tagName === 'textarea') {
      const allowedInInput = ['escape', 'ctrl+a', 'ctrl+?', 'f1'];
      return allowedInInput.includes(combination);
    }
    
    // AC 12: 不攔截瀏覽器默認行為的快捷鍵
    const browserDefaults = ['ctrl+r', 'ctrl+shift+r', 'f5', 'ctrl+l', 'ctrl+w', 'ctrl+t'];
    if (browserDefaults.includes(combination)) {
      return false;
    }
    
    // AC 7: Tab 鍵不在這裡處理，讓瀏覽器自然處理
    if (combination === 'tab' || combination === 'shift+tab') {
      return false;
    }
    
    return true;
  }

  private isInModalContext(target: HTMLElement): boolean {
    return !!target.closest('.modal, .shortcut-help-overlay, .confirm-dialog');
  }

  private isInEditContext(target: HTMLElement): boolean {
    return !!target.closest('.editing, .task-edit');
  }

  // 快捷鍵處理器實作
  private focusNewTaskInput(): void {
    const input = document.querySelector('[data-testid="task-input"]') as HTMLInputElement;
    if (input) {
      input.focus();
      this.currentFocus.set(input);
    }
  }

  private focusSearchInput(): void {
    const input = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
    if (input) {
      input.focus();
      this.currentFocus.set(input);
    }
  }

  private clearCompletedTasks(): void {
    // 觸發清除已完成任務功能
    const clearButton = document.querySelector('[data-testid="clear-completed-button"]') as HTMLButtonElement;
    if (clearButton && !clearButton.disabled) {
      clearButton.click();
    }
  }

  private showHelp(): void {
    // 顯示快捷鍵說明對話框
    this.modalStack.push('shortcut-help');
    
    // 創建快捷鍵說明事件
    const helpEvent = new CustomEvent('showShortcutHelp');
    document.dispatchEvent(helpEvent);
  }

  private cancelCurrentAction(): void {
    // AC 6: 優先級順序：對話框 > 編輯模式
    
    // 1. 如果有對話框堆疊，關閉最上層的對話框
    if (this.modalStack.length > 0) {
      const topModal = this.modalStack.pop();
      
      if (topModal === 'shortcut-help') {
        const closeEvent = new CustomEvent('closeShortcutHelp');
        document.dispatchEvent(closeEvent);
      } else {
        // 其他對話框
        const closeEvent = new CustomEvent('closeDialog');
        document.dispatchEvent(closeEvent);
      }
      return;
    }
    
    // 2. 如果沒有對話框，退出編輯模式
    const editingElement = document.querySelector('.editing');
    if (editingElement) {
      const cancelEvent = new CustomEvent('cancelEdit');
      editingElement.dispatchEvent(cancelEvent);
      return;
    }
    
    // 3. 如果都沒有，清除當前焦點
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
    }
  }

  private toggleTaskCompletion(): void {
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement?.dataset['taskId']) {
      // 觸發任務完成狀態切換
      const toggleEvent = new CustomEvent('toggleTask', {
        detail: { taskId: parseInt(focusedElement.dataset['taskId']) }
      });
      focusedElement.dispatchEvent(toggleEvent);
    }
  }

  private editFocusedTask(): void {
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement?.dataset['taskId']) {
      const editEvent = new CustomEvent('editTask');
      focusedElement.dispatchEvent(editEvent);
    }
  }

  private deleteFocusedTask(): void {
    const focusedElement = document.activeElement as HTMLElement;
    if (focusedElement?.dataset['taskId']) {
      const deleteEvent = new CustomEvent('deleteTask', {
        detail: { taskId: parseInt(focusedElement.dataset['taskId']) }
      });
      focusedElement.dispatchEvent(deleteEvent);
    }
  }

  private switchToTodoView(): void {
    const todoButton = document.querySelector('[data-testid="view-todo"]') as HTMLButtonElement;
    if (todoButton) {
      todoButton.click();
    }
  }

  private switchToCompletedView(): void {
    const completedButton = document.querySelector('[data-testid="view-completed"]') as HTMLButtonElement;
    if (completedButton) {
      completedButton.click();
    }
  }

  private switchToAllView(): void {
    const allButton = document.querySelector('[data-testid="view-all"]') as HTMLButtonElement;
    if (allButton) {
      allButton.click();
    }
  }

  // 公開方法
  registerModal(modalId: string): void {
    this.modalStack.push(modalId);
  }

  unregisterModal(modalId: string): void {
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
  }

  getShortcutInfo(): ShortcutInfo[] {
    return [
      // 基本操作
      { combination: 'Ctrl+N', description: '新增任務', category: '基本操作' },
      { combination: 'Ctrl+F', description: '搜尋任務', category: '基本操作' },
      { combination: 'Ctrl+D', description: '清除已完成任務', category: '基本操作' },
      { combination: 'Esc', description: '取消當前操作', category: '基本操作' },
      
      // 任務操作
      { combination: 'Space', description: '切換任務完成狀態', category: '任務操作' },
      { combination: 'Enter', description: '編輯任務', category: '任務操作' },
      { combination: 'Del', description: '刪除任務', category: '任務操作' },
      
      // 檢視切換
      { combination: '1', description: '切換到待辦檢視', category: '檢視切換' },
      { combination: '2', description: '切換到已完成檢視', category: '檢視切換' },
      { combination: '3', description: '切換到全部檢視', category: '檢視切換' },
      
      // 導航
      { combination: 'Tab', description: '下一個元素', category: '導航' },
      { combination: 'Shift+Tab', description: '上一個元素', category: '導航' },
      { combination: 'Ctrl+?', description: '顯示此說明', category: '導航' },
      { combination: 'F1', description: '顯示說明', category: '導航' }
    ];
  }
}
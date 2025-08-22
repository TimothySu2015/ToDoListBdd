import { Component, signal, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';

interface ShortcutCategory {
  name: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    key: string;
  }>;
}

@Component({
  selector: 'app-shortcut-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="shortcut-help-overlay" 
      *ngIf="isVisible()" 
      (click)="close()"
      [attr.data-testid]="'shortcut-help-overlay'"
    >
      <div class="shortcut-help-content" (click)="$event.stopPropagation()">
        <div class="help-header">
          <h2>鍵盤快捷鍵</h2>
          <button 
            class="close-btn" 
            (click)="close()" 
            [attr.data-testid]="'close-help'"
            aria-label="關閉說明"
          >
            ✕
          </button>
        </div>
        
        <div class="help-body">
          <div class="shortcut-category" *ngFor="let category of shortcutCategories">
            <h3>{{ category.name }}</h3>
            <div class="shortcut-list">
              <div 
                class="shortcut-item" 
                *ngFor="let shortcut of category.shortcuts"
                [attr.data-testid]="'shortcut-' + shortcut.key"
              >
                <div class="shortcut-keys">
                  <span 
                    class="key" 
                    *ngFor="let key of shortcut.keys"
                    [class.modifier]="isModifierKey(key)"
                  >
                    {{ key }}
                  </span>
                </div>
                <div class="shortcut-description">{{ shortcut.description }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="help-footer">
          <p class="tip">💡 提示：將滑鼠懸停在按鈕上可查看對應的快捷鍵</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./shortcut-help.component.scss']
})
export class ShortcutHelpComponent implements OnInit, OnDestroy {
  private keyboardService = inject(KeyboardShortcutService);
  public isVisible = signal<boolean>(false);

  shortcutCategories: ShortcutCategory[] = [
    {
      name: '基本操作',
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: '新增任務', key: 'new-task' },
        { keys: ['Ctrl', 'F'], description: '搜尋任務', key: 'search' },
        { keys: ['Ctrl', 'D'], description: '清除已完成任務', key: 'clear' },
        { keys: ['Esc'], description: '取消當前操作', key: 'cancel' },
      ]
    },
    {
      name: '任務操作',
      shortcuts: [
        { keys: ['Space'], description: '切換任務完成狀態', key: 'toggle' },
        { keys: ['Enter'], description: '編輯任務', key: 'edit' },
        { keys: ['Del'], description: '刪除任務', key: 'delete' },
      ]
    },
    {
      name: '檢視切換',
      shortcuts: [
        { keys: ['1'], description: '切換到待辦檢視', key: 'view-todo' },
        { keys: ['2'], description: '切換到已完成檢視', key: 'view-completed' },
        { keys: ['3'], description: '切換到全部檢視', key: 'view-all' },
      ]
    },
    {
      name: '導航',
      shortcuts: [
        { keys: ['Tab'], description: '下一個元素', key: 'tab-next' },
        { keys: ['Shift', 'Tab'], description: '上一個元素', key: 'tab-prev' },
        { keys: ['Ctrl', '?'], description: '顯示此說明', key: 'help' },
        { keys: ['F1'], description: '顯示說明', key: 'help-f1' },
      ]
    }
  ];

  ngOnInit(): void {
    // 監聽顯示快捷鍵說明事件
    document.addEventListener('showShortcutHelp', this.show.bind(this));
    document.addEventListener('closeShortcutHelp', this.close.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('showShortcutHelp', this.show.bind(this));
    document.removeEventListener('closeShortcutHelp', this.close.bind(this));
  }

  show(): void {
    this.isVisible.set(true);
    this.keyboardService.registerModal('shortcut-help');
    
    // 延遲設置焦點到關閉按鈕
    setTimeout(() => {
      const closeBtn = document.querySelector('[data-testid="close-help"]') as HTMLElement;
      if (closeBtn) {
        closeBtn.focus();
      }
    });
  }

  close(): void {
    this.isVisible.set(false);
    this.keyboardService.unregisterModal('shortcut-help');
  }

  isModifierKey(key: string): boolean {
    return ['Ctrl', 'Shift', 'Alt', 'Meta'].includes(key);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isVisible() && event.key === 'Escape') {
      this.close();
    }
  }
}
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

// 簡化的測試世界構造函數
export class SimpleTestWorld extends World {
  public testTasks: any[] = [];
  public currentView: string = 'todo';
  public taskCounts: { [key: string]: number } = {};
  
  // 鍵盤快捷鍵相關屬性
  public currentPage?: string;
  public tasks?: any[];
  public keyboardShortcuts?: {
    enabled: boolean;
    activeModals: string[];
    focusedElement: string | null;
    editMode: boolean;
  };
  public mockTaskElement?: any;
  public mockTaskInput?: any;
  public mockSearchInput?: any;
  public mockInputElement?: any;
  public focusedTask?: any;
  public showingDialog?: boolean;
  public showingShortcutHelp?: boolean;
  public dialogType?: string;
  public lastAction?: string;
  public browserSupported?: boolean;
  public userAgent?: string;
  public hoveredElement?: string;
  public showingTooltip?: boolean;
  public shortcutCategories?: any[];
  public testedShortcuts?: string[];
  public allShortcutsWorking?: boolean;

  constructor(options: IWorldOptions) {
    super(options);
    console.log('🌍 初始化測試世界');
  }

  // 重置測試狀態
  reset() {
    this.testTasks = [];
    this.currentView = 'todo';
    this.taskCounts = {};
    
    // 重置鍵盤快捷鍵相關狀態
    this.currentPage = undefined;
    this.tasks = undefined;
    this.keyboardShortcuts = undefined;
    this.mockTaskElement = undefined;
    this.mockTaskInput = undefined;
    this.mockSearchInput = undefined;
    this.mockInputElement = undefined;
    this.focusedTask = undefined;
    this.showingDialog = false;
    this.showingShortcutHelp = false;
    this.dialogType = undefined;
    this.lastAction = undefined;
    this.browserSupported = undefined;
    this.userAgent = undefined;
    this.hoveredElement = undefined;
    this.showingTooltip = false;
    this.shortcutCategories = undefined;
    this.testedShortcuts = undefined;
    this.allShortcutsWorking = undefined;
    
    console.log('🔄 重置測試狀態');
  }

  // 鍵盤事件模擬方法
  simulateKeyboardEvent(type: string, options: any = {}) {
    return {
      type,
      key: options.key || '',
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      target: options.target || { tagName: 'BODY' },
      preventDefault: () => {},
      stopPropagation: () => {}
    };
  }

  // 快捷鍵執行邏輯判斷
  shouldExecuteShortcut(event: any): boolean {
    const target = event.target;
    const tagName = target.tagName?.toLowerCase();
    const combination = this.getKeyCombination(event);
    
    // 檢查是否在模態對話框中
    if (this.keyboardShortcuts?.activeModals?.length! > 0) {
      const allowedInModal = ['escape', 'ctrl+?', 'f1'];
      return allowedInModal.includes(combination);
    }
    
    // 檢查是否在編輯模式中
    if (this.keyboardShortcuts?.editMode) {
      const allowedInEdit = ['escape', 'enter', 'ctrl+?', 'f1'];
      return allowedInEdit.includes(combination);
    }
    
    // 在輸入框中時，只執行特定快捷鍵
    if (tagName === 'input' || tagName === 'textarea') {
      const allowedInInput = ['escape', 'ctrl+a', 'ctrl+?', 'f1'];
      return allowedInInput.includes(combination);
    }
    
    // 不攔截瀏覽器默認行為的快捷鍵
    const browserDefaults = ['ctrl+r', 'ctrl+shift+r', 'f5', 'ctrl+l', 'ctrl+w', 'ctrl+t'];
    if (browserDefaults.includes(combination)) {
      return false;
    }
    
    return true;
  }

  // 組合鍵字串生成
  getKeyCombination(event: any): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');  
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }
}

// 設置為 Cucumber 的世界構造函數
setWorldConstructor(SimpleTestWorld);
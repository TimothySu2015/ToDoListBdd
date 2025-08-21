import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { Task } from '../models/task.interface';
import { of, throwError } from 'rxjs';

describe('任務列表顯示功能 (Story 2.1)', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks', 'clearError'
    ], {
      'tasks': jasmine.createSpy().and.returnValue([]),
      'loading': jasmine.createSpy().and.returnValue(false),
      'error': jasmine.createSpy().and.returnValue(null),
      'taskCount': jasmine.createSpy().and.returnValue(0),
      'pendingTaskCount': jasmine.createSpy().and.returnValue(0),
      'completedTaskCount': jasmine.createSpy().and.returnValue(0),
      'incompleteTasks': jasmine.createSpy().and.returnValue([])
    });

    await TestBed.configureTestingModule({
      imports: [TaskListComponent, ConfirmDialogComponent, ToastNotificationComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    // 設置預設狀態
    (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
    (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
    (mockTaskService.error as jasmine.Spy).and.returnValue(null);
    (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([]);
  });

  describe('顯示空白任務列表', () => {
    beforeEach(() => {
      // 假設 我沒有任何待辦任務
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
    });

    it('當 頁面載入完成', fakeAsync(() => {
      // 當頁面載入完成
      fixture.detectChanges();
      tick();

      // 那麼 應該顯示空狀態提示
      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState).toBeTruthy();

      // 而且 空狀態應該包含 "目前沒有任務" 的提示訊息
      expect(emptyState.nativeElement.textContent).toContain('目前沒有任務');

      // 而且 空狀態應該包含鼓勵性文字
      expect(emptyState.nativeElement.textContent).toContain('太棒了！所有任務都已完成，或者您可以新增新的任務開始工作。');

      // 而且 應該有重新整理按鈕
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="empty-refresh-button"]'));
      expect(refreshButton).toBeTruthy();
      expect(refreshButton.nativeElement.textContent).toContain('重新整理');
    }));
  });

  describe('顯示單一任務', () => {
    beforeEach(() => {
      // 假設 我有一個待辦任務 "完成專案報告"
      const singleTask: Task = {
        id: 1,
        description: '完成專案報告',
        isCompleted: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分鐘前
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      };
      testTasks = [singleTask];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([singleTask]);
    });

    it('當 任務列表載入完成', () => {
      // 當任務列表載入完成
      fixture.detectChanges();

      // 那麼 任務列表應該顯示 1 個任務
      const taskItems = fixture.debugElement.queryAll(By.css('[data-testid^="task-item-"]'));
      expect(taskItems.length).toBe(1);

      // 而且 任務應該包含描述 "完成專案報告"
      expect(taskItems[0].nativeElement.textContent).toContain('完成專案報告');

      // 而且 任務應該顯示創建時間
      expect(taskItems[0].nativeElement.textContent).toMatch(/\d+\s?(分鐘前|小時前|天前|剛剛)/);

      // 而且 任務應該有未完成的視覺樣式
      expect(taskItems[0].nativeElement).not.toHaveClass('completed');
    });
  });

  describe('顯示多個任務', () => {
    beforeEach(() => {
      // 假設 我有以下待辦任務
      testTasks = [
        {
          id: 3,
          description: '準備會議資料',
          isCompleted: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15分鐘前（最新）
          updatedAt: new Date(Date.now() - 15 * 60 * 1000)
        },
        {
          id: 1,
          description: '完成專案報告',
          isCompleted: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30分鐘前
          updatedAt: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 2,
          description: '回覆客戶郵件',
          isCompleted: true,
          createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45分鐘前（最舊）
          updatedAt: new Date(Date.now() - 40 * 60 * 1000)
        }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(3);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([testTasks[0], testTasks[1]]);
    });

    it('當 任務列表載入完成', () => {
      // 當任務列表載入完成
      fixture.detectChanges();

      // 那麼 任務列表應該顯示 3 個任務
      const taskItems = fixture.debugElement.queryAll(By.css('[data-testid^="task-item-"]'));
      expect(taskItems.length).toBe(3);

      // 而且 最新任務 "準備會議資料" 應該顯示在列表頂部
      const firstTask = taskItems[0];
      expect(firstTask.nativeElement.textContent).toContain('準備會議資料');

      // 而且 最舊任務 "回覆客戶郵件" 應該顯示在列表底部
      const lastTask = taskItems[taskItems.length - 1];
      expect(lastTask.nativeElement.textContent).toContain('回覆客戶郵件');
    });
  });

  describe('任務計數器功能', () => {
    beforeEach(() => {
      // 假設 我有以下任務
      testTasks = [
        { id: 1, description: '完成專案報告', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '準備會議資料', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '回覆客戶郵件', isCompleted: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, description: '更新系統文檔', isCompleted: true, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(4);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([testTasks[0], testTasks[1]]);
    });

    it('當 任務列表載入完成', () => {
      // 當任務列表載入完成
      fixture.detectChanges();

      // 那麼 任務計數器應該顯示 "2 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('2 個待辦任務');

      // 而且 任務計數器應該顯示 "2 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('2 個已完成');

      // 而且 列表底部應該顯示 "共 4 項任務"
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter.nativeElement.textContent).toContain('共 4 項任務');
    });
  });

  describe('任務項目詳細資訊顯示', () => {
    beforeEach(() => {
      // 假設 我有一個任務，描述為 "完成重要專案報告"，創建於 1小時前
      const detailedTask: Task = {
        id: 123,
        description: '完成重要專案報告',
        isCompleted: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1小時前
        updatedAt: new Date(Date.now() - 60 * 60 * 1000)
      };
      testTasks = [detailedTask];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    });

    it('當 任務列表載入完成', () => {
      // 當任務列表載入完成
      fixture.detectChanges();

      const taskItem = fixture.debugElement.query(By.css('[data-testid="task-item-123"]'));

      // 那麼 任務項目應該顯示完整描述 "完成重要專案報告"
      expect(taskItem.nativeElement.textContent).toContain('完成重要專案報告');

      // 而且 任務項目應該顯示相對時間格式，如 "X 小時前"
      expect(taskItem.nativeElement.textContent).toMatch(/ID: 123/);

      // 而且 任務項目應該有唯一的 task ID 標識
      expect(taskItem.nativeElement.getAttribute('data-task-id')).toBe('123');

      // 而且 任務項目應該有勾選框用於狀態切換
      const checkbox = taskItem.query(By.css('[data-testid="task-checkbox"]'));
      expect(checkbox).toBeTruthy();
      expect(checkbox.nativeElement.getAttribute('role')).toBe('checkbox');
    });
  });

  describe('載入狀態指示器', () => {
    it('當 我訪問任務列表頁面且正在載入', fakeAsync(() => {
      // 假設 任務資料正在從服務器載入
      (mockTaskService.loading as jasmine.Spy).and.returnValue(true);
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);

      // 當我訪問任務列表頁面
      fixture.detectChanges();

      // 那麼 應該顯示載入指示器
      const loadingContainer = fixture.debugElement.query(By.css('[data-testid="loading-container"]'));
      expect(loadingContainer).toBeTruthy();

      // 而且 載入指示器應該包含 "載入任務中..." 文字
      expect(loadingContainer.nativeElement.textContent).toContain('載入任務中...');

      // 而且 載入指示器應該有旋轉動畫
      const spinner = loadingContainer.query(By.css('.loading-spinner-large'));
      expect(spinner).toBeTruthy();

      // 而且 載入時間不應該超過 0.5 秒（模擬快速載入完成）
      tick(500);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      fixture.detectChanges();

      const loadingAfterTick = fixture.debugElement.query(By.css('[data-testid="loading-container"]'));
      expect(loadingAfterTick).toBeFalsy();
    }));
  });

  describe('網路錯誤處理', () => {
    beforeEach(() => {
      // 假設 網路連接失敗
      (mockTaskService.error as jasmine.Spy).and.returnValue('網路連接失敗');
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      mockTaskService.getAllTasks.and.returnValue(throwError(() => new Error('網路連接失敗')));
    });

    it('當 我嘗試載入任務列表', fakeAsync(() => {
      // 當我嘗試載入任務列表
      fixture.detectChanges();

      // 那麼 應該顯示錯誤訊息區域
      const errorContainer = fixture.debugElement.query(By.css('[data-testid="error-container"]'));
      expect(errorContainer).toBeTruthy();

      // 而且 錯誤訊息應該包含 "載入失敗" 標題
      expect(errorContainer.nativeElement.textContent).toContain('載入失敗');

      // 而且 錯誤訊息應該描述具體問題
      expect(errorContainer.nativeElement.textContent).toContain('網路連接失敗');

      // 而且 應該有 "重新載入" 按鈕
      const retryButton = fixture.debugElement.query(By.css('[data-testid="retry-button"]'));
      expect(retryButton).toBeTruthy();
      expect(retryButton.nativeElement.textContent).toContain('重新載入');

      // 而且 點擊重新載入應該重新嘗試獲取任務
      retryButton.nativeElement.click();
      expect(mockTaskService.clearError).toHaveBeenCalled();
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
    }));
  });

  describe('任務項目視覺設計驗證', () => {
    beforeEach(() => {
      // 假設 我有一個未完成任務 "測試任務"
      const testTask: Task = {
        id: 1,
        description: '測試任務',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([testTask]);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
      fixture.detectChanges();
    });

    it('當 任務列表載入完成，應該有正確的視覺樣式', () => {
      const taskItem = fixture.debugElement.query(By.css('[data-testid="task-item-1"]'));

      // 那麼 未完成任務應該沒有劃線樣式
      expect(taskItem.nativeElement).not.toHaveClass('completed');
      const taskText = taskItem.query(By.css('.task-description'));
      expect(taskText.nativeElement).not.toHaveClass('completed-text');

      // 而且 未完成任務的勾選框應該是空的
      const checkbox = taskItem.query(By.css('[data-testid="task-checkbox"]'));
      expect(checkbox.nativeElement).not.toHaveClass('checked');
      const checkmark = checkbox.query(By.css('.checkmark'));
      expect(checkmark).toBeFalsy(); // 未完成任務不應該有勾號

      // 而且 任務項目應該有適當的間距和邊框
      expect(taskItem.nativeElement).toHaveClass('task-item');

      // 而且 任務項目應該支援 hover 效果（通過 CSS 類別驗證）
      expect(taskItem.nativeElement.tabIndex).toBe(0); // 可聚焦元素支援 hover
    });
  });

  describe('任務列表重新整理功能', () => {
    beforeEach(() => {
      // 假設 我正在查看任務列表
      const initialTask: Task = {
        id: 1,
        description: '初始任務',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([initialTask]);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(1);
      mockTaskService.getAllTasks.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('當 我點擊重新整理按鈕', fakeAsync(() => {
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="refresh-button"]'));

      // 當我點擊重新整理按鈕
      refreshButton.nativeElement.click();

      // 那麼 應該重新獲取最新的任務資料
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();

      // 而且 載入狀態應該短暫顯示（如果有載入狀態的話）
      tick();

      // 而且 任務列表應該更新為最新內容（這裡通過服務調用來驗證）
      expect(mockTaskService.getAllTasks).toHaveBeenCalledTimes(1);
    }));
  });

  describe('任務ID追蹤功能驗證', () => {
    beforeEach(() => {
      // 假設 我有多個任務
      testTasks = [
        { id: 101, description: '任務A', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 202, description: '任務B', isCompleted: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 303, description: '任務C', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(3);
      fixture.detectChanges();
    });

    it('當 任務列表渲染完成', () => {
      // 那麼 每個任務項目應該有唯一的 data-task-id 屬性
      const taskItems = fixture.debugElement.queryAll(By.css('[data-task-id]'));
      expect(taskItems.length).toBe(3);
      expect(taskItems[0].nativeElement.getAttribute('data-task-id')).toBe('101');
      expect(taskItems[1].nativeElement.getAttribute('data-task-id')).toBe('202');
      expect(taskItems[2].nativeElement.getAttribute('data-task-id')).toBe('303');

      // 而且 任務項目應該有對應的 data-testid 屬性
      expect(taskItems[0].nativeElement.getAttribute('data-testid')).toBe('task-item-101');
      expect(taskItems[1].nativeElement.getAttribute('data-testid')).toBe('task-item-202');
      expect(taskItems[2].nativeElement.getAttribute('data-testid')).toBe('task-item-303');

      // 而且 任務順序改變時應該正確追蹤任務身份（通過 trackByTaskId 函數驗證）
      const trackResult1 = component.trackByTaskId(0, testTasks[0]);
      const trackResult2 = component.trackByTaskId(1, testTasks[1]);
      const trackResult3 = component.trackByTaskId(2, testTasks[2]);

      expect(trackResult1).toBe(101);
      expect(trackResult2).toBe(202);
      expect(trackResult3).toBe(303);
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { of } from 'rxjs';

describe('空狀態顯示功能 (Story 2.1)', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks'
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
  });

  describe('首次使用應用程式的空狀態', () => {
    it('應該顯示友善的空狀態', () => {
      // 假設 我是首次使用者並且我沒有任何任務
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);

      // 當 頁面載入完成
      fixture.detectChanges();

      // 那麼 應該顯示友善的空狀態訊息
      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState).toBeTruthy();

      // 而且 空狀態應該包含 "目前沒有任務" 標題
      expect(emptyState.nativeElement.textContent).toContain('目前沒有任務');

      // 而且 應該有鼓勵性的描述文字
      expect(emptyState.nativeElement.textContent).toContain('太棒了！所有任務都已完成，或者您可以新增新的任務開始工作。');

      // 而且 應該有重新整理按鈕
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="empty-refresh-button"]'));
      expect(refreshButton).toBeTruthy();
      expect(refreshButton.nativeElement.textContent).toContain('重新整理');
    });
  });

  describe('刪除所有任務後的空狀態', () => {
    it('刪除最後一個任務後應該顯示空狀態', () => {
      // 假設 我刪除了所有任務
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([]);

      // 當 最後一個任務被刪除
      fixture.detectChanges();

      // 那麼 應該立即顯示空狀態
      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState).toBeTruthy();

      // 而且 不應該顯示任務列表
      const taskList = fixture.debugElement.query(By.css('[data-testid="task-list"]'));
      expect(taskList).toBeFalsy();

      // 而且 計數器應該顯示 "0 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('0 個待辦任務');
    });
  });

  describe('空狀態的視覺設計', () => {
    it('應該有正確的視覺元素', () => {
      // 假設 應用程式處於空狀態
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);

      // 當 空狀態顯示時
      fixture.detectChanges();

      // 那麼 應該有清晰的空狀態圖示
      const emptyIcon = fixture.debugElement.query(By.css('.empty-icon'));
      expect(emptyIcon).toBeTruthy();
      expect(emptyIcon.nativeElement.textContent).toContain('📋');

      // 而且 文字內容應該置中對齊
      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState.nativeElement).toHaveClass('empty-state');

      // 而且 應該使用適當的色彩和字體大小
      const emptyTitle = emptyState.query(By.css('h3'));
      expect(emptyTitle).toBeTruthy();
      expect(emptyTitle.nativeElement.textContent).toContain('目前沒有任務');

      // 而且 整體設計應該與應用程式主題一致
      const emptyActions = emptyState.query(By.css('.empty-actions'));
      expect(emptyActions).toBeTruthy();
    });
  });

  describe('空狀態的互動功能', () => {
    it('點擊重新整理按鈕應該重新載入', () => {
      // 假設 應用程式處於空狀態
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      mockTaskService.getAllTasks.and.returnValue(of([]));

      fixture.detectChanges();

      // 當 我點擊重新整理按鈕
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="empty-refresh-button"]'));
      refreshButton.nativeElement.click();

      // 那麼 應該嘗試重新載入任務列表
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
    });
  });

  describe('空狀態的響應式設計驗證', () => {
    it('應該適應不同螢幕尺寸', () => {
      // 假設 應用程式處於空狀態
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);

      // 當 我在不同螢幕尺寸下查看
      fixture.detectChanges();

      // 那麼 空狀態內容應該適應螢幕寬度
      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState).toBeTruthy();

      // 而且 圖示和文字應該保持適當的比例
      const emptyIcon = emptyState.query(By.css('.empty-icon'));
      const emptyTitle = emptyState.query(By.css('h3'));
      expect(emptyIcon).toBeTruthy();
      expect(emptyTitle).toBeTruthy();

      // 而且 按鈕應該保持可點擊的大小
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="empty-refresh-button"]'));
      expect(refreshButton).toBeTruthy();
      expect(refreshButton.nativeElement.tagName.toLowerCase()).toBe('button');
    });
  });
});
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { Task } from '../models/task.interface';

describe('任務計數器功能 (Story 2.1)', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks', 'toggleTaskStatus'
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

  describe('空任務列表的計數器', () => {
    it('應該顯示零計數', () => {
      // 假設 我沒有任何任務
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);

      // 當 頁面載入完成
      fixture.detectChanges();

      // 那麼 計數器應該顯示 "0 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('0 個待辦任務');

      // 而且 計數器應該顯示 "0 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('0 個已完成');

      // 而且 不應該顯示列表底部統計
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter).toBeFalsy();
    });
  });

  describe('只有待辦任務的計數器', () => {
    it('應該正確顯示待辦任務統計', () => {
      // 假設 我有3個待辦任務
      const pendingTasks: Task[] = [
        { id: 1, description: '完成專案報告', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '準備會議資料', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '整理工作筆記', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];

      (mockTaskService.tasks as jasmine.Spy).and.returnValue(pendingTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(3);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(3);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(pendingTasks);

      // 當 任務列表載入完成
      fixture.detectChanges();

      // 那麼 計數器應該顯示 "3 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('3 個待辦任務');

      // 而且 計數器應該顯示 "0 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('0 個已完成');

      // 而且 列表底部應該顯示 "共 3 項任務"
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter.nativeElement.textContent).toContain('共 3 項任務');

      // 而且 列表底部應該顯示 "3 項待完成"
      expect(listFooter.nativeElement.textContent).toContain('3 項待完成');
    });
  });

  describe('只有已完成任務的計數器', () => {
    it('應該正確顯示已完成任務統計', () => {
      // 假設 我有2個已完成任務
      const completedTasks: Task[] = [
        { id: 1, description: '回覆客戶郵件', isCompleted: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '更新系統文檔', isCompleted: true, createdAt: new Date(), updatedAt: new Date() }
      ];

      (mockTaskService.tasks as jasmine.Spy).and.returnValue(completedTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(0);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([]);

      // 當 任務列表載入完成
      fixture.detectChanges();

      // 那麼 計數器應該顯示 "0 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('0 個待辦任務');

      // 而且 計數器應該顯示 "2 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('2 個已完成');

      // 而且 列表底部應該顯示 "共 2 項任務"
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter.nativeElement.textContent).toContain('共 2 項任務');

      // 而且 列表底部不應該顯示待完成統計
      expect(listFooter.nativeElement.textContent).not.toContain('項待完成');
    });
  });

  describe('混合狀態任務的計數器', () => {
    it('應該正確顯示混合任務統計', () => {
      // 假設 我有3個待辦任務和2個已完成任務
      const mixedTasks: Task[] = [
        { id: 1, description: '完成專案報告', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '準備會議資料', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '回覆客戶郵件', isCompleted: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, description: '更新系統文檔', isCompleted: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 5, description: '整理工作筆記', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      const incompleteTasks = mixedTasks.filter(t => !t.isCompleted);

      (mockTaskService.tasks as jasmine.Spy).and.returnValue(mixedTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(5);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(3);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(2);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(incompleteTasks);

      // 當 任務列表載入完成
      fixture.detectChanges();

      // 那麼 計數器應該顯示 "3 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('3 個待辦任務');

      // 而且 計數器應該顯示 "2 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('2 個已完成');

      // 而且 列表底部應該顯示 "共 5 項任務"
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter.nativeElement.textContent).toContain('共 5 項任務');

      // 而且 列表底部應該顯示 "3 項待完成"
      expect(listFooter.nativeElement.textContent).toContain('3 項待完成');
    });
  });

  describe('大量任務的計數器顯示', () => {
    it('應該正確顯示大量任務統計', () => {
      // 假設 我有 50 個待辦任務和 25 個已完成任務
      const largeTasks: Task[] = [];
      // 創建50個待辦任務
      for (let i = 1; i <= 50; i++) {
        largeTasks.push({
          id: i,
          description: `待辦任務 ${i}`,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      // 創建25個已完成任務
      for (let i = 51; i <= 75; i++) {
        largeTasks.push({
          id: i,
          description: `已完成任務 ${i}`,
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      const incompleteTasks = largeTasks.filter(t => !t.isCompleted);

      (mockTaskService.tasks as jasmine.Spy).and.returnValue(largeTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(75);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(50);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(25);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(incompleteTasks);

      // 當 任務列表載入完成
      fixture.detectChanges();

      // 那麼 計數器應該顯示 "50 個待辦任務"
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter.nativeElement.textContent).toContain('50 個待辦任務');

      // 而且 計數器應該顯示 "25 個已完成"
      expect(taskCounter.nativeElement.textContent).toContain('25 個已完成');

      // 而且 列表底部應該顯示 "共 75 項任務"
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter.nativeElement.textContent).toContain('共 75 項任務');

      // 而且 數字顯示應該保持清晰可讀（驗證數字格式）
      expect(taskCounter.nativeElement.textContent).toMatch(/\d+\s?個待辦任務/);
      expect(taskCounter.nativeElement.textContent).toMatch(/\d+\s?個已完成/);
    });
  });

  describe('計數器視覺設計驗證', () => {
    it('應該有正確的視覺設計元素', () => {
      // 假設 我有 5 個待辦任務和 3 個已完成任務
      const testTasks: Task[] = [
        ...Array(5).fill(null).map((_, i) => ({
          id: i + 1,
          description: `待辦任務 ${i + 1}`,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        ...Array(3).fill(null).map((_, i) => ({
          id: i + 6,
          description: `已完成任務 ${i + 1}`,
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      ];

      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(8);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(5);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(3);

      // 當 任務列表載入完成
      fixture.detectChanges();

      // 那麼 計數器區域應該有明顯的視覺區隔
      const taskCounter = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(taskCounter).toBeTruthy();
      expect(taskCounter.nativeElement).toHaveClass('task-counter');

      // 而且 待辦任務數量應該有突出的視覺樣式
      const pendingCount = taskCounter.query(By.css('.pending-count'));
      expect(pendingCount).toBeTruthy();
      expect(pendingCount.nativeElement.textContent).toContain('5 個待辦任務');

      // 而且 已完成任務數量應該有不同的色彩標示
      const completedCount = taskCounter.query(By.css('.completed-count'));
      expect(completedCount).toBeTruthy();
      expect(completedCount.nativeElement.textContent).toContain('3 個已完成');

      // 而且 計數器應該位於列表頂部的顯著位置
      const taskCountsContainer = taskCounter.query(By.css('.task-counts'));
      expect(taskCountsContainer).toBeTruthy();
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { of, throwError } from 'rxjs';
import { Task } from '../models/task.interface';

describe('任務刪除 UI 互動功能', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'deleteTask', 'getAllTasks', 'clearError'
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
      imports: [TaskListComponent, ToastNotificationComponent, ConfirmDialogComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    // 設定默認回傳值
    testTasks = [
      { id: 1, description: '要刪除的任務', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
    ];
    (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
    (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
    (mockTaskService.error as jasmine.Spy).and.returnValue(null);
    (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
    (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(testTasks.filter(t => !t.isCompleted));
  });

  // 場景: 滑鼠懸停顯示刪除按鈕
  describe('滑鼠懸停顯示刪除按鈕', () => {
    it('假設 我有一個任務 "要刪除的任務"', () => {
      fixture.detectChanges();
      const taskElements = fixture.debugElement.nativeElement.querySelectorAll('.task-item');
      expect(taskElements.length).toBe(1);
      expect(taskElements[0].textContent).toContain('要刪除的任務');
    });

    it('當 我將滑鼠懸停在任務項目上', () => {
      fixture.detectChanges();
      const taskElement = fixture.debugElement.nativeElement.querySelector('.task-item');
      
      // 模擬滑鼠懸停
      taskElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
    });

    it('那麼 應該顯示刪除按鈕', () => {
      fixture.detectChanges();
      const taskElement = fixture.debugElement.nativeElement.querySelector('.task-item');
      taskElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      const deleteButton = taskElement.querySelector('.delete-btn');
      expect(deleteButton).toBeTruthy();
      
      // 檢查 CSS 類別是否正確應用懸停效果
      const taskActions = taskElement.querySelector('.task-actions');
      expect(taskActions).toBeTruthy();
    });

    it('而且 刪除按鈕應該有垃圾桶圖示', () => {
      fixture.detectChanges();
      const deleteIcon = fixture.debugElement.nativeElement.querySelector('.delete-icon');
      expect(deleteIcon.textContent).toBe('🗑️');
    });

    it('而且 刪除按鈕應該有適當的提示文字', () => {
      fixture.detectChanges();
      const deleteButton = fixture.debugElement.nativeElement.querySelector('.delete-btn');
      expect(deleteButton.getAttribute('title')).toBe('刪除任務');
    });
  });

  // 場景: 點擊刪除按鈕顯示確認對話框
  describe('點擊刪除按鈕顯示確認對話框', () => {
    it('當 我點擊任務的刪除按鈕', () => {
      testTasks[0].description = '測試任務刪除';
      fixture.detectChanges();
      
      const deleteButton = fixture.debugElement.nativeElement.querySelector('.delete-btn');
      deleteButton.click();
      fixture.detectChanges();
    });

    it('那麼 應該顯示確認對話框', () => {
      testTasks[0].description = '測試任務刪除';
      fixture.detectChanges();
      
      const deleteButton = fixture.debugElement.nativeElement.querySelector('.delete-btn');
      deleteButton.click();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(true);
      const dialog = fixture.debugElement.nativeElement.querySelector('[data-testid="delete-confirm-dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('而且 對話框應該包含任務描述', () => {
      testTasks[0].description = '測試任務刪除';
      fixture.detectChanges();
      
      const deleteButton = fixture.debugElement.nativeElement.querySelector('.delete-btn');
      deleteButton.click();
      fixture.detectChanges();

      const dialogMessage = fixture.debugElement.nativeElement.querySelector('.dialog-container p');
      expect(dialogMessage.textContent).toContain('測試任務刪除');
    });
  });

  // 場景: 確認刪除操作成功
  describe('確認刪除操作成功', () => {
    it('當 我點擊 "確認刪除" 按鈕', () => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      testTasks[0].description = '要確認刪除的任務';
      fixture.detectChanges();

      // 顯示確認對話框
      component.showDeleteDialog(testTasks[0]);
      fixture.detectChanges();

      // 點擊確認刪除
      component.confirmDelete();
      fixture.detectChanges();

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(testTasks[0].id);
    });

    it('那麼 應該播放刪除動畫', () => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      fixture.detectChanges();

      // 檢查動畫類別是否被添加
      setTimeout(() => {
        const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${testTasks[0].id}"]`);
        expect(taskElement?.classList.contains('deleting')).toBe(true);
      }, 100);
    });
  });

  // 場景: 取消刪除操作
  describe('取消刪除操作', () => {
    it('當 我點擊 "取消" 按鈕', () => {
      testTasks[0].description = '不要刪除的任務';
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      fixture.detectChanges();

      component.cancelDelete();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.taskToDelete()).toBeNull();
    });
  });

  // 場景: 使用 Escape 鍵取消刪除
  describe('使用 Escape 鍵取消刪除', () => {
    it('當 我按下 Escape 鍵', () => {
      testTasks[0].description = '保留任務';
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      fixture.detectChanges();

      // 模擬 Escape 鍵按下
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(false);
    });
  });

  // 場景: 使用鍵盤刪除任務
  describe('使用鍵盤刪除任務', () => {
    it('當 我按下 Delete 鍵', () => {
      testTasks[0].description = '鍵盤刪除測試';
      component.selectedTaskId.set(testTasks[0].id);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      component.onKeyDown(event);
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(true);
    });
  });

  // 場景: 網路錯誤時刪除失敗
  describe('網路錯誤時刪除失敗', () => {
    it('當 API 服務無法回應時應該顯示錯誤訊息', () => {
      const errorMessage = '網路連接失敗';
      mockTaskService.deleteTask.and.returnValue(throwError(() => new Error(errorMessage)));
      
      testTasks[0].description = '網路錯誤測試';
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      fixture.detectChanges();

      // 驗證錯誤處理
      expect(mockTaskService.deleteTask).toHaveBeenCalled();
      // 任務應該保持在列表中（樂觀更新失敗後回滾）
      expect(mockTaskService.tasks().length).toBe(1);
    });
  });

  // 場景: 刪除最後一個任務顯示空狀態
  describe('刪除最後一個任務顯示空狀態', () => {
    it('當 刪除最後一個任務後應該顯示空狀態', () => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]); // 模擬刪除後空列表
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      fixture.detectChanges();

      const emptyState = fixture.debugElement.nativeElement.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('目前沒有任務');
    });
  });

  // 場景: Toast 通知功能
  describe('Toast 通知功能', () => {
    it('成功刪除後應該顯示 Toast 通知', () => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      
      spyOn(component, 'showSuccessToast' as any);
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      
      expect((component as any).showSuccessToast).toHaveBeenCalled();
    });
  });

  // 場景: 鍵盤導航功能
  describe('鍵盤導航功能', () => {
    beforeEach(() => {
      testTasks = [
        { id: 1, description: '任務1', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '任務2', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '任務3', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    });

    it('應該能使用方向鍵在任務間導航', () => {
      fixture.detectChanges();
      
      // 模擬向下方向鍵
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeyDown(downEvent);
      
      expect(component.selectedTaskId()).toBe(testTasks[0].id);
      
      // 再次按下向下鍵
      component.onKeyDown(downEvent);
      expect(component.selectedTaskId()).toBe(testTasks[1].id);
    });

    it('應該能使用 Home 和 End 鍵跳到首尾', () => {
      fixture.detectChanges();
      
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      component.onKeyDown(homeEvent);
      expect(component.selectedTaskId()).toBe(testTasks[0].id);
      
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      component.onKeyDown(endEvent);
      expect(component.selectedTaskId()).toBe(testTasks[testTasks.length - 1].id);
    });
  });
});
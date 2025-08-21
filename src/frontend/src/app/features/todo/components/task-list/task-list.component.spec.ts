import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../services/task.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ToastNotificationComponent } from '../toast-notification/toast-notification.component';
import { Task } from '../../models/task.interface';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];

  beforeEach(async () => {
    // 創建 TaskService mock
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getAllTasks', 'toggleTaskStatus', 'deleteTask', 'updateTaskDescription', 'clearError'
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

    // 設置測試數據
    testTasks = [
      { 
        id: 1, 
        description: '完成專案報告', 
        isCompleted: false, 
        createdAt: new Date('2024-01-01T10:00:00Z'), 
        updatedAt: new Date('2024-01-01T10:00:00Z') 
      },
      { 
        id: 2, 
        description: '開會討論需求', 
        isCompleted: true, 
        createdAt: new Date('2024-01-01T09:00:00Z'), 
        updatedAt: new Date('2024-01-01T09:30:00Z') 
      }
    ];
  });

  describe('基本組件初始化', () => {
    it('應該成功創建組件', () => {
      expect(component).toBeTruthy();
    });

    it('應該初始化所有必要的屬性', () => {
      expect(component.showDeleteConfirm()).toBeFalse();
      expect(component.taskToDelete()).toBeNull();
      expect(component.selectedTaskId()).toBeNull();
      expect(component.editingTaskId()).toBeNull();
      expect(component.editingText()).toBe('');
      expect(component.originalText()).toBe('');
    });

    it('應該正確注入 TaskService', () => {
      expect(component.taskService).toBeTruthy();
      expect(component.taskService).toBe(mockTaskService);
    });
  });

  describe('計算屬性功能', () => {
    it('isEmpty - 當沒有任務時應該返回 true', () => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      expect(component.isEmpty()).toBe(true);
    });

    it('isEmpty - 當有任務時應該返回 false', () => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      expect(component.isEmpty()).toBe(false);
    });

    it('hasError - 當沒有錯誤時應該返回 false', () => {
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      expect(component.hasError()).toBe(false);
    });

    it('hasError - 當有錯誤時應該返回 true', () => {
      (mockTaskService.error as jasmine.Spy).and.returnValue('網路錯誤');
      expect(component.hasError()).toBe(true);
    });
  });

  describe('任務列表顯示功能', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(1);
      (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue([testTasks[0]]);
      fixture.detectChanges();
    });

    it('應該顯示任務計數器', () => {
      const counterElement = fixture.debugElement.query(By.css('[data-testid="task-counter"]'));
      expect(counterElement).toBeTruthy();
      expect(counterElement.nativeElement.textContent).toContain('1 個待辦任務');
      expect(counterElement.nativeElement.textContent).toContain('1 個已完成');
    });

    it('應該顯示任務列表', () => {
      const taskList = fixture.debugElement.query(By.css('[data-testid="task-list"]'));
      expect(taskList).toBeTruthy();

      const taskItems = fixture.debugElement.queryAll(By.css('[data-testid^="task-item-"]'));
      expect(taskItems.length).toBe(2);
    });

    it('應該正確顯示每個任務的內容', () => {
      const firstTaskItem = fixture.debugElement.query(By.css('[data-testid="task-item-1"]'));
      expect(firstTaskItem.nativeElement.textContent).toContain('完成專案報告');
      
      const secondTaskItem = fixture.debugElement.query(By.css('[data-testid="task-item-2"]'));
      expect(secondTaskItem.nativeElement.textContent).toContain('開會討論需求');
    });

    it('應該為已完成的任務添加 completed 類別', () => {
      const completedTask = fixture.debugElement.query(By.css('[data-testid="task-item-2"]'));
      expect(completedTask.nativeElement).toHaveClass('completed');
    });

    it('應該顯示列表底部資訊', () => {
      const listFooter = fixture.debugElement.query(By.css('[data-testid="list-footer"]'));
      expect(listFooter).toBeTruthy();
      expect(listFooter.nativeElement.textContent).toContain('共 2 項任務');
    });
  });

  describe('空狀態和載入狀態', () => {
    it('應該顯示載入指示器', () => {
      (mockTaskService.loading as jasmine.Spy).and.returnValue(true);
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      fixture.detectChanges();

      const loadingContainer = fixture.debugElement.query(By.css('[data-testid="loading-container"]'));
      expect(loadingContainer).toBeTruthy();
      expect(loadingContainer.nativeElement.textContent).toContain('載入任務中...');
    });

    it('應該顯示空狀態', () => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('[data-testid="empty-state"]'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('目前沒有任務');
    });

    it('空狀態應該有重新整理按鈕', () => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      fixture.detectChanges();

      const refreshButton = fixture.debugElement.query(By.css('[data-testid="empty-refresh-button"]'));
      expect(refreshButton).toBeTruthy();
    });
  });

  describe('錯誤處理功能', () => {
    it('應該顯示錯誤訊息', () => {
      (mockTaskService.error as jasmine.Spy).and.returnValue('網路連線失敗');
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('[data-testid="error-container"]'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('網路連線失敗');
    });

    it('應該有重試按鈕', () => {
      (mockTaskService.error as jasmine.Spy).and.returnValue('網路連線失敗');
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('[data-testid="retry-button"]'));
      expect(retryButton).toBeTruthy();
    });

    it('點擊重試按鈕應該清除錯誤並重新載入', () => {
      (mockTaskService.error as jasmine.Spy).and.returnValue('網路連線失敗');
      mockTaskService.getAllTasks.and.returnValue(of([]));
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('[data-testid="retry-button"]'));
      retryButton.nativeElement.click();

      expect(mockTaskService.clearError).toHaveBeenCalled();
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
    });
  });

  describe('任務狀態切換功能', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
      (mockTaskService.error as jasmine.Spy).and.returnValue(null);
      mockTaskService.toggleTaskStatus.and.returnValue(of(testTasks[0]));
      fixture.detectChanges();
    });

    it('應該呼叫 TaskService 切換狀態', () => {
      const task = testTasks[0];
      component.onTaskStatusToggle(task);

      expect(mockTaskService.toggleTaskStatus).toHaveBeenCalledWith(task);
    });

    it('點擊勾選框應該切換任務狀態', () => {
      const checkbox = fixture.debugElement.query(By.css('[data-testid="task-checkbox"]'));
      spyOn(component, 'onTaskStatusToggle');

      checkbox.nativeElement.click();

      expect(component.onTaskStatusToggle).toHaveBeenCalled();
    });

    it('任務狀態切換失敗時應該處理錯誤', () => {
      mockTaskService.toggleTaskStatus.and.returnValue(throwError(() => new Error('狀態更新失敗')));
      spyOn(console, 'error');

      const task = testTasks[0];
      component.onTaskStatusToggle(task);

      expect(console.error).toHaveBeenCalledWith('更新任務狀態失敗:', jasmine.any(Error));
    });
  });

  describe('刪除確認對話框功能', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      fixture.detectChanges();
    });

    it('showDeleteDialog 應該設置刪除確認狀態', () => {
      const task = testTasks[0];
      component.showDeleteDialog(task);

      expect(component.taskToDelete()).toBe(task);
      expect(component.showDeleteConfirm()).toBe(true);
    });

    it('cancelDelete 應該取消刪除操作', () => {
      const task = testTasks[0];
      component.showDeleteDialog(task);
      component.cancelDelete();

      expect(component.taskToDelete()).toBe(null);
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('confirmDelete 應該刪除任務', () => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      const task = testTasks[0];
      
      component.showDeleteDialog(task);
      component.confirmDelete();

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(task.id);
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('應該顯示確認對話框', () => {
      const task = testTasks[0];
      component.showDeleteDialog(task);
      fixture.detectChanges();

      const confirmDialog = fixture.debugElement.query(By.css('[data-testid="delete-confirm-dialog"]'));
      expect(confirmDialog).toBeTruthy();
    });
  });

  describe('內嵌編輯功能', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      fixture.detectChanges();
    });

    it('startEditing 應該進入編輯模式', () => {
      const task = testTasks[0];
      component.startEditing(task);

      expect(component.editingTaskId()).toBe(task.id);
      expect(component.editingText()).toBe(task.description);
      expect(component.originalText()).toBe(task.description);
    });

    it('cancelEditing 應該退出編輯模式', () => {
      const task = testTasks[0];
      component.startEditing(task);
      component.cancelEditing();

      expect(component.editingTaskId()).toBe(null);
      expect(component.editingText()).toBe('');
      expect(component.originalText()).toBe('');
    });

    it('isEditing 應該正確判斷編輯狀態', () => {
      const task = testTasks[0];
      expect(component.isEditing(task.id)).toBe(false);

      component.startEditing(task);
      expect(component.isEditing(task.id)).toBe(true);
    });

    it('saveEdit 應該更新任務描述', () => {
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...testTasks[0],
        description: '更新後的描述'
      }));

      const task = testTasks[0];
      component.startEditing(task);
      component.editingText.set('更新後的描述');
      component.saveEdit();

      expect(mockTaskService.updateTaskDescription).toHaveBeenCalledWith(task.id, '更新後的描述');
    });

    it('雙擊任務文字應該進入編輯模式', () => {
      spyOn(component, 'startEditing');
      const task = testTasks[0];
      
      component.onTaskTextDoubleClick(task);
      
      expect(component.startEditing).toHaveBeenCalledWith(task);
    });
  });

  describe('輔助功能', () => {
    it('trackByTaskId 應該返回任務 ID', () => {
      const task = testTasks[0];
      const result = component.trackByTaskId(0, task);
      expect(result).toBe(task.id);
    });

    it('formatDate 應該正確格式化時間', () => {
      // 測試 "剛剛"
      const now = new Date();
      expect(component.formatDate(now)).toBe('剛剛');

      // 測試分鐘前
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(component.formatDate(fiveMinutesAgo)).toBe('5 分鐘前');

      // 測試小時前
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(component.formatDate(twoHoursAgo)).toBe('2 小時前');
    });

    it('reloadTasks 應該呼叫 TaskService', () => {
      mockTaskService.getAllTasks.and.returnValue(of([]));
      component.reloadTasks();
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
    });

    it('點擊重新整理按鈕應該重新載入任務', () => {
      mockTaskService.getAllTasks.and.returnValue(of([]));
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      fixture.detectChanges();

      const refreshButton = fixture.debugElement.query(By.css('[data-testid="refresh-button"]'));
      refreshButton.nativeElement.click();

      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
    });
  });

  describe('動畫和視覺效果', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      fixture.detectChanges();
    });

    it('isTaskAnimating 應該正確判斷動畫狀態', () => {
      const taskId = testTasks[0].id;
      expect(component.isTaskAnimating(taskId, 'completing')).toBe(false);

      // 手動設置動畫狀態進行測試
      component['animatingTasks'].update(tasks => {
        const newTasks = new Map(tasks);
        newTasks.set(taskId, 'completing');
        return newTasks;
      });

      expect(component.isTaskAnimating(taskId, 'completing')).toBe(true);
    });

    it('任務項目應該有正確的 data-task-id 屬性', () => {
      const taskItems = fixture.debugElement.queryAll(By.css('[data-task-id]'));
      expect(taskItems.length).toBe(2);
      expect(taskItems[0].nativeElement.getAttribute('data-task-id')).toBe('1');
      expect(taskItems[1].nativeElement.getAttribute('data-task-id')).toBe('2');
    });
  });

  describe('鍵盤操作支援', () => {
    beforeEach(() => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      fixture.detectChanges();
    });

    it('應該支援空白鍵切換勾選框', () => {
      spyOn(component, 'onTaskStatusToggle');
      const task = testTasks[0];

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      component.onCheckboxKeydown(event, task);

      expect(component.onTaskStatusToggle).toHaveBeenCalledWith(task);
    });

    it('應該支援 Enter 鍵切換勾選框', () => {
      spyOn(component, 'onTaskStatusToggle');
      const task = testTasks[0];

      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      component.onCheckboxKeydown(event, task);

      expect(component.onTaskStatusToggle).toHaveBeenCalledWith(task);
    });

    it('編輯模式下 Enter 鍵應該保存', () => {
      spyOn(component, 'saveEdit');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      component.onEditKeydown(event);
      
      expect(component.saveEdit).toHaveBeenCalled();
    });

    it('編輯模式下 Escape 鍵應該取消', () => {
      spyOn(component, 'cancelEditing');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      component.onEditKeydown(event);
      
      expect(component.cancelEditing).toHaveBeenCalled();
    });
  });
});
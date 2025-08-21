import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Task } from '../models/task.interface';
import { By } from '@angular/platform-browser';

describe('任務內嵌編輯功能', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];
  let editingTask: Task;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'updateTaskDescription', 'getAllTasks', 'clearError'
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
      imports: [TaskListComponent, ToastNotificationComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    testTasks = [
      { id: 1, description: '完成專案報告', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
    ];
    (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
    (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
    (mockTaskService.error as jasmine.Spy).and.returnValue(null);
    (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
    (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(testTasks.filter(t => !t.isCompleted));

    editingTask = testTasks[0];
  });

  // 背景
  describe('背景設定', () => {
    it('假設 我有一個待辦事項列表', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('而且 列表中有一個任務 "完成專案報告"', () => {
      fixture.detectChanges();
      const taskElements = fixture.debugElement.nativeElement.querySelectorAll('.task-item');
      expect(taskElements.length).toBe(1);
      expect(taskElements[0].textContent).toContain('完成專案報告');
    });
  });

  // 場景: 雙擊任務文字進入編輯模式
  describe('雙擊任務文字進入編輯模式', () => {
    it('當 我雙擊任務文字 "完成專案報告"', () => {
      fixture.detectChanges();
      const taskText = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      
      // 模擬雙擊事件
      taskText.dispatchEvent(new MouseEvent('dblclick'));
      fixture.detectChanges();
    });

    it('那麼 任務應該進入編輯模式', () => {
      fixture.detectChanges();
      const taskText = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      taskText.dispatchEvent(new MouseEvent('dblclick'));
      fixture.detectChanges();

      expect(component.editingTaskId()).toBe(editingTask.id);
    });

    it('而且 文字應該變成可編輯的輸入框', () => {
      fixture.detectChanges();
      const taskText = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      taskText.dispatchEvent(new MouseEvent('dblclick'));
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`);
      expect(editInput).toBeTruthy();
      expect(editInput.tagName.toLowerCase()).toBe('input');
    });

    it('而且 輸入框應該獲得焦點', fakeAsync(() => {
      fixture.detectChanges();
      const taskText = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      taskText.dispatchEvent(new MouseEvent('dblclick'));
      fixture.detectChanges();
      tick();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`);
      expect(document.activeElement).toBe(editInput);
    }));

    it('而且 文字應該被全選', fakeAsync(() => {
      fixture.detectChanges();
      const taskText = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      taskText.dispatchEvent(new MouseEvent('dblclick'));
      fixture.detectChanges();
      tick();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      expect(editInput.selectionStart).toBe(0);
      expect(editInput.selectionEnd).toBe(editInput.value.length);
    }));
  });

  // 場景: 按 Enter 鍵保存編輯
  describe('按 Enter 鍵保存編輯', () => {
    it('假設 我正在編輯任務 "完成專案報告"', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();
      
      expect(component.editingTaskId()).toBe(editingTask.id);
    });

    it('當 我修改文字為 "完成季度專案報告" 而且 我按下 Enter 鍵', fakeAsync(() => {
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...editingTask,
        description: '完成季度專案報告',
        updatedAt: new Date()
      }));

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();
      tick(); // 等待 setTimeout

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      expect(editInput).toBeTruthy(); // 確保找到元素
      
      // 直接更新組件的編輯文字信號
      component.editingText.set('完成季度專案報告');
      editInput.value = '完成季度專案報告'; // 也更新 DOM 中的值以保持一致

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      expect(mockTaskService.updateTaskDescription).toHaveBeenCalledWith(editingTask.id, '完成季度專案報告');
    }));

    it('那麼 任務文字應該更新為 "完成季度專案報告"', fakeAsync(() => {
      const updatedTask = { ...editingTask, description: '完成季度專案報告' };
      mockTaskService.updateTaskDescription.and.returnValue(of(updatedTask));
      
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([updatedTask]);

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('完成季度專案報告');
      editInput.value = '完成季度專案報告'; // 也更新 DOM 中的值以保持一致
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      const taskDescription = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      expect(taskDescription.textContent.trim()).toBe('完成季度專案報告');
    }));

    it('而且 編輯模式應該結束', fakeAsync(() => {
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...editingTask,
        description: '完成季度專案報告'
      }));

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges(); // 讓 Angular 更新 DOM
      
      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('完成季度專案報告');
      editInput.value = '完成季度專案報告'; // 也更新 DOM 中的值以保持一致
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      expect(component.editingTaskId()).toBeNull();
    }));

    it('而且 應該顯示保存成功的提示', fakeAsync(() => {
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...editingTask,
        description: '完成季度專案報告'
      }));

      spyOn(component, 'showSuccessToast' as any);

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges(); // 讓 Angular 更新 DOM
      
      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('完成季度專案報告');
      editInput.value = '完成季度專案報告'; // 也更新 DOM 中的值以保持一致
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      expect((component as any).showSuccessToast).toHaveBeenCalled();
    }));
  });

  // 場景: 按 Escape 鍵取消編輯
  describe('按 Escape 鍵取消編輯', () => {
    it('假設 我正在編輯任務 "完成專案報告"', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();
      
      expect(component.editingTaskId()).toBe(editingTask.id);
    });

    it('當 我修改文字為 "錯誤的修改" 而且 我按下 Escape 鍵', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('錯誤的修改');
      editInput.value = '錯誤的修改'; // 也更新 DOM 中的值以保持一致

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      editInput.dispatchEvent(escapeEvent);
      fixture.detectChanges();
    });

    it('那麼 任務文字應該回滾到 "完成專案報告"', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges(); // 讓 Angular 更新 DOM
      
      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('錯誤的修改');
      editInput.value = '錯誤的修改'; // 也更新 DOM 中的值以保持一致
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      editInput.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      const taskDescription = fixture.debugElement.nativeElement.querySelector('.task-description.task-text');
      expect(taskDescription.textContent.trim()).toBe('完成專案報告');
    });

    it('而且 編輯模式應該結束', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`);
      editInput.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      expect(component.editingTaskId()).toBeNull();
    });
  });

  // 場景: 點擊外部自動保存
  describe('點擊外部自動保存', () => {
    it('假設 我正在編輯任務，當我修改文字並點擊外部時應該自動保存', fakeAsync(() => {
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...editingTask,
        description: '更新專案報告'
      }));

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      
      // 直接更新組件的編輯文字信號
      component.editingText.set('更新專案報告');
      editInput.value = '更新專案報告'; // 也更新 DOM 中的值以保持一致

      // 模擬輸入框失去焦點（這會觸發自動保存）
      editInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      tick(); // 等待 setTimeout 在 onEditBlur 中執行

      expect(mockTaskService.updateTaskDescription).toHaveBeenCalledWith(editingTask.id, '更新專案報告');
      expect(component.editingTaskId()).toBeNull();
    }));
  });

  // 場景: 空白內容驗證
  describe('空白內容驗證', () => {
    it('當我刪除所有文字並按 Enter 時應該顯示錯誤', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      spyOn(component, 'showErrorToast' as any);

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('');
      editInput.value = ''; // 也更新 DOM 中的值以保持一致

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();

      expect((component as any).showErrorToast).toHaveBeenCalledWith('任務描述不能為空白');
      expect(component.editingTaskId()).toBe(editingTask.id);
    });
  });

  // 場景: 編輯模式視覺效果
  describe('編輯模式視覺效果', () => {
    it('編輯時應該有正確的 CSS 類別', () => {
      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`);
      expect(editInput.classList.contains('editing')).toBe(true);
      
      const taskItem = fixture.debugElement.nativeElement.querySelector('.task-item');
      expect(taskItem.classList.contains('editing-mode')).toBe(true);
    });
  });

  // 場景: 網路錯誤時的回滾機制
  describe('網路錯誤時的回滾機制', () => {
    it('網路錯誤時應該回滾並顯示錯誤訊息', fakeAsync(() => {
      const networkError = new HttpErrorResponse({
        status: 0,
        statusText: 'Network Error'
      });
      mockTaskService.updateTaskDescription.and.returnValue(throwError(() => networkError));

      spyOn(component, 'showErrorToast' as any);

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set('網路測試修改');
      editInput.value = '網路測試修改'; // 也更新 DOM 中的值以保持一致

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith('保存失敗，請檢查網路連接');
      expect(component.editingTaskId()).toBeNull();
    }));
  });

  // 場景: 長文字編輯支援
  describe('長文字編輯支援', () => {
    it('應該支援長文字編輯和顯示', fakeAsync(() => {
      const longText = '完成第一季度的重要專案報告，包含所有相關數據分析和建議，確保品質符合公司標準';
      mockTaskService.updateTaskDescription.and.returnValue(of({
        ...editingTask,
        description: longText
      }));

      fixture.detectChanges();
      component.startEditing(editingTask);
      fixture.detectChanges();

      const editInput = fixture.debugElement.nativeElement.querySelector(`[data-testid="edit-input-${editingTask.id}"]`) as HTMLInputElement;
      // 直接更新組件的編輯文字信號
      component.editingText.set(longText);
      editInput.value = longText; // 也更新 DOM 中的值以保持一致

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      editInput.dispatchEvent(enterEvent);
      fixture.detectChanges();
      tick();

      expect(mockTaskService.updateTaskDescription).toHaveBeenCalledWith(editingTask.id, longText);
    }));
  });
});
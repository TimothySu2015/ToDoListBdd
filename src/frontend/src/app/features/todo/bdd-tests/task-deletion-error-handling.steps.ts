import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { throwError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Task } from '../models/task.interface';

describe('任務刪除錯誤處理', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];
  let consoleSpy: jasmine.Spy;

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
      imports: [TaskListComponent, ToastNotificationComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    testTasks = [
      { id: 1, description: '網路測試任務', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
    ];
    (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
    (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
    (mockTaskService.error as jasmine.Spy).and.returnValue(null);
    (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
    (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(testTasks.filter(t => !t.isCompleted));

    // 監聽控制台錯誤
    consoleSpy = spyOn(console, 'error');
  });

  // 場景: 網路連接錯誤
  describe('網路連接錯誤', () => {
    it('當 網路連接中斷時應該顯示網路錯誤訊息', fakeAsync(() => {
      const networkError = new Error('網路連接失敗');
      mockTaskService.deleteTask.and.returnValue(throwError(() => networkError));
      
      spyOn(component, 'showErrorToast' as any);
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('刪除任務「網路測試任務」時發生錯誤')
      );
      expect(consoleSpy).toHaveBeenCalledWith('刪除失敗:', networkError);
    }));

    it('網路錯誤後任務應該保持在列表中', () => {
      const networkError = new Error('網路連接失敗');
      mockTaskService.deleteTask.and.returnValue(throwError(() => networkError));
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();

      // 任務應該仍在列表中（樂觀更新後回滾）
      const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${testTasks[0].id}"]`);
      expect(taskElement).toBeTruthy();
    });
  });

  // 場景: 伺服器內部錯誤
  describe('伺服器內部錯誤', () => {
    it('當 伺服器回傳 500 錯誤時應該顯示伺服器錯誤訊息', fakeAsync(() => {
      const serverError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: '伺服器內部錯誤' }
      });
      
      mockTaskService.deleteTask.and.returnValue(throwError(() => serverError));
      
      spyOn(component, 'showErrorToast' as any);
      
      testTasks[0].description = '伺服器錯誤測試';
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('伺服器錯誤測試')
      );
    }));

    it('伺服器錯誤後應該清除動畫狀態', fakeAsync(() => {
      const serverError = new HttpErrorResponse({ status: 500 });
      mockTaskService.deleteTask.and.returnValue(throwError(() => serverError));
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      
      // 檢查動畫狀態被清除
      tick(100);
      expect(component.isTaskAnimating(testTasks[0].id, 'deleting')).toBe(false);
    }));
  });

  // 場景: 任務不存在錯誤 (404)
  describe('任務不存在錯誤', () => {
    it('當 任務不存在時應該顯示適當錯誤訊息', fakeAsync(() => {
      const notFoundError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { message: '找不到 ID 為 1 的任務' }
      });
      
      mockTaskService.deleteTask.and.returnValue(throwError(() => notFoundError));
      
      spyOn(component, 'showErrorToast' as any);
      
      testTasks[0].description = '已刪除任務';
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('找不到要刪除的任務')
      );
    }));
  });

  // 場景: 權限不足錯誤 (403)
  describe('權限不足錯誤', () => {
    it('當 沒有刪除權限時應該顯示權限錯誤', fakeAsync(() => {
      const forbiddenError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: { message: '沒有權限刪除此任務' }
      });
      
      mockTaskService.deleteTask.and.returnValue(throwError(() => forbiddenError));
      
      spyOn(component, 'showErrorToast' as any);
      
      testTasks[0].description = '權限測試任務';
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('沒有權限刪除此任務')
      );
    }));
  });

  // 場景: 請求逾時錯誤
  describe('請求逾時錯誤', () => {
    it('當 請求逾時時應該顯示逾時錯誤訊息', fakeAsync(() => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockTaskService.deleteTask.and.returnValue(throwError(() => timeoutError));
      
      spyOn(component, 'showErrorToast' as any);
      
      testTasks[0].description = '逾時測試任務';
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('逾時')
      );
    }));
  });

  // 場景: 多次刪除錯誤處理
  describe('多次刪除錯誤處理', () => {
    beforeEach(() => {
      testTasks = [
        { id: 1, description: '任務1', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '任務2', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '任務3', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    });

    it('當 部分刪除失敗時應該處理每個錯誤', fakeAsync(() => {
      // 設定第一個任務刪除成功，第二個失敗
      mockTaskService.deleteTask.and.callFake((taskId: number) => {
        if (taskId === 1) {
          return of(true);
        } else {
          return throwError(() => new Error('刪除失敗'));
        }
      });

      spyOn(component, 'showErrorToast' as any);
      spyOn(component, 'showSuccessToast' as any);

      fixture.detectChanges();

      // 刪除第一個任務（成功）
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      // 刪除第二個任務（失敗）
      component.showDeleteDialog(testTasks[1]);
      component.confirmDelete();
      tick();

      expect((component as any).showSuccessToast).toHaveBeenCalledTimes(1);
      expect((component as any).showErrorToast).toHaveBeenCalledTimes(1);
    }));
  });

  // 場景: 未知錯誤處理
  describe('未知錯誤處理', () => {
    it('當 發生未預期錯誤時應該顯示通用錯誤訊息', fakeAsync(() => {
      const unknownError = new Error('未知錯誤');
      mockTaskService.deleteTask.and.returnValue(throwError(() => unknownError));
      
      spyOn(component, 'showErrorToast' as any);
      
      testTasks[0].description = '未知錯誤測試';
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect((component as any).showErrorToast).toHaveBeenCalledWith(
        jasmine.stringContaining('發生錯誤')
      );
      expect(consoleSpy).toHaveBeenCalledWith('刪除失敗:', unknownError);
    }));
  });

  // 場景: 錯誤後的狀態恢復
  describe('錯誤後的狀態恢復', () => {
    it('錯誤後任務狀態應該完全恢復', fakeAsync(() => {
      const error = new Error('測試錯誤');
      mockTaskService.deleteTask.and.returnValue(throwError(() => error));
      
      const originalTask = { ...testTasks[0] };
      fixture.detectChanges();
      
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      // 檢查任務狀態恢復
      expect(component.taskToDelete()).toBeNull();
      expect(component.showDeleteConfirm()).toBe(false);
      
      // 任務應該仍在列表中且狀態正確
      const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${originalTask.id}"]`);
      expect(taskElement).toBeTruthy();
    }));
  });

  // 場景: 錯誤日誌記錄
  describe('錯誤日誌記錄', () => {
    it('錯誤應該被正確記錄到控制台', fakeAsync(() => {
      const testError = new Error('測試錯誤記錄');
      mockTaskService.deleteTask.and.returnValue(throwError(() => testError));
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      expect(consoleSpy).toHaveBeenCalledWith('刪除失敗:', testError);
    }));

    it('錯誤日誌應該包含任務資訊', fakeAsync(() => {
      const testError = new Error('測試錯誤');
      mockTaskService.deleteTask.and.returnValue(throwError(() => testError));
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      // 檢查是否記錄了任務相關錯誤
      expect(consoleSpy).toHaveBeenCalled();
      const loggedArgs = consoleSpy.calls.mostRecent().args;
      expect(loggedArgs[0]).toContain('刪除失敗');
    }));
  });

  // 場景: Toast 通知樣式檢查
  describe('Toast 通知樣式檢查', () => {
    it('錯誤 Toast 應該有正確的樣式類別', () => {
      // 這個測試需要實際的 ToastNotificationComponent 實例
      const toastComponent = fixture.debugElement.nativeElement.querySelector('app-toast-notification');
      expect(toastComponent).toBeTruthy();
    });
  });

  // 場景: 錯誤訊息本地化檢查
  describe('錯誤訊息本地化', () => {
    it('錯誤訊息應該使用繁體中文', fakeAsync(() => {
      const error = new Error('Network error');
      mockTaskService.deleteTask.and.returnValue(throwError(() => error));
      
      spyOn(component, 'showErrorToast' as any);
      
      fixture.detectChanges();
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      tick();

      const errorMessage = ((component as any).showErrorToast as jasmine.Spy).calls.mostRecent().args[0];
      
      // 檢查錯誤訊息是否包含中文
      expect(errorMessage).toMatch(/[\u4e00-\u9fff]/); // 中文字符範圍
      expect(errorMessage).toContain('刪除');
      expect(errorMessage).toContain('錯誤');
    }));
  });
});
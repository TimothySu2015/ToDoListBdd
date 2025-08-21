import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TaskInputComponent } from './task-input.component';
import { TaskService } from '../../services/task.service';
import { CreateTaskResponse } from '../../models/task.interface';

describe('TaskInputComponent', () => {
  let component: TaskInputComponent;
  let fixture: ComponentFixture<TaskInputComponent>;
  let taskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', 
      ['createTask', 'clearError', 'loading', 'error']
    );
    
    // 設定 signal 函數的預設回傳值
    taskServiceSpy.loading.and.returnValue(false);
    taskServiceSpy.error.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TaskInputComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskInputComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    
    fixture.detectChanges();
  });

  describe('初始狀態', () => {
    it('應該建立元件', () => {
      expect(component).toBeTruthy();
    });

    it('初始狀態應該正確', () => {
      expect(component.taskDescription()).toBe('');
      expect(component.validationError()).toBe('');
      expect(component.isSubmitting()).toBe(false);
      expect(component.canSubmit()).toBe(false);
    });

    it('應該顯示正確的 placeholder', () => {
      const input = fixture.debugElement.query(By.css('[data-testid="task-input"]'));
      expect(input.nativeElement.placeholder).toBe('輸入新任務...');
    });
  });

  describe('輸入驗證', () => {
    it('空白輸入時新增按鈕應該被停用', () => {
      const button = fixture.debugElement.query(By.css('[data-testid="add-task-button"]'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('有效輸入時新增按鈕應該啟用', () => {
      component.onInputChange('有效的任務描述');
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('[data-testid="add-task-button"]'));
      expect(button.nativeElement.disabled).toBe(false);
      expect(component.canSubmit()).toBe(true);
    });

    it('應該驗證任務描述長度', () => {
      const longDescription = 'a'.repeat(501);
      component.onInputChange(longDescription);
      fixture.detectChanges();

      expect(component.validationError()).toBe('任務描述不能超過 500 字元');
      
      const errorElement = fixture.debugElement.query(By.css('[data-testid="validation-error"]'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim()).toBe('任務描述不能超過 500 字元');
    });

    it('輸入變更時應該清除之前的驗證錯誤', () => {
      // 先設定錯誤
      component.validationError.set('之前的錯誤');
      fixture.detectChanges();

      // 輸入新的有效內容
      component.onInputChange('新的有效輸入');
      
      expect(component.validationError()).toBe('');
    });
  });

  describe('任務新增', () => {
    beforeEach(() => {
      taskService.createTask.and.returnValue(of({
        success: true,
        task: {
          id: 1,
          description: '測試任務',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      } as CreateTaskResponse));
    });

    it('Enter 鍵應該觸發新增任務', () => {
      component.onInputChange('測試任務');
      
      const input = fixture.debugElement.query(By.css('[data-testid="task-input"]'));
      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      spyOn(enterEvent, 'preventDefault');
      
      input.triggerEventHandler('keypress', enterEvent);
      
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(taskService.createTask).toHaveBeenCalledWith('測試任務');
    });

    it('點擊新增按鈕應該觸發新增任務', () => {
      component.onInputChange('測試任務');
      fixture.detectChanges();
      
      const button = fixture.debugElement.query(By.css('[data-testid="add-task-button"]'));
      button.triggerEventHandler('click', null);
      
      expect(taskService.createTask).toHaveBeenCalledWith('測試任務');
    });

    it('成功新增後應該清空輸入框', fakeAsync(() => {
      component.onInputChange('測試任務');
      component.onAddClick();
      tick();

      expect(component.taskDescription()).toBe('');
      expect(component.validationError()).toBe('');
    }));

    it('空白任務應該顯示驗證錯誤', () => {
      component.onAddClick();
      
      expect(component.validationError()).toBe('請輸入任務描述');
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it('提交期間應該顯示載入狀態', () => {
      const mockResponse = of({ success: true } as CreateTaskResponse).pipe(delay(100));
      taskService.createTask.and.returnValue(mockResponse);
      
      component.onInputChange('測試任務');
      component.onAddClick();
      
      expect(component.isSubmitting()).toBe(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('應該處理服務端驗證錯誤', fakeAsync(() => {
      taskService.createTask.and.returnValue(of({
        success: false,
        errors: [
          { field: 'description', message: '任務描述為必填' }
        ]
      } as CreateTaskResponse));

      component.onInputChange('測試任務');
      component.onAddClick();
      tick();

      expect(component.validationError()).toBe('任務描述為必填');
    }));

    it('應該處理一般錯誤', fakeAsync(() => {
      taskService.createTask.and.returnValue(of({
        success: false,
        errors: [
          { field: 'general', message: '網路連線錯誤' }
        ]
      } as CreateTaskResponse));

      component.onInputChange('測試任務');
      component.onAddClick();
      tick();

      expect(component.validationError()).toBe('網路連線錯誤');
    }));

    it('應該處理服務異常', fakeAsync(() => {
      taskService.createTask.and.returnValue(throwError(() => new Error('服務異常')));

      component.onInputChange('測試任務');
      component.onAddClick();
      tick();

      expect(component.validationError()).toBe('發生未知錯誤，請稍後再試');
    }));
  });

  describe('CSS 類別', () => {
    it('正常狀態下的輸入框類別', () => {
      expect(component.getInputClasses()).toBe('task-input');
    });

    it('錯誤狀態下的輸入框類別', () => {
      component.validationError.set('錯誤訊息');
      expect(component.getInputClasses()).toBe('task-input task-input--error');
    });

    it('載入狀態下的輸入框類別', () => {
      component.isSubmitting.set(true);
      expect(component.getInputClasses()).toBe('task-input task-input--loading');
    });

    it('正常狀態下的按鈕類別', () => {
      component.taskDescription.set('測試');
      expect(component.getButtonClasses()).toBe('add-button');
    });

    it('停用狀態下的按鈕類別', () => {
      expect(component.getButtonClasses()).toBe('add-button add-button--disabled');
    });

    it('載入狀態下的按鈕類別', () => {
      component.isSubmitting.set(true);
      expect(component.getButtonClasses()).toBe('add-button add-button--disabled add-button--loading');
    });
  });

  describe('UI 顯示', () => {
    it('載入時應該顯示載入指示器', () => {
      taskService.loading.and.returnValue(true);
      fixture.detectChanges();

      const loadingIndicator = fixture.debugElement.query(By.css('[data-testid="loading-indicator"]'));
      expect(loadingIndicator).toBeTruthy();
    });

    it('網路錯誤時應該顯示錯誤訊息', () => {
      taskService.error.and.returnValue('網路連線失敗');
      fixture.detectChanges();

      const networkError = fixture.debugElement.query(By.css('[data-testid="network-error"]'));
      expect(networkError).toBeTruthy();
      expect(networkError.nativeElement.textContent).toContain('網路連線失敗');
    });

    it('載入狀態時按鈕應該顯示載入文字', () => {
      component.isSubmitting.set(true);
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('[data-testid="add-task-button"]'));
      expect(button.nativeElement.textContent).toContain('新增中...');
    });
  });
});
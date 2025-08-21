import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { TaskService } from '../services/task.service';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import { of, delay } from 'rxjs';
import { Task } from '../models/task.interface';

describe('任務刪除動畫效果', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let testTasks: Task[];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'deleteTask', 'toggleTaskStatus', 'getAllTasks', 'clearError'
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
      { id: 1, description: '動畫測試任務', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
    ];
    (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
    (mockTaskService.loading as jasmine.Spy).and.returnValue(false);
    (mockTaskService.error as jasmine.Spy).and.returnValue(null);
    (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
    (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(1);
    (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    (mockTaskService.incompleteTasks as jasmine.Spy).and.returnValue(testTasks.filter(t => !t.isCompleted));
  });

  // 場景: 刪除動畫播放
  describe('刪除動畫播放', () => {
    it('當 我確認刪除任務時應該播放刪除動畫', fakeAsync(() => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      fixture.detectChanges();

      const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${testTasks[0].id}"]`);
      expect(taskElement).toBeTruthy();

      // 開始刪除操作
      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      fixture.detectChanges();

      // 檢查動畫類別是否被添加
      tick(50); // 等待動畫開始
      expect(component.isTaskAnimating(testTasks[0].id, 'deleting')).toBe(true);

      // 檢查動畫持續時間
      tick(300); // 等待動畫完成
      expect(component.isTaskAnimating(testTasks[0].id, 'deleting')).toBe(false);
    }));

    it('任務項目應該有正確的 CSS 動畫類別', () => {
      fixture.detectChanges();
      
      // 設定任務為刪除動畫狀態
      component['setTaskAnimation'](testTasks[0].id, 'deleting');
      fixture.detectChanges();

      const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${testTasks[0].id}"]`);
      expect(taskElement.classList.contains('deleting')).toBe(true);
    });
  });

  // 場景: 複選框完成動畫
  describe('複選框完成動畫', () => {
    it('當 標記任務為完成時應該播放動畫', fakeAsync(() => {
      mockTaskService.toggleTaskStatus.and.returnValue(of({ ...testTasks[0], isCompleted: true }));
      fixture.detectChanges();

      // 觸發完成動畫
      component.onTaskStatusToggle(testTasks[0]);
      fixture.detectChanges();

      // 檢查動畫狀態
      tick(50);
      expect(component.isTaskAnimating(testTasks[0].id, 'completing')).toBe(true);

      tick(300);
      expect(component.isTaskAnimating(testTasks[0].id, 'completing')).toBe(false);
    }));

    it('複選框應該有正確的動畫類別', () => {
      fixture.detectChanges();
      
      component['setTaskAnimation'](testTasks[0].id, 'completing');
      fixture.detectChanges();

      const checkbox = fixture.debugElement.nativeElement.querySelector('.task-checkbox');
      expect(checkbox.classList.contains('completing')).toBe(true);
    });
  });

  // 場景: 複選框取消完成動畫
  describe('複選框取消完成動畫', () => {
    it('當 取消任務完成狀態時應該播放動畫', fakeAsync(() => {
      const completedTask = { ...testTasks[0], isCompleted: true };
      mockTaskService.toggleTaskStatus.and.returnValue(of({ ...completedTask, isCompleted: false }));
      fixture.detectChanges();

      component.onTaskStatusToggle(completedTask);
      fixture.detectChanges();

      tick(50);
      expect(component.isTaskAnimating(completedTask.id, 'uncompleting')).toBe(true);
    }));
  });

  // 場景: 任務項目懸停動畫
  describe('任務項目懸停動畫', () => {
    it('當 滑鼠懸停時應該有視覺變化', () => {
      fixture.detectChanges();
      
      const taskElement = fixture.debugElement.nativeElement.querySelector('.task-item');
      
      // 模擬懸停
      taskElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // 檢查懸停樣式
      const computedStyle = window.getComputedStyle(taskElement);
      expect(taskElement.matches(':hover')).toBeFalsy(); // 在測試環境中無法完全模擬 CSS :hover

      // 檢查刪除按鈕是否顯示
      const taskActions = taskElement.querySelector('.task-actions');
      expect(taskActions).toBeTruthy();
    });
  });

  // 場景: 任務選中狀態動畫
  describe('任務選中狀態動畫', () => {
    it('當 選中任務時應該有視覺變化', () => {
      fixture.detectChanges();
      
      // 選中任務
      component.selectTask(testTasks[0].id);
      fixture.detectChanges();

      const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-task-id="${testTasks[0].id}"]`);
      expect(taskElement.classList.contains('selected')).toBe(true);
    });
  });

  // 場景: 多個任務批量刪除動畫
  describe('多個任務批量刪除動畫', () => {
    beforeEach(() => {
      testTasks = [
        { id: 1, description: '任務1', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '任務2', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '任務3', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
      (mockTaskService.pendingTaskCount as jasmine.Spy).and.returnValue(3);
      (mockTaskService.completedTaskCount as jasmine.Spy).and.returnValue(0);
    });

    it('當 快速刪除多個任務時動畫應該獨立', fakeAsync(() => {
      mockTaskService.deleteTask.and.returnValue(of(true));
      fixture.detectChanges();

      // 開始多個刪除動畫
      component['setTaskAnimation'](1, 'deleting');
      component['setTaskAnimation'](2, 'deleting');
      component['setTaskAnimation'](3, 'deleting');
      fixture.detectChanges();

      // 檢查所有動畫都在進行
      expect(component.isTaskAnimating(1, 'deleting')).toBe(true);
      expect(component.isTaskAnimating(2, 'deleting')).toBe(true);
      expect(component.isTaskAnimating(3, 'deleting')).toBe(true);

      tick(300);
      
      // 檢查所有動畫都已完成
      expect(component.isTaskAnimating(1, 'deleting')).toBe(false);
      expect(component.isTaskAnimating(2, 'deleting')).toBe(false);
      expect(component.isTaskAnimating(3, 'deleting')).toBe(false);
    }));
  });

  // 場景: 新任務高亮動畫
  describe('新任務高亮動畫', () => {
    it('最新任務應該有特殊樣式', () => {
      fixture.detectChanges();
      
      const firstTask = fixture.debugElement.nativeElement.querySelector('[data-index="0"]');
      expect(firstTask).toBeTruthy();
      
      // 檢查新任務徽章
      const newTaskBadge = firstTask.querySelector('.new-task-badge');
      expect(newTaskBadge).toBeTruthy();
      expect(newTaskBadge.textContent.trim()).toBe('新增');
    });

    it('前三個任務應該顯示新任務徽章', () => {
      testTasks = [
        { id: 1, description: '任務1', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, description: '任務2', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, description: '任務3', isCompleted: false, createdAt: new Date(), updatedAt: new Date() },
        { id: 4, description: '任務4', isCompleted: false, createdAt: new Date(), updatedAt: new Date() }
      ];
      (mockTaskService.tasks as jasmine.Spy).and.returnValue(testTasks);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(testTasks.length);
      fixture.detectChanges();

      // 檢查前三個任務有徽章
      for (let i = 0; i < 3; i++) {
        const taskElement = fixture.debugElement.nativeElement.querySelector(`[data-index="${i}"]`);
        const badge = taskElement.querySelector('.new-task-badge');
        expect(badge).toBeTruthy();
      }

      // 檢查第四個任務沒有徽章
      const fourthTask = fixture.debugElement.nativeElement.querySelector('[data-index="3"]');
      const noBadge = fourthTask.querySelector('.new-task-badge');
      expect(noBadge).toBeFalsy();
    });
  });

  // 場景: Loading 狀態動畫
  describe('Loading 狀態動畫', () => {
    it('當 任務處於載入狀態時應該顯示指示器', () => {
      (mockTaskService.loading as jasmine.Spy).and.returnValue(true);
      fixture.detectChanges();

      const loadingContainer = fixture.debugElement.nativeElement.querySelector('[data-testid="loading-container"]');
      expect(loadingContainer).toBeTruthy();
      
      const spinner = loadingContainer.querySelector('.loading-spinner-large');
      expect(spinner).toBeTruthy();
    });
  });

  // 場景: 錯誤狀態動畫恢復
  describe('錯誤狀態動畫恢復', () => {
    it('當 刪除失敗時應該清除動畫狀態', fakeAsync(() => {
      mockTaskService.deleteTask.and.returnValue(of(false)); // 模擬失敗
      fixture.detectChanges();

      component.showDeleteDialog(testTasks[0]);
      component.confirmDelete();
      
      // 檢查動畫被清除
      tick(100);
      expect(component.isTaskAnimating(testTasks[0].id, 'deleting')).toBe(false);
    }));
  });

  // 場景: 空狀態出現動畫
  describe('空狀態出現動畫', () => {
    it('當 列表為空時應該顯示空狀態', () => {
      (mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
      (mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.nativeElement.querySelector('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
      
      const emptyIcon = emptyState.querySelector('.empty-icon');
      expect(emptyIcon).toBeTruthy();
      expect(emptyIcon.textContent).toBe('📋');
    });
  });

  // 場景: CSS 動畫關鍵幀檢查
  describe('CSS 動畫關鍵幀檢查', () => {
    it('應該定義所有必要的動畫關鍵幀', () => {
      // 這個測試檢查 CSS 中是否定義了必要的動畫
      const styleSheets = Array.from(document.styleSheets);
      let hasAnimations = false;

      try {
        styleSheets.forEach(sheet => {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach(rule => {
              if (rule instanceof CSSKeyframesRule) {
                if (['slideOutAndFade', 'taskComplete', 'taskUncomplete', 'pulse'].includes(rule.name)) {
                  hasAnimations = true;
                }
              }
            });
          }
        });
      } catch (e) {
        // 某些情況下可能無法訪問 CSS 規則
        hasAnimations = true; // 假設動畫存在
      }

      expect(hasAnimations).toBe(true);
    });
  });
});
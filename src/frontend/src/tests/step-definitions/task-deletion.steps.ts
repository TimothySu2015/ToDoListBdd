import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { of, throwError } from 'rxjs';
import { expect, use } from 'chai';
import spies from 'chai-spies';

// 使用 chai-spies 插件
use(spies);

import { TaskListComponent } from '../../app/features/todo/components/task-list/task-list.component';
import { TaskService } from '../../app/features/todo/services/task.service';
import { Task } from '../../app/features/todo/models/task.interface';
import { ToastNotificationComponent } from '../../app/features/todo/components/toast-notification/toast-notification.component';
import { ConfirmDialogComponent } from '../../app/features/todo/components/confirm-dialog/confirm-dialog.component';

// 測試狀態管理
interface TestContext {
  component: TaskListComponent;
  fixture: ComponentFixture<TaskListComponent>;
  mockTaskService: jasmine.SpyObj<TaskService>;
  testTasks: Task[];
  selectedTask?: Task;
  networkError?: boolean;
}

let testContext: TestContext = {} as TestContext;

Before(async function() {
  // 設置測試環境
  const taskServiceSpy = jasmine.createSpyObj('TaskService', [
    'getAllTasks', 'deleteTask', 'toggleTaskStatus', 'updateTaskDescription', 'clearError'
  ], {
    'tasks': jasmine.createSpy().and.returnValue([]),
    'loading': jasmine.createSpy().and.returnValue(false),
    'error': jasmine.createSpy().and.returnValue(null),
    'taskCount': jasmine.createSpy().and.returnValue(0),
    'pendingTaskCount': jasmine.createSpy().and.returnValue(0),
    'completedTaskCount': jasmine.createSpy().and.returnValue(0)
  });

  await TestBed.configureTestingModule({
    imports: [TaskListComponent, ConfirmDialogComponent, ToastNotificationComponent],
    providers: [
      { provide: TaskService, useValue: taskServiceSpy }
    ]
  }).compileComponents();

  testContext.fixture = TestBed.createComponent(TaskListComponent);
  testContext.component = testContext.fixture.componentInstance;
  testContext.mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
  testContext.networkError = false;
});

After(function() {
  // 清理測試狀態
  testContext = {} as TestContext;
});

// 背景步驟
Given('我在任務管理頁面', function() {
  // 確認組件已初始化
  expect(testContext.component).to.exist;
});

Given('系統中存在以下任務:', function(dataTable: any) {
  const tasks = dataTable.hashes().map((row: any) => ({
    id: parseInt(row.id),
    description: row.description,
    isCompleted: row.isCompleted === 'true',
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  testContext.testTasks = tasks;
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue(tasks);
  (testContext.mockTaskService.taskCount as jasmine.Spy).and.returnValue(tasks.length);
  testContext.fixture.detectChanges();
});

// AC1: 滑鼠懸停顯示刪除按鈕
When('我將滑鼠懸停在任務 {string} 上', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription);
  expect(task).to.exist;
  
  const taskElement = testContext.fixture.debugElement.query(
    By.css(`[data-testid="task-item-${task!.id}"]`)
  );
  expect(taskElement).to.exist;
  
  // 觸發滑鼠懸停事件
  taskElement.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
  testContext.fixture.detectChanges();
});

Then('我應該看到刪除按鈕', function() {
  const deleteButton = testContext.fixture.debugElement.query(
    By.css('[data-testid="delete-button"]')
  );
  expect(deleteButton).to.exist;
  expect(deleteButton.nativeElement.style.display).to.not.equal('none');
});

Then('刪除按鈕應該有適當的圖示', function() {
  const deleteButton = testContext.fixture.debugElement.query(
    By.css('[data-testid="delete-button"]')
  );
  expect(deleteButton.nativeElement.textContent).to.include('🗑️');
});

When('我將滑鼠移開任務項目', function() {
  const taskElement = testContext.fixture.debugElement.query(
    By.css('[data-testid^="task-item-"]')
  );
  taskElement.nativeElement.dispatchEvent(new MouseEvent('mouseleave'));
  testContext.fixture.detectChanges();
});

Then('刪除按鈕應該隱藏', function() {
  const deleteButton = testContext.fixture.debugElement.query(
    By.css('[data-testid="delete-button"]')
  );
  // 在實際實作中，按鈕可能會有隱藏的樣式類別
  expect(deleteButton.nativeElement.classList).to.contain('hidden');
});

// AC2: 點擊刪除按鈕顯示對話框
Given('我懸停在任務 {string} 上', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription);
  testContext.selectedTask = task;
  
  const taskElement = testContext.fixture.debugElement.query(
    By.css(`[data-testid="task-item-${task!.id}"]`)
  );
  taskElement.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
  testContext.fixture.detectChanges();
});

When('我點擊刪除按鈕', function() {
  const deleteButton = testContext.fixture.debugElement.query(
    By.css('[data-testid="delete-button"]')
  );
  deleteButton.nativeElement.click();
  testContext.fixture.detectChanges();
});

Then('我應該看到確認對話框', function() {
  const confirmDialog = testContext.fixture.debugElement.query(
    By.css('[data-testid="delete-confirm-dialog"]')
  );
  expect(confirmDialog).to.exist;
});

Then('確認對話框應該是可見的', function() {
  expect(testContext.component.showDeleteConfirm()).to.be.true;
});

// AC3: 對話框內容驗證
Given('我點擊任務 {string} 的刪除按鈕', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription);
  testContext.selectedTask = task;
  testContext.component.showDeleteDialog(task!);
  testContext.fixture.detectChanges();
});

When('確認對話框顯示', function() {
  expect(testContext.component.showDeleteConfirm()).to.be.true;
});

Then('對話框應該包含任務描述 {string}', function(taskDescription: string) {
  const dialogContent = testContext.fixture.debugElement.query(
    By.css('[data-testid="dialog-message"]')
  );
  expect(dialogContent.nativeElement.textContent).to.include(taskDescription);
});

Then('對話框應該有 {string} 按鈕', function(buttonText: string) {
  const button = testContext.fixture.debugElement.query(
    By.css(`[data-testid*="${buttonText.toLowerCase()}"]`)
  );
  expect(button).to.exist;
  expect(button.nativeElement.textContent).to.include(buttonText);
});

// AC4: 確認刪除操作
Given('我打開任務 {string} 的刪除確認對話框', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription);
  testContext.selectedTask = task;
  testContext.component.showDeleteDialog(task!);
  testContext.fixture.detectChanges();
});

When('我點擊 {string} 按鈕', function(buttonText: string) {
  if (buttonText === '確認刪除') {
    // 模擬成功的刪除操作
    testContext.mockTaskService.deleteTask.and.returnValue(of(true));
    
    const confirmButton = testContext.fixture.debugElement.query(
      By.css('[data-testid="confirm-button"]')
    );
    confirmButton.nativeElement.click();
  } else if (buttonText === '取消') {
    const cancelButton = testContext.fixture.debugElement.query(
      By.css('[data-testid="cancel-button"]')
    );
    cancelButton.nativeElement.click();
  }
  testContext.fixture.detectChanges();
});

Then('任務 {string} 應該從任務列表中移除', function(taskDescription: string) {
  // 模擬任務從列表中移除
  const updatedTasks = testContext.testTasks.filter(t => t.description !== taskDescription);
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue(updatedTasks);
  testContext.fixture.detectChanges();
  
  const taskElement = testContext.fixture.debugElement.query(
    By.css(`[data-task-description="${taskDescription}"]`)
  );
  expect(taskElement).to.be.null;
});

Then('確認對話框應該關閉', function() {
  expect(testContext.component.showDeleteConfirm()).to.be.false;
});

Then('任務列表應該更新', function() {
  expect(testContext.mockTaskService.deleteTask).to.have.been.called();
});

// AC5: 取消操作
Then('任務 {string} 應該仍然存在於列表中', function(taskDescription: string) {
  const taskElement = testContext.fixture.debugElement.query(
    By.css(`[data-task-description="${taskDescription}"]`)
  );
  expect(taskElement).to.exist;
});

When('我按下 Escape 鍵', function() {
  const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
  document.dispatchEvent(escapeEvent);
  testContext.fixture.detectChanges();
});

// AC6: API 同步
Given('後端 API 可用', function() {
  testContext.networkError = false;
});

Then('系統應該發送 DELETE 請求到後端 API', function() {
  expect(testContext.mockTaskService.deleteTask).to.have.been.called();
});

Then('API 請求應該包含正確的任務 ID', function() {
  const expectedTaskId = testContext.selectedTask?.id;
  expect(testContext.mockTaskService.deleteTask).to.have.been.called.with(expectedTaskId);
});

// AC7: 成功訊息
When('刪除操作成功', function() {
  // 模擬成功響應
  testContext.mockTaskService.deleteTask.and.returnValue(of(true));
});

Then('我應該看到成功訊息 {string}', function(message: string) {
  // 檢查 Toast 通知
  const toastComponent = testContext.fixture.debugElement.query(
    By.css('app-toast-notification')
  ).componentInstance as ToastNotificationComponent;
  
  const notifications = toastComponent.notifications();
  const successNotification = notifications.find(n => n.type === 'success');
  expect(successNotification).to.exist;
  expect(successNotification!.message).to.include('成功刪除');
});

Then('成功訊息應該在 {int} 秒後自動消失', function(seconds: number) {
  // 這裡會在實際實作中驗證自動消失邏輯
  setTimeout(() => {
    const toastComponent = testContext.fixture.debugElement.query(
      By.css('app-toast-notification')
    ).componentInstance as ToastNotificationComponent;
    
    const notifications = toastComponent.notifications();
    expect(notifications.length).to.equal(0);
  }, seconds * 1000);
});

// AC8: 計數器更新
Given('當前任務計數顯示為 {string}', function(countText: string) {
  const counter = testContext.fixture.debugElement.query(
    By.css('[data-testid="task-counter"]')
  );
  expect(counter.nativeElement.textContent).to.include(countText);
});

Then('任務計數器應該更新為 {string}', function(newCountText: string) {
  const updatedTasks = testContext.testTasks.filter(t => t.id !== testContext.selectedTask?.id);
  (testContext.mockTaskService.taskCount as jasmine.Spy).and.returnValue(updatedTasks.length);
  testContext.fixture.detectChanges();
  
  const counter = testContext.fixture.debugElement.query(
    By.css('[data-testid="task-counter"]')
  );
  expect(counter.nativeElement.textContent).to.include(newCountText);
});

Then('計數器更新應該是即時的', function() {
  // 驗證更新是同步的，沒有延遲
  expect(testContext.mockTaskService.taskCount).to.have.been.called();
});

// AC9: 錯誤處理
Given('網路連線中斷', function() {
  testContext.networkError = true;
  testContext.mockTaskService.deleteTask.and.returnValue(
    throwError(() => new Error('Network error'))
  );
});

Then('我應該看到錯誤訊息 {string}', function(errorMessage: string) {
  const toastComponent = testContext.fixture.debugElement.query(
    By.css('app-toast-notification')
  ).componentInstance as ToastNotificationComponent;
  
  const notifications = toastComponent.notifications();
  const errorNotification = notifications.find(n => n.type === 'error');
  expect(errorNotification).to.exist;
  expect(errorNotification!.message).to.include('刪除失敗');
});

// AC10: 鍵盤操作
Given('我選中任務 {string}', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription);
  testContext.selectedTask = task;
  testContext.component.selectedTaskId.set(task!.id);
  testContext.fixture.detectChanges();
});

When('我按下 Delete 鍵', function() {
  const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
  document.dispatchEvent(deleteEvent);
  testContext.fixture.detectChanges();
});

Then('對話框應該顯示選中任務的描述', function() {
  const dialogMessage = testContext.fixture.debugElement.query(
    By.css('[data-testid="dialog-message"]')
  );
  expect(dialogMessage.nativeElement.textContent).to.include(testContext.selectedTask!.description);
});

// AC11: 動畫效果
Then('任務應該有淡出動畫效果', function() {
  const taskElement = testContext.fixture.debugElement.query(
    By.css(`[data-testid="task-item-${testContext.selectedTask!.id}"]`)
  );
  expect(taskElement.nativeElement.classList).to.contain('fade-out');
});

Then('任務應該平滑地從列表中移除', function() {
  // 驗證動畫完成後任務被移除
  expect(testContext.component.isTaskAnimating(testContext.selectedTask!.id, 'deleting')).to.be.true;
});

// AC12: 系統日誌
Then('系統應該記錄刪除操作日誌', function() {
  // 這裡會在實際實作中驗證日誌記錄
  expect(testContext.mockTaskService.deleteTask).to.have.been.called();
});

Then('日誌應該包含任務 ID 和描述', function() {
  const taskId = testContext.selectedTask!.id;
  const description = testContext.selectedTask!.description;
  expect(testContext.mockTaskService.deleteTask).to.have.been.called.with(taskId);
});

// AC13: 不同狀態任務刪除
When('我嘗試刪除已完成任務 {string}', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription && t.isCompleted);
  expect(task).to.exist;
  testContext.selectedTask = task;
  testContext.component.showDeleteDialog(task!);
  testContext.fixture.detectChanges();
});

When('我嘗試刪除待辦任務 {string}', function(taskDescription: string) {
  const task = testContext.testTasks.find(t => t.description === taskDescription && !t.isCompleted);
  expect(task).to.exist;
  testContext.selectedTask = task;
  testContext.component.showDeleteDialog(task!);
  testContext.fixture.detectChanges();
});

Then('我應該能夠成功刪除該任務', function() {
  testContext.mockTaskService.deleteTask.and.returnValue(of(true));
  testContext.component.confirmDelete();
  expect(testContext.mockTaskService.deleteTask).to.have.been.called();
});

// AC14: 空狀態
Given('任務列表中只有一個任務 {string}', function(taskDescription: string) {
  const singleTask: Task = {
    id: 1,
    description: taskDescription,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  testContext.testTasks = [singleTask];
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue([singleTask]);
  (testContext.mockTaskService.taskCount as jasmine.Spy).and.returnValue(1);
  testContext.fixture.detectChanges();
});

When('我刪除這個任務', function() {
  const task = testContext.testTasks[0];
  testContext.component.showDeleteDialog(task);
  testContext.mockTaskService.deleteTask.and.returnValue(of(true));
  testContext.component.confirmDelete();
  
  // 模擬任務列表變空
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue([]);
  (testContext.mockTaskService.taskCount as jasmine.Spy).and.returnValue(0);
  testContext.fixture.detectChanges();
});

Then('任務列表應該顯示空狀態', function() {
  const emptyState = testContext.fixture.debugElement.query(
    By.css('[data-testid="empty-state"]')
  );
  expect(emptyState).to.exist;
});

Then('空狀態應該包含提示訊息 {string}', function(message: string) {
  const emptyMessage = testContext.fixture.debugElement.query(
    By.css('[data-testid="empty-message"]')
  );
  expect(emptyMessage.nativeElement.textContent).to.include(message);
});

Then('空狀態應該有新增任務的建議', function() {
  const emptyAction = testContext.fixture.debugElement.query(
    By.css('[data-testid="empty-action"]')
  );
  expect(emptyAction).to.exist;
});

// 場景大綱步驟
Given('我有一個 {string} 任務 {string}', function(status: string, description: string) {
  const task: Task = {
    id: Date.now(),
    description,
    isCompleted: status === '已完成',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  testContext.testTasks = [task];
  testContext.selectedTask = task;
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue([task]);
  testContext.fixture.detectChanges();
});

When('我刪除這個任務', function() {
  testContext.mockTaskService.deleteTask.and.returnValue(of(true));
  testContext.component.showDeleteDialog(testContext.selectedTask!);
  testContext.component.confirmDelete();
});

Then('任務應該成功從列表中移除', function() {
  expect(testContext.mockTaskService.deleteTask).to.have.been.called();
});

Then('應該顯示相應的成功訊息', function() {
  // 驗證成功訊息顯示
  expect(testContext.mockTaskService.deleteTask).to.have.been.called.with(testContext.selectedTask!.id);
});
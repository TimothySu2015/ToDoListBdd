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
import { ViewStateService } from '../../app/features/todo/services/view-state.service';
import { Task, TaskViewType } from '../../app/features/todo/models/task.interface';

// 搜尋元件 (待實作)
interface TaskSearchComponent {
  searchTerm: () => string;
  onSearchInput: (event: Event) => void;
  clearSearch: () => void;
  focusSearchInput: () => void;
}

// 測試狀態管理
interface SearchTestContext {
  taskListComponent: TaskListComponent;
  taskListFixture: ComponentFixture<TaskListComponent>;
  searchComponent?: TaskSearchComponent;
  searchFixture?: ComponentFixture<any>;
  mockTaskService: jasmine.SpyObj<TaskService>;
  mockViewStateService: jasmine.SpyObj<ViewStateService>;
  testTasks: Task[];
  searchTerm: string;
  searchResults: Task[];
  currentView: TaskViewType;
  apiResponseTime: number;
}

let testContext: SearchTestContext = {} as SearchTestContext;

Before(async function() {
  // 設置測試環境
  const taskServiceSpy = jasmine.createSpyObj('TaskService', [
    'getAllTasks', 'getTasksByStatus', 'searchTasks', 'clearError'
  ], {
    'tasks': jasmine.createSpy().and.returnValue([]),
    'loading': jasmine.createSpy().and.returnValue(false),
    'error': jasmine.createSpy().and.returnValue(null),
    'taskCount': jasmine.createSpy().and.returnValue(0)
  });

  const viewStateServiceSpy = jasmine.createSpyObj('ViewStateService', [
    'setCurrentView', 'getCurrentView'
  ], {
    'currentView': jasmine.createSpy().and.returnValue(TaskViewType.ALL)
  });

  await TestBed.configureTestingModule({
    imports: [TaskListComponent],
    providers: [
      { provide: TaskService, useValue: taskServiceSpy },
      { provide: ViewStateService, useValue: viewStateServiceSpy }
    ]
  }).compileComponents();

  testContext.taskListFixture = TestBed.createComponent(TaskListComponent);
  testContext.taskListComponent = testContext.taskListFixture.componentInstance;
  testContext.mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
  testContext.mockViewStateService = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
  testContext.currentView = TaskViewType.ALL;
  testContext.searchTerm = '';
  testContext.searchResults = [];
  testContext.apiResponseTime = 0;
});

After(function() {
  // 清理測試狀態
  testContext = {} as SearchTestContext;
});

// Background 步驟
Given('我在應用程式的主頁面', function() {
  expect(testContext.taskListComponent).to.exist;
  testContext.taskListFixture.detectChanges();
});

Given('系統中有以下任務:', function(dataTable: any) {
  const tasks = dataTable.hashes().map((row: any) => ({
    id: parseInt(row.id || Date.now()),
    description: row.任務描述 || row.description,
    isCompleted: (row.狀態 || row.status) === '已完成',
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  testContext.testTasks = tasks;
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue(tasks);
  testContext.taskListFixture.detectChanges();
});

// 搜尋框顯示和基本功能
Then('搜尋輸入框應該在任務列表上方顯示', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput).to.exist;
  
  // 驗證位置：應該在任務列表之前
  const taskList = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="task-list"]')
  );
  expect(searchInput.nativeElement.compareDocumentPosition(taskList.nativeElement))
    .to.include(Node.DOCUMENT_POSITION_FOLLOWING);
});

Then('搜尋框應該有搜尋圖示', function() {
  const searchIcon = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-icon"]')
  );
  expect(searchIcon).to.exist;
  expect(searchIcon.nativeElement.textContent).to.include('🔍');
});

Then('搜尋框應該有 placeholder 文字 {string}', function(placeholderText: string) {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.placeholder).to.equal(placeholderText);
});

Then('搜尋框應該可以輸入文字', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.disabled).to.be.false;
  expect(searchInput.nativeElement.readOnly).to.be.false;
});

// 即時搜尋功能
When('我在搜尋框輸入 {string}', function(searchTerm: string) {
  testContext.searchTerm = searchTerm;
  
  // 模擬搜尋結果
  const filteredTasks = testContext.testTasks.filter(task => 
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  testContext.searchResults = filteredTasks;
  
  // 模擬 API 呼叫
  testContext.mockTaskService.searchTasks = jasmine.createSpy('searchTasks')
    .and.returnValue(of(filteredTasks));
  
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  
  // 觸發輸入事件
  searchInput.nativeElement.value = searchTerm;
  searchInput.nativeElement.dispatchEvent(new Event('input'));
  testContext.taskListFixture.detectChanges();
});

Then('任務列表應該即時更新', function() {
  // 驗證沒有需要按鈕點擊
  const searchButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-button"]')
  );
  expect(searchButton).to.be.null; // 不應該有搜尋按鈕
});

Then('我應該看到 {int} 個任務', function(expectedCount: number) {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  expect(taskItems.length).to.equal(expectedCount);
});

Then('我應該看到任務 {string}', function(taskDescription: string) {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  const taskFound = taskItems.some(item => 
    item.nativeElement.textContent.includes(taskDescription)
  );
  expect(taskFound).to.be.true;
});

Then('我不應該看到任務 {string}', function(taskDescription: string) {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  const taskFound = taskItems.some(item => 
    item.nativeElement.textContent.includes(taskDescription)
  );
  expect(taskFound).to.be.false;
});

// 搜尋結果高亮顯示
Then('匹配的文字 {string} 應該被高亮顯示', function(searchTerm: string) {
  const highlightElements = testContext.taskListFixture.debugElement.queryAll(
    By.css('.search-highlight')
  );
  expect(highlightElements.length).to.be.greaterThan(0);
  
  // 驗證高亮文字內容
  const highlightFound = highlightElements.some(element => 
    element.nativeElement.textContent.toLowerCase().includes(searchTerm.toLowerCase())
  );
  expect(highlightFound).to.be.true;
});

Then('高亮顯示應該使用黃色背景', function() {
  const highlightElement = testContext.taskListFixture.debugElement.query(
    By.css('.search-highlight')
  );
  expect(highlightElement).to.exist;
  
  const styles = window.getComputedStyle(highlightElement.nativeElement);
  expect(styles.backgroundColor).to.include('rgb(254, 240, 138)'); // #fef08a in RGB
});

Then('高亮顯示應該在所有匹配的任務中出現', function() {
  const highlightElements = testContext.taskListFixture.debugElement.queryAll(
    By.css('.search-highlight')
  );
  expect(highlightElements.length).to.equal(testContext.searchResults.length);
});

// 清空搜尋功能
Given('我在搜尋框輸入 {string}', function(searchTerm: string) {
  testContext.searchTerm = searchTerm;
  // 這個步驟與 When 相同，複用邏輯
});

Given('搜尋結果顯示 {int} 個任務', function(count: number) {
  expect(testContext.searchResults.length).to.equal(count);
});

When('我清空搜尋框', function() {
  testContext.searchTerm = '';
  
  // 模擬清空後顯示所有任務
  testContext.mockTaskService.searchTasks = jasmine.createSpy('searchTasks')
    .and.returnValue(of(testContext.testTasks));
  
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  
  searchInput.nativeElement.value = '';
  searchInput.nativeElement.dispatchEvent(new Event('input'));
  testContext.taskListFixture.detectChanges();
});

When('我清空搜尋框並輸入 {string}', function(newSearchTerm: string) {
  // 先清空
  this['clearSearch']();
  // 再輸入新的搜尋詞
  this['searchInput'](newSearchTerm);
});

Then('我應該看到所有 {int} 個任務', function(totalCount: number) {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  expect(taskItems.length).to.equal(totalCount);
});

Then('任務列表應該恢復到原始狀態', function() {
  expect(testContext.mockTaskService.searchTasks).to.have.been.called.with('');
});

// 檢視切換整合
Given('我在 {string} 檢視', function(viewType: string) {
  const view = viewType === '待辦' ? TaskViewType.TODO : 
               viewType === '已完成' ? TaskViewType.COMPLETED : 
               TaskViewType.ALL;
  testContext.currentView = view;
  (testContext.mockViewStateService.currentView as jasmine.Spy).and.returnValue(view);
});

When('我切換到 {string} 檢視', function(viewType: string) {
  const view = viewType === '待辦' ? TaskViewType.TODO : 
               viewType === '已完成' ? TaskViewType.COMPLETED : 
               TaskViewType.ALL;
  testContext.currentView = view;
  
  const viewButton = testContext.taskListFixture.debugElement.query(
    By.css(`[data-testid="${viewType.toLowerCase()}-view-button"]`)
  );
  if (viewButton) {
    viewButton.nativeElement.click();
  }
  testContext.taskListFixture.detectChanges();
});

Then('搜尋框內容應該保持 {string}', function(searchTerm: string) {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.value).to.equal(searchTerm);
});

Then('應該顯示無結果提示', function() {
  const noResultsElement = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="no-results"]')
  );
  expect(noResultsElement).to.exist;
});

// 搜尋無結果提示
Then('我應該看到 {string} 提示', function(message: string) {
  const noResultsElement = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="no-results-message"]')
  );
  expect(noResultsElement).to.exist;
  expect(noResultsElement.nativeElement.textContent).to.include(message);
});

Then('我不應該看到任何任務', function() {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  expect(taskItems.length).to.equal(0);
});

Then('提示應該包含建議文字', function() {
  const suggestionElement = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="no-results-suggestion"]')
  );
  expect(suggestionElement).to.exist;
});

// 清除按鈕
Then('搜尋框右側應該顯示清除按鈕 {string}', function(buttonText: string) {
  const clearButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="clear-search"]')
  );
  expect(clearButton).to.exist;
  expect(clearButton.nativeElement.textContent).to.include(buttonText);
});

When('我點擊清除按鈕', function() {
  const clearButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="clear-search"]')
  );
  clearButton.nativeElement.click();
  testContext.taskListFixture.detectChanges();
});

Then('搜尋框應該被清空', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.value).to.equal('');
});

Then('清除按鈕應該消失', function() {
  const clearButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="clear-search"]')
  );
  expect(clearButton.nativeElement.style.display).to.equal('none');
});

// 鍵盤快捷鍵
When('我按下 Ctrl+F', function() {
  const ctrlFEvent = new KeyboardEvent('keydown', { 
    key: 'f', 
    ctrlKey: true 
  });
  document.dispatchEvent(ctrlFEvent);
  testContext.taskListFixture.detectChanges();
});

Then('搜尋框應該獲得焦點', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(document.activeElement).to.equal(searchInput.nativeElement);
});

Then('搜尋框應該有視覺焦點指示', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.classList).to.contain('focused');
});

When('我按下 ESC 鍵', function() {
  const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  searchInput.nativeElement.dispatchEvent(escEvent);
  testContext.taskListFixture.detectChanges();
});

// 防抖動和效能
When('我快速輸入 {string}', function(text: string) {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  
  // 模擬快速輸入
  for (let i = 0; i < text.length; i++) {
    searchInput.nativeElement.value = text.substring(0, i + 1);
    searchInput.nativeElement.dispatchEvent(new Event('input'));
  }
  testContext.taskListFixture.detectChanges();
});

Then('搜尋應該在 {int}ms 後執行', function(delay: number) {
  // 驗證防抖動機制
  setTimeout(() => {
    expect(testContext.mockTaskService.searchTasks).to.have.been.called();
  }, delay);
});

Then('不應該發送多個 API 請求', function() {
  expect(testContext.mockTaskService.searchTasks).to.have.been.called.once;
});

Then('載入狀態應該正確顯示', function() {
  const loadingIndicator = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-loading"]')
  );
  expect(loadingIndicator).to.exist;
});

// 搜尋載入狀態
Then('應該顯示搜尋載入狀態', function() {
  const loadingIndicator = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-loading"]')
  );
  expect(loadingIndicator).to.exist;
});

Then('搜尋框應該顯示載入指示器', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.classList).to.contain('loading');
});

When('搜尋完成後', function() {
  // 模擬搜尋完成
  testContext.taskListFixture.detectChanges();
});

Then('載入狀態應該消失', function() {
  const loadingIndicator = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-loading"]')
  );
  expect(loadingIndicator).to.be.null;
});

Then('搜尋結果應該顯示', function() {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  expect(taskItems.length).to.be.greaterThan(0);
});

// 頁面重載後狀態清空
Given('搜尋結果顯示 {int} 個任務', function(count: number) {
  expect(testContext.searchResults.length).to.equal(count);
});

When('我重新載入頁面', function() {
  // 模擬頁面重載
  testContext.searchTerm = '';
  testContext.searchResults = [];
  
  // 重新初始化元件
  testContext.taskListFixture.detectChanges();
});

Then('搜尋框應該是空的', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.value).to.equal('');
});

Then('應該顯示所有任務', function() {
  const taskItems = testContext.taskListFixture.debugElement.queryAll(
    By.css('[data-testid^="task-item-"]')
  );
  expect(taskItems.length).to.equal(testContext.testTasks.length);
});

Then('檢視狀態應該保持原始設定', function() {
  expect(testContext.mockViewStateService.getCurrentView()).to.equal(testContext.currentView);
});

// 效能測試
Given('系統中有 {int} 個任務', function(taskCount: number) {
  const tasks: Task[] = [];
  for (let i = 1; i <= taskCount; i++) {
    tasks.push({
      id: i,
      description: `測試任務 ${i}`,
      isCompleted: i % 3 === 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  testContext.testTasks = tasks;
  (testContext.mockTaskService.tasks as jasmine.Spy).and.returnValue(tasks);
});

When('我在搜尋框輸入關鍵字', function() {
  const startTime = performance.now();
  
  // 模擬搜尋
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  searchInput.nativeElement.value = 'test';
  searchInput.nativeElement.dispatchEvent(new Event('input'));
  
  const endTime = performance.now();
  testContext.apiResponseTime = endTime - startTime;
  
  testContext.taskListFixture.detectChanges();
});

Then('搜尋結果應該在 {int}ms 內顯示', function(maxTime: number) {
  expect(testContext.apiResponseTime).to.be.lessThan(maxTime);
});

Then('UI 應該保持回應性', function() {
  // 驗證 UI 沒有被阻塞
  expect(testContext.taskListFixture.componentInstance).to.exist;
});

Then('不應該阻塞用戶介面', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.disabled).to.be.false;
});

// 無障礙功能
Then('搜尋框應該有適當的 aria-label', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.getAttribute('aria-label')).to.exist;
});

Then('搜尋結果應該有 aria-live 區域', function() {
  const liveRegion = testContext.taskListFixture.debugElement.query(
    By.css('[aria-live="polite"]')
  );
  expect(liveRegion).to.exist;
});

Then('清除按鈕應該有 aria-label', function() {
  const clearButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="clear-search"]')
  );
  expect(clearButton.nativeElement.getAttribute('aria-label')).to.exist;
});

Then('搜尋框應該支援螢幕閱讀器', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.getAttribute('role')).to.equal('searchbox');
});

Then('搜尋狀態變化應該被宣告', function() {
  const statusElement = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-status"]')
  );
  expect(statusElement).to.exist;
  expect(statusElement.nativeElement.getAttribute('aria-live')).to.equal('polite');
});

// 行動裝置支援
Given('我在行動裝置上', function() {
  // 模擬行動裝置視窗
  Object.defineProperty(window, 'innerWidth', { value: 375 });
  Object.defineProperty(window, 'innerHeight', { value: 667 });
  testContext.taskListFixture.detectChanges();
});

When('我點擊搜尋框', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  searchInput.nativeElement.click();
  testContext.taskListFixture.detectChanges();
});

Then('虛擬鍵盤應該出現', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.getAttribute('inputmode')).to.equal('search');
});

Then('搜尋框應該正確縮放', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  const styles = window.getComputedStyle(searchInput.nativeElement);
  expect(parseFloat(styles.fontSize)).to.be.greaterThan(16); // 防止縮放
});

Then('觸控操作應該正常運作', function() {
  const searchInput = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="search-input"]')
  );
  expect(searchInput.nativeElement.style.touchAction).to.not.equal('none');
});

Then('清除按鈕應該容易點擊', function() {
  const clearButton = testContext.taskListFixture.debugElement.query(
    By.css('[data-testid="clear-search"]')
  );
  const styles = window.getComputedStyle(clearButton.nativeElement);
  expect(parseFloat(styles.minHeight)).to.be.greaterThan(44); // 符合觸控標準
});
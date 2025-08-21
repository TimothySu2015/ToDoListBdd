import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { By, until, WebDriver } from 'selenium-webdriver';
import { TaskPage } from '../pages/task.page';

interface Task {
  description: string;
  isCompleted: boolean;
}

class TaskStatusToggleSteps {
  private driver: WebDriver;
  private taskPage: TaskPage;
  private initialTasks: Task[] = [];
  private errorShown = false;

  constructor(driver: WebDriver) {
    this.driver = driver;
    this.taskPage = new TaskPage(driver);
  }

  @Given('我在任務清單頁面')
  async navigateToTaskListPage(): Promise<void> {
    await this.taskPage.navigateTo();
    await this.taskPage.waitForPageLoad();
  }

  @Given('我有以下任務:')
  async setupInitialTasks(dataTable: any): Promise<void> {
    const tasks = dataTable.hashes() as Task[];
    this.initialTasks = tasks;
    
    // 清空現有任務並新增測試任務
    await this.taskPage.clearAllTasks();
    
    for (const task of tasks) {
      await this.taskPage.addTask(task.description);
      if (task.isCompleted) {
        await this.taskPage.toggleTaskStatus(task.description);
      }
    }
  }

  @Given('我有一個待辦任務 {string}')
  async setupPendingTask(taskDescription: string): Promise<void> {
    await this.taskPage.addTask(taskDescription);
    const isCompleted = await this.taskPage.isTaskCompleted(taskDescription);
    expect(isCompleted).to.be.false;
  }

  @Given('我有一個已完成任務 {string}')
  async setupCompletedTask(taskDescription: string): Promise<void> {
    await this.taskPage.addTask(taskDescription);
    await this.taskPage.toggleTaskStatus(taskDescription);
    const isCompleted = await this.taskPage.isTaskCompleted(taskDescription);
    expect(isCompleted).to.be.true;
  }

  @Given('任務項目獲得焦點')
  async focusTask(): Promise<void> {
    const taskElement = await this.taskPage.getFirstTaskElement();
    await taskElement.click();
  }

  @Given('API 服務無法回應')
  async simulateApiError(): Promise<void> {
    // 模擬網路錯誤 - 可以使用網路攔截或 service worker
    await this.taskPage.simulateNetworkError();
  }

  @Given('我有 {int} 個待辦任務和 {int} 個已完成任務')
  async setupTaskCounts(pendingCount: number, completedCount: number): Promise<void> {
    await this.taskPage.clearAllTasks();
    
    // 建立待辦任務
    for (let i = 0; i < pendingCount; i++) {
      await this.taskPage.addTask(`待辦任務 ${i + 1}`);
    }
    
    // 建立已完成任務
    for (let i = 0; i < completedCount; i++) {
      await this.taskPage.addTask(`已完成任務 ${i + 1}`);
      await this.taskPage.toggleTaskStatus(`已完成任務 ${i + 1}`);
    }
  }

  @When('我點擊任務的勾選框')
  async clickTaskCheckbox(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    await this.taskPage.clickTaskCheckbox(firstTask);
  }

  @When('我按下空白鍵')
  async pressSpaceKey(): Promise<void> {
    await this.driver.actions().sendKeys(' ').perform();
  }

  @When('我將 {int} 個待辦任務標記為已完成')
  async markTasksAsCompleted(count: number): Promise<void> {
    const pendingTasks = await this.taskPage.getPendingTasks();
    
    for (let i = 0; i < Math.min(count, pendingTasks.length); i++) {
      await this.taskPage.clickTaskCheckbox(pendingTasks[i]);
    }
  }

  @Then('任務應該顯示勾選標記')
  async verifyTaskChecked(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const isChecked = await this.taskPage.isTaskCheckboxChecked(firstTask);
    expect(isChecked).to.be.true;
  }

  @Then('任務應該顯示空白勾選框')
  async verifyTaskUnchecked(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const isChecked = await this.taskPage.isTaskCheckboxChecked(firstTask);
    expect(isChecked).to.be.false;
  }

  @Then('任務文字應該顯示劃線效果')
  async verifyStrikeThroughText(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const hasStrikeThrough = await this.taskPage.hasStrikeThroughText(firstTask);
    expect(hasStrikeThrough).to.be.true;
  }

  @Then('任務文字劃線效果應該移除')
  async verifyNoStrikeThroughText(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const hasStrikeThrough = await this.taskPage.hasStrikeThroughText(firstTask);
    expect(hasStrikeThrough).to.be.false;
  }

  @Then('應該播放完成動畫')
  async verifyCompletionAnimation(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const hasCompletionAnimation = await this.taskPage.hasAnimationClass(firstTask, 'completing');
    expect(hasCompletionAnimation).to.be.true;
    
    // 等待動畫完成
    await this.driver.sleep(350); // 稍微超過 0.3 秒
  }

  @Then('應該播放取消動畫')
  async verifyUncompleteAnimation(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const hasUncompleteAnimation = await this.taskPage.hasAnimationClass(firstTask, 'uncompleting');
    expect(hasUncompleteAnimation).to.be.true;
    
    // 等待動畫完成
    await this.driver.sleep(350);
  }

  @Then('任務計數應該更新為 {string}')
  async verifyTaskCount(expectedCount: string): Promise<void> {
    await this.driver.wait(until.elementLocated(By.css('.task-counter')), 2000);
    const actualCount = await this.taskPage.getTaskCountText();
    expect(actualCount).to.equal(expectedCount);
  }

  @Then('任務狀態應該切換為已完成')
  async verifyTaskStatusChanged(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const isCompleted = await this.taskPage.isTaskCompleted(firstTask);
    expect(isCompleted).to.be.true;
  }

  @Then('應該顯示相應的視覺回饋')
  async verifyVisualFeedback(): Promise<void> {
    // 檢查是否有視覺回饋效果（動畫、顏色變化等）
    const firstTask = await this.taskPage.getFirstTaskElement();
    const hasVisualFeedback = await this.taskPage.hasVisualFeedback(firstTask);
    expect(hasVisualFeedback).to.be.true;
  }

  @Then('任務應該暫時顯示為已完成')
  async verifyTemporaryCompletion(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const isCompleted = await this.taskPage.isTaskCompleted(firstTask);
    expect(isCompleted).to.be.true;
  }

  @Then('{int} 秒後應該回滾到待辦狀態')
  async verifyRollbackAfterDelay(seconds: number): Promise<void> {
    await this.driver.sleep(seconds * 1000);
    const firstTask = await this.taskPage.getFirstTaskElement();
    const isCompleted = await this.taskPage.isTaskCompleted(firstTask);
    expect(isCompleted).to.be.false;
  }

  @Then('應該顯示錯誤訊息 {string}')
  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    await this.driver.wait(until.elementLocated(By.css('.error-message')), 3000);
    const errorElement = await this.driver.findElement(By.css('.error-message'));
    const actualMessage = await errorElement.getText();
    expect(actualMessage).to.equal(expectedMessage);
    this.errorShown = true;
  }

  @Then('計數更新應該立即顯示')
  async verifyImmediateCountUpdate(): Promise<void> {
    // 檢查計數更新是否在 100ms 內完成
    const startTime = Date.now();
    await this.driver.wait(until.elementLocated(By.css('.task-counter')), 100);
    const elapsed = Date.now() - startTime;
    expect(elapsed).to.be.lessThan(100);
  }

  @Then('應該播放 {float} 秒的完成動畫')
  async verifyAnimationDuration(duration: number): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const startTime = Date.now();
    
    const hasAnimation = await this.taskPage.hasAnimationClass(firstTask, 'completing');
    expect(hasAnimation).to.be.true;
    
    // 等待動畫完成
    await this.driver.wait(async () => {
      const stillAnimating = await this.taskPage.hasAnimationClass(firstTask, 'completing');
      return !stillAnimating;
    }, (duration + 0.1) * 1000);
    
    const elapsed = (Date.now() - startTime) / 1000;
    expect(elapsed).to.be.closeTo(duration, 0.1);
  }

  @Then('勾選框應該平滑地變為選中狀態')
  async verifySmoothCheckboxTransition(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const checkbox = await this.taskPage.getTaskCheckbox(firstTask);
    
    // 檢查 transition CSS 屬性
    const transitionProperty = await checkbox.getCssValue('transition');
    expect(transitionProperty).to.include('0.2s');
  }

  @Then('文字應該平滑地顯示劃線效果')
  async verifySmoothTextTransition(): Promise<void> {
    const firstTask = await this.taskPage.getFirstTaskElement();
    const textElement = await this.taskPage.getTaskText(firstTask);
    
    // 檢查 transition CSS 屬性
    const transitionProperty = await textElement.getCssValue('transition');
    expect(transitionProperty).to.include('0.3s');
  }
}
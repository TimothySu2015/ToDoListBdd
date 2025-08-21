import { By, until, WebDriver, WebElement } from 'selenium-webdriver';

export class TaskPage {
  private driver: WebDriver;
  private baseUrl = 'http://localhost:4200';

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async navigateTo(): Promise<void> {
    await this.driver.get(this.baseUrl);
  }

  async waitForPageLoad(): Promise<void> {
    await this.driver.wait(until.elementLocated(By.css('app-task-list')), 5000);
  }

  async addTask(description: string): Promise<void> {
    const inputField = await this.driver.findElement(By.css('input[data-testid="task-input"]'));
    await inputField.clear();
    await inputField.sendKeys(description);
    
    const addButton = await this.driver.findElement(By.css('button[data-testid="add-task-button"]'));
    await addButton.click();
    
    // 等待任務被新增到清單中
    await this.driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'task-item')]//span[text()='${description}']`)), 3000);
  }

  async clearAllTasks(): Promise<void> {
    const tasks = await this.driver.findElements(By.css('.task-item'));
    for (const task of tasks) {
      const deleteButton = await task.findElement(By.css('.delete-button'));
      await deleteButton.click();
    }
  }

  async toggleTaskStatus(taskDescription: string): Promise<void> {
    const taskElement = await this.getTaskByDescription(taskDescription);
    const checkbox = await taskElement.findElement(By.css('.task-checkbox'));
    await checkbox.click();
  }

  async getTaskByDescription(description: string): Promise<WebElement> {
    return await this.driver.findElement(By.xpath(`//div[contains(@class, 'task-item')]//span[text()='${description}']//ancestor::div[contains(@class, 'task-item')]`));
  }

  async getFirstTaskElement(): Promise<WebElement> {
    return await this.driver.findElement(By.css('.task-item:first-child'));
  }

  async getPendingTasks(): Promise<WebElement[]> {
    return await this.driver.findElements(By.css('.task-item:not(.completed)'));
  }

  async getCompletedTasks(): Promise<WebElement[]> {
    return await this.driver.findElements(By.css('.task-item.completed'));
  }

  async clickTaskCheckbox(taskElement: WebElement): Promise<void> {
    const checkbox = await taskElement.findElement(By.css('.task-checkbox'));
    await checkbox.click();
  }

  async isTaskCompleted(taskElement: WebElement | string): Promise<boolean> {
    let element: WebElement;
    
    if (typeof taskElement === 'string') {
      element = await this.getTaskByDescription(taskElement);
    } else {
      element = taskElement;
    }
    
    const classes = await element.getAttribute('class');
    return classes.includes('completed');
  }

  async isTaskCheckboxChecked(taskElement: WebElement): Promise<boolean> {
    const checkbox = await taskElement.findElement(By.css('.task-checkbox'));
    const classes = await checkbox.getAttribute('class');
    return classes.includes('checked');
  }

  async hasStrikeThroughText(taskElement: WebElement): Promise<boolean> {
    const textElement = await taskElement.findElement(By.css('.task-text'));
    const textDecoration = await textElement.getCssValue('text-decoration');
    return textDecoration.includes('line-through');
  }

  async hasAnimationClass(taskElement: WebElement, animationClass: string): Promise<boolean> {
    const classes = await taskElement.getAttribute('class');
    return classes.includes(animationClass);
  }

  async hasVisualFeedback(taskElement: WebElement): Promise<boolean> {
    // 檢查是否有視覺回饋類別或樣式
    const classes = await taskElement.getAttribute('class');
    return classes.includes('completing') || classes.includes('uncompleting') || classes.includes('feedback');
  }

  async getTaskCountText(): Promise<string> {
    const counterElement = await this.driver.findElement(By.css('.task-counter'));
    return await counterElement.getText();
  }

  async getTaskCheckbox(taskElement: WebElement): Promise<WebElement> {
    return await taskElement.findElement(By.css('.task-checkbox'));
  }

  async getTaskText(taskElement: WebElement): Promise<WebElement> {
    return await taskElement.findElement(By.css('.task-text'));
  }

  async simulateNetworkError(): Promise<void> {
    // 透過執行 JavaScript 來模擬網路錯誤
    await this.driver.executeScript(`
      window.originalFetch = window.fetch;
      window.fetch = function() {
        return Promise.reject(new Error('Network error'));
      };
    `);
  }

  async restoreNetworkConnection(): Promise<void> {
    await this.driver.executeScript(`
      if (window.originalFetch) {
        window.fetch = window.originalFetch;
        delete window.originalFetch;
      }
    `);
  }
}
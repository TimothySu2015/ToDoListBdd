import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

// 簡化的測試世界構造函數
export class SimpleTestWorld extends World {
  public testTasks: any[] = [];
  public currentView: string = 'todo';
  public taskCounts: { [key: string]: number } = {};

  constructor(options: IWorldOptions) {
    super(options);
    console.log('🌍 初始化測試世界');
  }

  // 重置測試狀態
  reset() {
    this.testTasks = [];
    this.currentView = 'todo';
    this.taskCounts = {};
    console.log('🔄 重置測試狀態');
  }
}

// 設置為 Cucumber 的世界構造函數
setWorldConstructor(SimpleTestWorld);
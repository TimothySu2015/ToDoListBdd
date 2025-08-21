module.exports = {
  default: {
    // Feature 檔案路徑
    paths: ['src/tests/features/*.feature'],
    
    // Step definitions 路徑
    require: [
      'src/tests/step-definitions/task-deletion-simple.steps.ts',
      'src/tests/support/hooks-simple.ts'
    ],
    
    // 格式化選項
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
    ],
    
    // 並行執行
    parallel: 2,
    
    // 標籤過濾
    tags: 'not @ignore',
    
    // TypeScript 支援
    requireModule: ['ts-node/register'],
    
    // 世界參數
    worldParameters: {
      // Angular 測試環境配置
      testEnvironment: 'angular',
      headless: true,
      timeout: 30000
    }
  }
};
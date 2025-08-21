import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';

// 設置測試超時時間
setDefaultTimeout(60 * 1000); // 60 秒

// 全域測試環境設置
BeforeAll(async function() {
  console.log('🚀 開始設置前端 BDD 測試環境...');
  console.log('✅ 測試環境設置完成');
});

// 每個場景之前執行
Before(async function() {
  console.log(`📝 開始場景: ${this['pickle']?.name || '未知場景'}`);
  // 重置世界狀態
  if (this['reset'] && typeof this['reset'] === 'function') {
    this['reset']();
  }
});

// 每個場景之後執行
After(async function() {
  console.log(`✅ 場景完成: ${this['pickle']?.name || '未知場景'}`);
});

// 全域測試環境清理
AfterAll(async function() {
  console.log('🏁 前端 BDD 測試環境清理完成');
});
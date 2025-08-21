import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastNotificationComponent } from './toast-notification.component';

describe('ToastNotificationComponent', () => {
  let component: ToastNotificationComponent;
  let fixture: ComponentFixture<ToastNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastNotificationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('應該創建元件', () => {
    expect(component).toBeTruthy();
  });

  it('應該顯示成功通知', fakeAsync(() => {
    component.showNotification('測試成功訊息', 'success', 1000);
    fixture.detectChanges();

    expect(component.notifications().length).toBe(1);
    expect(component.notifications()[0].message).toBe('測試成功訊息');
    expect(component.notifications()[0].type).toBe('success');

    // 檢查 DOM 元素
    const toastElement = fixture.debugElement.nativeElement.querySelector('.toast-success');
    expect(toastElement).toBeTruthy();
    expect(toastElement.textContent).toContain('測試成功訊息');

    // 等待自動移除
    tick(1000);
    fixture.detectChanges();
    
    expect(component.notifications().length).toBe(0);
  }));

  it('應該顯示錯誤通知', () => {
    component.showNotification('測試錯誤訊息', 'error', 0); // 不自動移除
    fixture.detectChanges();

    expect(component.notifications().length).toBe(1);
    expect(component.notifications()[0].type).toBe('error');

    const toastElement = fixture.debugElement.nativeElement.querySelector('.toast-error');
    expect(toastElement).toBeTruthy();
  });

  it('應該能手動移除通知', () => {
    component.showNotification('測試訊息', 'info', 0);
    fixture.detectChanges();

    const notificationId = component.notifications()[0].id;
    component.removeNotification(notificationId);
    fixture.detectChanges();

    expect(component.notifications().length).toBe(0);
  });

  it('應該正確顯示多個通知', () => {
    component.showNotification('第一個訊息', 'success', 0);
    component.showNotification('第二個訊息', 'error', 0);
    fixture.detectChanges();

    expect(component.notifications().length).toBe(2);

    const successToast = fixture.debugElement.nativeElement.querySelector('.toast-success');
    const errorToast = fixture.debugElement.nativeElement.querySelector('.toast-error');
    
    expect(successToast).toBeTruthy();
    expect(errorToast).toBeTruthy();
  });

  it('應該正確格式化時間戳', () => {
    const now = new Date();
    const result = component.formatTimestamp(now);
    expect(result).toBe('剛剛');

    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const result2 = component.formatTimestamp(oneMinuteAgo);
    expect(result2).toBe('1 分鐘前');
  });

  it('應該有正確的圖示', () => {
    expect(component.getIcon('success')).toBe('✅');
    expect(component.getIcon('error')).toBe('❌');
    expect(component.getIcon('info')).toBe('ℹ️');
  });

  it('應該支援鍵盤關閉', () => {
    component.showNotification('測試訊息', 'info', 0);
    fixture.detectChanges();

    const closeButton = fixture.debugElement.nativeElement.querySelector('.toast-close');
    expect(closeButton).toBeTruthy();

    closeButton.click();
    fixture.detectChanges();

    expect(component.notifications().length).toBe(0);
  });
});
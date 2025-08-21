import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.scss']
})
export class ToastNotificationComponent {
  public notifications = signal<ToastNotification[]>([]);

  showNotification(
    message: string, 
    type: 'success' | 'error' | 'info' = 'info', 
    duration = 3000
  ): void {
    const notification: ToastNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };

    this.notifications.update(notifications => [...notifications, notification]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  removeNotification(id: number): void {
    this.notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': 
        return 'fas fa-check-circle';
      case 'error': 
        return 'fas fa-exclamation-circle';
      default: 
        return 'fas fa-info-circle';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': 
        return '✅';
      case 'error': 
        return '❌';
      default: 
        return 'ℹ️';
    }
  }

  trackByNotificationId(index: number, notification: ToastNotification): number {
    return notification.id;
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return '剛剛';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} 分鐘前`;
    } else {
      return timestamp.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
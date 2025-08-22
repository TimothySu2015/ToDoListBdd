import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-highlight',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [innerHTML]="highlightedText()"></span>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TaskHighlightComponent {
  @Input() text: string = '';
  @Input() searchTerm: string = '';

  /**
   * 計算高亮顯示的文字
   */
  highlightedText = computed(() => {
    if (!this.searchTerm || !this.text) {
      return this.escapeHtml(this.text);
    }

    const escapedText = this.escapeHtml(this.text);
    const escapedSearchTerm = this.escapeRegex(this.searchTerm);
    
    // 不區分大小寫的正則表達式
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    
    return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  });

  /**
   * 轉義正則表達式特殊字符
   */
  private escapeRegex(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 轉義 HTML 特殊字符
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
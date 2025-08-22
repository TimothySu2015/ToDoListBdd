import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-task-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-search.component.html',
  styleUrls: ['./task-search.component.scss']
})
export class TaskSearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;

  constructor(public searchService: SearchService) {}

  ngOnInit(): void {
    // 註冊全域鍵盤快捷鍵
    this.registerKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    // 清理會在組件銷毀時自動處理
  }

  /**
   * 處理搜尋輸入
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchService.search(input.value);
  }

  /**
   * 清除搜尋
   */
  clearSearch(): void {
    this.searchService.clearSearch();
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
  }

  /**
   * 聚焦搜尋輸入框
   */
  focusSearchInput(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * 處理搜尋框鍵盤事件
   */
  onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.clearSearch();
        break;
      case 'ArrowDown':
        // 可以擴展為聚焦到第一個搜尋結果
        event.preventDefault();
        break;
      case 'Enter':
        // 強制執行搜尋（跳過防抖動）
        event.preventDefault();
        const input = event.target as HTMLInputElement;
        this.searchService.search(input.value);
        break;
    }
  }

  /**
   * 註冊鍵盤快捷鍵
   */
  private registerKeyboardShortcuts(): void {
    // Ctrl+F 快捷鍵在 HostListener 中處理
  }

  /**
   * 全域鍵盤事件處理
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // Ctrl+F 快捷鍵
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      this.focusSearchInput();
    }
  }

  /**
   * 取得當前搜尋關鍵字
   */
  get currentSearchTerm(): string {
    return this.searchService.getCurrentSearchTerm();
  }

  /**
   * 檢查是否有搜尋關鍵字
   */
  get hasSearchTerm(): boolean {
    return this.searchService.isSearching();
  }

  /**
   * 檢查是否正在載入
   */
  get isLoading(): boolean {
    return this.searchService.searchLoading();
  }
}
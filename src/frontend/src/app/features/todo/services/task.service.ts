import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, finalize, tap, delay } from 'rxjs/operators';
import { Task, CreateTaskRequest, CreateTaskResponse, TaskValidationError, TaskViewType } from '../models/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = 'http://localhost:5000/api/tasks';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  // 使用 Angular Signals 管理狀態
  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // 公開的只讀 signals
  public readonly tasks = this.tasksSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  // 計算屬性
  public readonly taskCount = computed(() => this.tasksSignal().length);
  public readonly incompleteTasks = computed(() => 
    this.tasksSignal().filter(task => !task.isCompleted)
  );
  public readonly completedTasks = computed(() => 
    this.tasksSignal().filter(task => task.isCompleted)
  );
  public readonly pendingTaskCount = computed(() => this.incompleteTasks().length);
  public readonly completedTaskCount = computed(() => this.completedTasks().length);

  constructor(private http: HttpClient) {}

  /**
   * 建立新任務
   * @param description 任務描述
   * @returns Observable<CreateTaskResponse>
   */
  createTask(description: string): Observable<CreateTaskResponse> {
    // 客戶端驗證
    const validationErrors = this.validateTaskDescription(description);
    if (validationErrors.length > 0) {
      return of({
        success: false,
        errors: validationErrors
      });
    }

    const request: CreateTaskRequest = { description: description.trim() };
    
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Task>(this.apiUrl, request).pipe(
      // 模擬載入指示器至少顯示 200ms
      delay(200),
      map(task => {
        // 成功時更新任務列表 - 新任務加到頂部
        this.tasksSignal.update(tasks => [task, ...tasks]);
        return {
          success: true,
          task
        } as CreateTaskResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        
        return of({
          success: false,
          errors: [{ field: 'general', message: errorMessage }]
        } as CreateTaskResponse);
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 更新任務狀態
   * @param taskId 任務 ID
   * @param isCompleted 完成狀態
   * @returns Observable<Task>
   */
  updateTaskStatus(taskId: number, isCompleted: boolean): Observable<Task> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const request = { isCompleted };
    
    // 樂觀更新 - 先更新本地狀態
    this.updateTaskStatusLocally(taskId, isCompleted);

    return this.http.patch<Task>(`${this.apiUrl}/${taskId}/status`, request).pipe(
      tap(updatedTask => {
        // 伺服器回應後更新為正確的資料
        this.updateTaskInList(updatedTask);
      }),
      catchError((error: HttpErrorResponse) => {
        // 錯誤時回滾本地狀態
        this.updateTaskStatusLocally(taskId, !isCompleted);
        
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 切換任務完成狀態
   * @param task 要切換的任務
   * @returns Observable<Task>
   */
  toggleTaskStatus(task: Task): Observable<Task> {
    return this.updateTaskStatus(task.id, !task.isCompleted);
  }

  /**
   * 刪除任務
   * @param taskId 要刪除的任務 ID
   * @returns Observable<boolean>
   */
  deleteTask(taskId: number): Observable<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // 先樂觀地從本地狀態移除任務
    const taskToDelete = this.tasksSignal().find(task => task.id === taskId);
    if (taskToDelete) {
      this.removeTaskFromState(taskId);
    }

    return this.http.delete(`${this.apiUrl}/${taskId}`, { observe: 'response' }).pipe(
      map(response => response.status === 204),
      tap(success => {
        if (success) {
          // 刪除成功，任務已經在樂觀更新中移除了
          console.log(`任務 ${taskId} 已成功刪除`);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // 錯誤時恢復任務到狀態中
        if (taskToDelete) {
          this.addTaskToState(taskToDelete);
        }
        
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 更新任務描述
   * @param taskId 要更新的任務 ID
   * @param description 新的任務描述
   * @returns Observable<Task>
   */
  updateTaskDescription(taskId: number, description: string): Observable<Task> {
    // 客戶端驗證
    const validationErrors = this.validateTaskDescription(description);
    if (validationErrors.length > 0) {
      return throwError(() => new Error(validationErrors[0].message));
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // 保存原始描述用於錯誤回滾
    const originalTask = this.tasksSignal().find(task => task.id === taskId);
    if (!originalTask) {
      return throwError(() => new Error('找不到要更新的任務'));
    }

    // 樂觀更新本地狀態
    const updatedTask = { ...originalTask, description, updatedAt: new Date() };
    this.updateTaskInList(updatedTask);

    return this.http.patch<Task>(`${this.apiUrl}/${taskId}/description`, { description }).pipe(
      tap(serverTask => {
        // 使用伺服器回傳的任務資料更新本地狀態
        this.updateTaskInList(serverTask);
      }),
      catchError((error: HttpErrorResponse) => {
        // 錯誤時回滾本地狀態
        this.updateTaskInList(originalTask);
        
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 取得所有任務
   */
  getAllTasks(): Observable<Task[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => {
        this.tasksSignal.set(tasks);
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 根據狀態取得任務
   * @param status 任務狀態篩選
   * @returns Observable<Task[]>
   */
  getTasksByStatus(status?: TaskViewType): Observable<Task[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let url = this.apiUrl;
    if (status && status !== TaskViewType.ALL) {
      const statusParam = status === TaskViewType.TODO ? 'todo' : 'completed';
      url = `${this.apiUrl}?status=${statusParam}`;
    }

    return this.http.get<Task[]>(url).pipe(
      tap(tasks => {
        this.tasksSignal.set(tasks);
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.handleHttpError(error);
        this.errorSignal.set(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * 清除錯誤訊息
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * 重新設定任務列表 (主要用於測試)
   */
  resetTasks(): void {
    this.tasksSignal.set([]);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
  }

  /**
   * 本地更新任務狀態（樂觀更新用）
   */
  private updateTaskStatusLocally(taskId: number, isCompleted: boolean): void {
    this.tasksSignal.update(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted, updatedAt: new Date() }
          : task
      )
    );
  }

  /**
   * 更新任務列表中的任務
   */
  private updateTaskInList(updatedTask: Task): void {
    this.tasksSignal.update(tasks => 
      tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  }

  /**
   * 從狀態中移除任務
   */
  private removeTaskFromState(taskId: number): void {
    this.tasksSignal.update(tasks => 
      tasks.filter(task => task.id !== taskId)
    );
  }

  /**
   * 添加任務到狀態中
   */
  private addTaskToState(task: Task): void {
    this.tasksSignal.update(tasks => {
      // 確保不重複添加
      if (tasks.some(t => t.id === task.id)) {
        return tasks;
      }
      // 按創建時間排序，新任務在頂部
      return [task, ...tasks];
    });
  }

  /**
   * 驗證任務描述
   */
  private validateTaskDescription(description: string): TaskValidationError[] {
    const errors: TaskValidationError[] = [];
    
    if (!description || description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: '請輸入任務描述'
      });
    } else if (description.trim().length > 500) {
      errors.push({
        field: 'description',
        message: '任務描述不能超過 500 字元'
      });
    }

    return errors;
  }

  /**
   * 處理 HTTP 錯誤
   */
  private handleHttpError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      // 網路錯誤或 CORS 問題
      return '暫時無法連接到服務器';
    } else if (error.status === 400) {
      // 驗證錯誤
      if (error.error?.errors && Array.isArray(error.error.errors)) {
        return error.error.errors.join(', ');
      } else if (error.error?.Message) {
        return error.error.Message;
      }
      return '輸入資料有誤，請檢查後重試';
    } else if (error.status === 500) {
      return '服務器發生錯誤，請稍後再試';
    }
    
    return `發生未知錯誤 (${error.status}): ${error.message}`;
  }
}
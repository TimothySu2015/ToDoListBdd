import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task, CreateTaskResponse } from '../models/task.interface';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:5000/api/tasks';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.resetTasks();
  });

  describe('初始狀態', () => {
    it('應該建立服務', () => {
      expect(service).toBeTruthy();
    });

    it('初始狀態應該正確', () => {
      expect(service.tasks().length).toBe(0);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.taskCount()).toBe(0);
    });
  });

  describe('createTask', () => {
    it('應該成功建立任務', (done) => {
      const description = '測試任務';
      const mockTask: Task = {
        id: 1,
        description,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.createTask(description).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.task).toEqual(mockTask);
        expect(service.tasks().length).toBe(1);
        expect(service.tasks()[0]).toEqual(mockTask);
        expect(service.taskCount()).toBe(1);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ description });
      req.flush(mockTask);
    });

    it('應該將新任務加到列表頂部', (done) => {
      // 設定初始任務
      const existingTask: Task = {
        id: 1,
        description: '舊任務',
        isCompleted: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };
      service['tasksSignal'].set([existingTask]);

      const newDescription = '新任務';
      const newTask: Task = {
        id: 2,
        description: newDescription,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      service.createTask(newDescription).subscribe(response => {
        expect(response.success).toBe(true);
        expect(service.tasks().length).toBe(2);
        expect(service.tasks()[0]).toEqual(newTask); // 新任務在頂部
        expect(service.tasks()[1]).toEqual(existingTask); // 舊任務在底部
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(newTask);
    });

    it('應該驗證空白描述', (done) => {
      service.createTask('').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.errors).toBeDefined();
        expect(response.errors![0].message).toBe('請輸入任務描述');
        expect(service.tasks().length).toBe(0);
        done();
      });

      httpMock.expectNone(apiUrl);
    });

    it('應該驗證過長描述', (done) => {
      const longDescription = 'a'.repeat(501);
      
      service.createTask(longDescription).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.errors).toBeDefined();
        expect(response.errors![0].message).toBe('任務描述不能超過 500 字元');
        done();
      });

      httpMock.expectNone(apiUrl);
    });

    it('應該處理 HTTP 400 錯誤', (done) => {
      const description = '測試任務';
      const errorResponse = {
        errors: ['請輸入任務描述']
      };

      service.createTask(description).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.errors![0].message).toContain('請輸入任務描述');
        expect(service.error()).toContain('請輸入任務描述');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('應該處理網路錯誤', (done) => {
      const description = '測試任務';

      service.createTask(description).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.errors![0].message).toBe('暫時無法連接到服務器');
        expect(service.error()).toBe('暫時無法連接到服務器');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.error(new ProgressEvent('Network error'), { status: 0 });
    });

    it('應該設定載入狀態', (done) => {
      const subscription = service.createTask('測試任務').subscribe({
        next: () => {
          // 使用微任務確保狀態已更新
          Promise.resolve().then(() => {
            expect(service.loading()).toBe(false);
            done();
          });
        }
      });

      // 載入開始時
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(apiUrl);
      req.flush({ id: 1, description: '測試任務', isCompleted: false, createdAt: new Date(), updatedAt: new Date() });
    });
  });

  describe('getAllTasks', () => {
    it('應該取得所有任務', (done) => {
      const mockTasks: Task[] = [
        {
          id: 1,
          description: '任務1',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          description: '任務2',
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      service.getAllTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
        expect(service.tasks()).toEqual(mockTasks);
        expect(service.taskCount()).toBe(2);
        expect(service.incompleteTasks().length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('工具方法', () => {
    it('clearError 應該清除錯誤', () => {
      service['errorSignal'].set('測試錯誤');
      expect(service.error()).toBe('測試錯誤');
      
      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('resetTasks 應該重設所有狀態', () => {
      // 設定一些狀態
      service['tasksSignal'].set([
        {
          id: 1,
          description: '測試',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      service['loadingSignal'].set(true);
      service['errorSignal'].set('錯誤');

      service.resetTasks();

      expect(service.tasks().length).toBe(0);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('計算屬性', () => {
    it('incompleteTasks 應該過濾未完成的任務', () => {
      const tasks: Task[] = [
        {
          id: 1,
          description: '未完成任務',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          description: '已完成任務',
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      service['tasksSignal'].set(tasks);

      expect(service.incompleteTasks().length).toBe(1);
      expect(service.incompleteTasks()[0].description).toBe('未完成任務');
    });
  });
});
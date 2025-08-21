export interface Task {
  id: number;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  description: string;
}

export interface TaskValidationError {
  field: string;
  message: string;
}

export interface CreateTaskResponse {
  success: boolean;
  task?: Task;
  errors?: TaskValidationError[];
}

export enum TaskViewType {
  TODO = 'todo',
  COMPLETED = 'completed',
  ALL = 'all'
}
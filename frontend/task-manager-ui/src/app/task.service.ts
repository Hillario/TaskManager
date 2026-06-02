import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Change 'public' to 'export' so it can be imported by app.component.ts
export interface ProjectTask {
  id?: number;
  title: string;
  isCompleted: boolean;
  priority: TaskPriority;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5295/api/tasks'; 

  getTasks(): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(this.apiUrl);
  }

  createTask(task: ProjectTask): Observable<ProjectTask> {
    return this.http.post<ProjectTask>(this.apiUrl, task);
  }

  updateTask(id: number, task: ProjectTask): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<ProjectTask> {
    return this.http.delete<ProjectTask>(`${this.apiUrl}/${id}`);
  }
}
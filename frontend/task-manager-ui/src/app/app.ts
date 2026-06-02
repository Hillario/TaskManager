import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, ProjectTask, TaskPriority } from './task.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // Required for structural directives & double binding
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private taskService = inject(TaskService);

  // Modern Angular Signals State Management
  tasks = signal<ProjectTask[]>([]);
  newTaskTitle = '';
  selectedPriority: TaskPriority = 'Medium';
  editingTaskId: number | null = null;
  editTaskTitle = '';
  editTaskPriority: TaskPriority = 'Medium';
  readonly priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
  readonly priorityClassMap: Record<TaskPriority, string> = {
    Low: 'priority-low',
    Medium: 'priority-medium',
    High: 'priority-high'
  };

  // Computed Values (Auto-recalculate whenever the tasks signal changes)
  totalTasks = computed(() => this.tasks().length);
  completedCount = computed(() => this.tasks().filter(t => t.isCompleted).length);

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error('API Connection Error:', err)
    });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      title: this.newTaskTitle,
      isCompleted: false,
      priority: this.selectedPriority
    };
    this.taskService.createTask(newTask).subscribe(savedTask => {
      this.tasks.update(currentTasks => [...currentTasks, savedTask]);
      this.newTaskTitle = '';
      this.selectedPriority = 'Medium';
    });
  }

  toggleComplete(task: ProjectTask) {
    const updated = { ...task, isCompleted: !task.isCompleted };
    this.taskService.updateTask(task.id!, updated).subscribe(() => {
      this.tasks.update(currentTasks =>
        currentTasks.map(t => t.id === task.id ? updated : t)
      );
    });
  }

  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe(() => {
      this.tasks.update(currentTasks => currentTasks.filter(t => t.id !== id));
    });
  }

  startEdit(task: ProjectTask) {
    this.editingTaskId = task.id ?? null;
    this.editTaskTitle = task.title;
    this.editTaskPriority = task.priority;
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editTaskTitle = '';
    this.editTaskPriority = 'Medium';
  }

  saveEdit(task: ProjectTask) {
    if (!task.id || !this.editTaskTitle.trim()) return;

    const updatedTask: ProjectTask = {
      ...task,
      title: this.editTaskTitle.trim(),
      priority: this.editTaskPriority
    };

    this.taskService.updateTask(task.id, updatedTask).subscribe(() => {
      this.tasks.update(currentTasks =>
        currentTasks.map(t => t.id === task.id ? updatedTask : t)
      );
      this.cancelEdit();
    });
  }

  getPriorityClass(priority: TaskPriority) {
    return this.priorityClassMap[priority];
  }
}
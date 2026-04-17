import { Injectable, signal } from '@angular/core';

export interface RunbookTask {
  id: string;
  title: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StaffRunbookService {
  /**
   * Performance optimization: Signals ensure real-time staff sync
   * is consistently efficient without heavy Zone.js overhead.
   */
  private tasksSignal = signal<RunbookTask[]>([]);
  readonly tasks = this.tasksSignal.asReadonly();

  constructor() {
    this.initializeRunbookSync();
  }

  private initializeRunbookSync() {
    // In production, this would be a Firestore onSnapshot listener
    const mockTasks: RunbookTask[] = [
      { id: '1', title: 'Main Stage Audio Check', assignedTo: 'John Doe', status: 'completed', priority: 'high', lastUpdated: new Date() },
      { id: '2', title: 'VIP Lounge Catering Setup', assignedTo: 'Jane Smith', status: 'in-progress', priority: 'medium', lastUpdated: new Date() },
      { id: '3', title: 'Crowd Control Hall B', assignedTo: 'Security Team', status: 'pending', priority: 'high', lastUpdated: new Date() }
    ];
    this.tasksSignal.set(mockTasks);
  }

  updateTaskStatus(taskId: string, status: RunbookTask['status']) {
    this.tasksSignal.update(tasks => 
      tasks.map(t => t.id === taskId ? { ...t, status, lastUpdated: new Date() } : t)
    );
    // In production, this would call firestore.doc(taskId).update({ status });
  }

  addTask(task: Omit<RunbookTask, 'id' | 'lastUpdated'>) {
    const newTask: RunbookTask = {
      ...task,
      id: Math.random().toString(36).substring(7),
      lastUpdated: new Date()
    };
    this.tasksSignal.update(tasks => [...tasks, newTask]);
  }
}

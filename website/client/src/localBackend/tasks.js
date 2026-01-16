import { v4 as uuid } from 'uuid';
import { ensureCreateSyncedYDoc } from './sync';
import taskDefaults from '@/../../common/script/libs/taskDefaults';

/**
 * Get all tasks from the local Yjs document
 */
export async function getAllTasks() {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  return tasksArray.toArray();
}

/**
 * Get tasks by type
 */
export async function getTasksByType(type) {
  const tasks = await getAllTasks();
  return tasks.filter(task => task.type === type);
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId) {
  const tasks = await getAllTasks();
  return tasks.find(task => task._id === taskId);
}

/**
 * Create a new task
 */
export async function createTask(taskData, user) {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  
  // Apply default values to the task
  const newTask = taskDefaults(taskData, user);
  
  // Add to Yjs array
  tasksArray.unshift([newTask]);
  
  return newTask;
}

/**
 * Update an existing task
 */
export async function updateTask(taskId, updates) {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  const tasks = tasksArray.toArray();
  
  const taskIndex = tasks.findIndex(task => task._id === taskId);
  if (taskIndex === -1) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  const updatedTask = { ...tasks[taskIndex], ...updates, updatedAt: new Date() };
  
  // Replace the task at the index
  tasksArray.delete(taskIndex, 1);
  tasksArray.insert(taskIndex, [updatedTask]);
  
  return updatedTask;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  const tasks = tasksArray.toArray();
  
  const taskIndex = tasks.findIndex(task => task._id === taskId);
  if (taskIndex === -1) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  tasksArray.delete(taskIndex, 1);
  return { success: true };
}

/**
 * Score a task (when user completes/checks it)
 * This applies the game mechanics locally
 */
export async function scoreTask(taskId, direction, user) {
  const task = await getTask(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  // Import the scoreTask operation from common script
  const scoreTaskOp = require('@/../../common/script/ops/scoreTask').default;
  
  // Apply the scoring operation (this modifies user and task in place)
  const result = scoreTaskOp(user, { params: { id: taskId, direction } }, task);
  
  // Update the task in the local store
  await updateTask(taskId, task);
  
  return result;
}

/**
 * Move/reorder tasks
 */
export async function moveTask(taskId, toIndex) {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  const tasks = tasksArray.toArray();
  
  const fromIndex = tasks.findIndex(task => task._id === taskId);
  if (fromIndex === -1) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  const task = tasks[fromIndex];
  
  // Remove from old position
  tasksArray.delete(fromIndex, 1);
  
  // Insert at new position
  tasksArray.insert(toIndex, [task]);
  
  return { success: true };
}

/**
 * Clear completed todos
 */
export async function clearCompletedTodos() {
  const ydoc = await ensureCreateSyncedYDoc();
  const tasksArray = ydoc.getArray('tasks');
  const tasks = tasksArray.toArray();
  
  // Find all completed todos
  const completedIndices = [];
  tasks.forEach((task, index) => {
    if (task.type === 'todo' && task.completed) {
      completedIndices.push(index);
    }
  });
  
  // Delete in reverse order to maintain indices
  completedIndices.reverse().forEach(index => {
    tasksArray.delete(index, 1);
  });
  
  return { success: true };
}

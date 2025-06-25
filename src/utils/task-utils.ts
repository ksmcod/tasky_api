import { TaskPriority, TaskStatus } from "../../generated/prisma";

export interface GetTasksFilter {
  assigneeId?: string;
  priority?: {
    in: TaskPriority[];
  };
  status?: {
    in: TaskStatus[];
  };
}

export interface GetTasksSorter {
  priorityWeight?: "asc" | "desc";
  statusWeight?: "asc" | "desc";
  dueDate?: "asc" | "desc";
  createdAt?: "asc" | "desc";
}

export const statusWeightMap = {
  [TaskStatus.PENDING]: 1,
  [TaskStatus.IN_PROGRESS]: 2,
  [TaskStatus.COMPLETED]: 3,
};

export const priorityWeightMap = {
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
};

import { ApiService } from "./api";
import type { Task, TaskPriority, User } from "./types";

export class TaskService {
	private api: ApiService;

	constructor(api: ApiService) {
		this.api = api;
	}

	getTasksByStoryId(storyId: string): Task[] {
		return this.api.getTasksByStoryId(storyId);
	}

	getTasksByProjectId(projectId: string): Task[] {
		return this.api.getTasksByProjectId(projectId);
	}

	getTaskById(taskId: string): Task | null {
		return this.api.getTaskById(taskId);
	}

	getAssignableUsers(): User[] {
		return this.api.getAssignableUsers();
	}

	createTask(input: {
		name: string;
		description?: string;
		priority: TaskPriority;
		storyId: string;
		estimatedHours: number;
	}): Task {
		return this.api.createTask({
			name: input.name,
			description: input.description ?? "",
			priority: input.priority,
			storyId: input.storyId,
			estimatedHours: input.estimatedHours,
			status: "todo",
			startedAt: null,
			completedAt: null,
			assigneeId: null,
		});
	}

	updateTask(
		taskId: string,
		input: {
			name: string;
			description?: string;
			priority: TaskPriority;
			estimatedHours: number;
		},
	): void {
		const existingTask = this.api.getTaskById(taskId);

		if (!existingTask) {
			return;
		}

		this.api.updateTask({
			...existingTask,
			name: input.name,
			description: input.description ?? "",
			priority: input.priority,
			estimatedHours: input.estimatedHours,
		});
	}

	deleteTask(taskId: string): void {
		const task = this.api.getTaskById(taskId);

		if (!task) {
			return;
		}

		const storyId = task.storyId;

		this.api.deleteTask(taskId);
		this.updateStoryStatusBasedOnTasks(storyId);
	}

	assignUserToTask(taskId: string, userId: string): void {
		const task = this.api.getTaskById(taskId);

		if (!task) {
			return;
		}

		const user = this.api.getUsers().find((u) => u.id === userId);

		if (!user) {
			return;
		}

		if (user.role !== "developer" && user.role !== "devops") {
			return;
		}

		const updatedTask: Task = {
			...task,
			assigneeId: userId,
			status: "doing",
			startedAt: task.startedAt ?? new Date().toISOString(),
			completedAt: null,
		};

		this.api.updateTask(updatedTask);

		const story = this.api.getStoryById(task.storyId);
		if (story && story.status === "todo") {
			this.api.updateStory({
				...story,
				status: "doing",
			});
		}
	}

	markTaskAsDone(taskId: string): void {
		const task = this.api.getTaskById(taskId);

		if (!task) {
			return;
		}

		if (!task.assigneeId) {
			return;
		}

		const updatedTask: Task = {
			...task,
			status: "done",
			startedAt: task.startedAt ?? new Date().toISOString(),
			completedAt: new Date().toISOString(),
		};

		this.api.updateTask(updatedTask);
		this.updateStoryStatusBasedOnTasks(task.storyId);
	}

	moveTaskToTodo(taskId: string): void {
		const task = this.api.getTaskById(taskId);

		if (!task) {
			return;
		}

		const updatedTask: Task = {
			...task,
			status: "todo",
			startedAt: null,
			completedAt: null,
			assigneeId: null,
		};

		this.api.updateTask(updatedTask);
		this.updateStoryStatusBasedOnTasks(task.storyId);
	}

	private updateStoryStatusBasedOnTasks(storyId: string): void {
		const story = this.api.getStoryById(storyId);

		if (!story) {
			return;
		}

		const tasks = this.api.getTasksByStoryId(storyId);

		if (tasks.length === 0) {
			this.api.updateStory({
				...story,
				status: "todo",
			});
			return;
		}

		const allDone = tasks.every((task) => task.status === "done");
		const anyDoingOrDone = tasks.some(
			(task) => task.status === "doing" || task.status === "done",
		);

		if (allDone) {
			this.api.updateStory({
				...story,
				status: "done",
			});
			return;
		}

		if (anyDoingOrDone) {
			this.api.updateStory({
				...story,
				status: "doing",
			});
			return;
		}

		this.api.updateStory({
			...story,
			status: "todo",
		});
	}
}

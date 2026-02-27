import type { Status, Task } from "./types";

export function createTask(title: string, description?: string): Task {
	return {
		id: crypto.randomUUID(),
		title: title.trim(),
		description: description?.trim(),
		status: "todo",
		createdAt: Date.now(),
	};
}

export function addTask(tasks: Task[], task: Task): Task[] {
	return [...tasks, task];
}

export function deleteTask(tasks: Task[], id: string): Task[] {
	return tasks.filter((t) => t.id !== id);
}

export function moveTask(tasks: Task[], id: string, newStatus: Status): Task[] {
	return tasks.map((t) => {
		if (t.id !== id) return t;
		return { ...t, status: newStatus };
	});
}

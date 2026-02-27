import type { Task } from "./types";

const KEY = "manageme_tasks_v1";

export function loadTasks(): Task[] {
	const raw = localStorage.getItem(KEY);
	if (!raw) return [];

	try {
		const data = JSON.parse(raw);
		return data as Task[];
	} catch {
		return [];
	}
}

export function saveTasks(tasks: Task[]): void {
	localStorage.setItem(KEY, JSON.stringify(tasks));
}

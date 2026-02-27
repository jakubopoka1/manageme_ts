import type { Status, Task } from "./types";
import { createTask, addTask, deleteTask, moveTask } from "./store";
import { saveTasks } from "./storage";
import { renderBoard } from "./render";

type GetTasks = () => Task[];
type SetTasks = (next: Task[]) => void;

export function initEvents(getTasks: GetTasks, setTasks: SetTasks): void {
	const form = document.querySelector<HTMLFormElement>("#task-form");
	const board = document.querySelector<HTMLDivElement>("#board");

	if (!form || !board) return;

	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const fd = new FormData(form);
		const title = String(fd.get("title") ?? "").trim();
		const descriptionRaw = String(fd.get("description") ?? "").trim();
		const description = descriptionRaw.length > 0 ? descriptionRaw : undefined;

		if (!title) return;

		const newTask = createTask(title, description);

		const tasks = getTasks();
		const next = addTask(tasks, newTask);

		setTasks(next);
		saveTasks(next);
		renderBoard(next);

		form.reset();
	});

	board.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		const action = target.dataset.action;
		const id = target.dataset.id;

		if (action !== "delete" || !id) return;

		const tasks = getTasks();
		const next = deleteTask(tasks, id);

		setTasks(next);
		saveTasks(next);
		renderBoard(next);
	});

	board.addEventListener("change", (e) => {
		const target = e.target as HTMLElement;

		if (!(target instanceof HTMLSelectElement)) return;
		if (target.dataset.action !== "move") return;

		const id = target.dataset.id;
		if (!id) return;

		const newStatus = target.value as Status;

		const tasks = getTasks();
		const next = moveTask(tasks, id, newStatus);

		setTasks(next);
		saveTasks(next);
		renderBoard(next);
	});
}

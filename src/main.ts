import "./style.css";

import type { Task } from "./types";
import { loadTasks } from "./storage";
import { renderBoard } from "./render";
import { initEvents } from "./events";

let tasks: Task[] = loadTasks();

renderBoard(tasks);

initEvents(
	() => tasks,
	(next) => {
		tasks = next;
	},
);

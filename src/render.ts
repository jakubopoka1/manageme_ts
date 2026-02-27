import type { Task, Status } from "./types";

const COLUMNS: Array<{ status: Status; title: string }> = [
	{ status: "todo", title: "Todo" },
	{ status: "doing", title: "Doing" },
	{ status: "done", title: "Done" },
];

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function taskCard(task: Task): string {
	const desc = task.description?.trim();
	return `
    <div class="task" data-id="${task.id}">
        <div class="task_title">${escapeHtml(task.title)}</div>
        ${desc ? `<div class ="task_desc">${escapeHtml(desc)}</div>` : ""}

        <div class="task_actions">
            <select data-action="move" data-id="${task.id}">
                <option value="todo" ${task.status === "todo" ? "selected" : ""}>Todo</option>
                <option value="doing" ${task.status === "doing" ? "selected" : ""}>Doing</option>
                <option value="done" ${task.status === "done" ? "selected" : ""}>Done</option>
            </select>

            <button type="button" data-action="delete" data-id="${task.id}">Usuń</button>
        </div>
    </div>
    `;
}

export function renderBoard(tasks: Task[]): void {
	const board = document.querySelector<HTMLDivElement>("#board");
	if (!board) return;

	board.innerHTML = COLUMNS.map((col) => {
		const items = tasks.filter((t) => t.status === col.status);

		return `
            <section class="column" data-status="${col.status}">
                <h2>${col.title}</h2>
                <div class="column_items">
                    ${items.map(taskCard).join("")}
                </div>
            </section>
        `;
	}).join("");
}

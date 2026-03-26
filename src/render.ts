import type {
	Project,
	Story,
	StoryStatus,
	Task,
	TaskStatus,
	User,
} from "./types";

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function formatDate(value: string | null): string {
	if (!value) {
		return "-";
	}

	return new Date(value).toLocaleString();
}

function getUserLabel(user: User): string {
	return `${user.firstName} ${user.lastName} (${user.role})`;
}

function storyCard(story: Story): string {
	return `
    <div class="story-card">
      <h3>${escapeHtml(story.name)}</h3>
      <p>${escapeHtml(story.description ?? "")}</p>
      <p><strong>Priorytet:</strong> ${escapeHtml(story.priority)}</p>
      <p><strong>Status:</strong> ${escapeHtml(story.status)}</p>
      <p><strong>Data:</strong> ${formatDate(story.createdAt)}</p>

      <div class="story-actions">
        <button data-action="edit" data-id="${story.id}">Edytuj</button>
        <button data-action="delete" data-id="${story.id}">Usuń</button>
        ${story.status !== "todo" ? `<button data-action="move-todo" data-id="${story.id}">Todo</button>` : ""}
        ${story.status !== "doing" ? `<button data-action="move-doing" data-id="${story.id}">Doing</button>` : ""}
        ${story.status !== "done" ? `<button data-action="move-done" data-id="${story.id}">Done</button>` : ""}
      </div>
    </div>
  `;
}

function renderStoryColumn(
	title: string,
	status: StoryStatus,
	stories: Story[],
): string {
	const filteredStories = stories.filter((story) => story.status === status);

	return `
    <section class="column ${status}">
      <h2>${title}</h2>
      <div class="story-list">
        ${
					filteredStories.length > 0
						? filteredStories.map(storyCard).join("")
						: "<p>Brak historyjek</p>"
				}
      </div>
    </section>
  `;
}

function taskCard(
	task: Task,
	stories: Story[],
	assignableUsers: User[],
): string {
	const story = stories.find((item) => item.id === task.storyId) ?? null;
	const assignedUser =
		assignableUsers.find((user) => user.id === task.assigneeId) ?? null;

	return `
    <div class="task-card">
      <h3>${escapeHtml(task.name)}</h3>
      <p>${escapeHtml(task.description ?? "")}</p>

      <div class="task-details">
        <p><strong>Priorytet:</strong> ${escapeHtml(task.priority)}</p>
        <p><strong>Status:</strong> ${escapeHtml(task.status)}</p>
        <p><strong>Historyjka:</strong> ${story ? escapeHtml(story.name) : "-"}</p>
        <p><strong>Przewidywany czas:</strong> ${task.estimatedHours} h</p>
        <p><strong>Data dodania:</strong> ${formatDate(task.createdAt)}</p>
        <p><strong>Data startu:</strong> ${formatDate(task.startedAt)}</p>
        <p><strong>Data zakończenia:</strong> ${formatDate(task.completedAt)}</p>
        <p><strong>Przypisana osoba:</strong> ${assignedUser ? escapeHtml(getUserLabel(assignedUser)) : "-"}</p>
      </div>

      <div class="task-assign">
        <label>
          Przypisz osobę:
          <select data-assign-task="true" data-task-id="${task.id}">
            <option value="">Wybierz użytkownika</option>
            ${assignableUsers
							.map(
								(user) => `
                  <option value="${user.id}" ${user.id === task.assigneeId ? "selected" : ""}>
                    ${escapeHtml(getUserLabel(user))}
                  </option>
                `,
							)
							.join("")}
          </select>
        </label>
      </div>

      <div class="task-actions">
        <button data-task-action="edit" data-task-id="${task.id}">Edytuj</button>
        <button data-task-action="delete" data-task-id="${task.id}">Usuń</button>
        ${task.status !== "todo" ? `<button data-task-action="todo" data-task-id="${task.id}">Todo</button>` : ""}
        ${task.status !== "done" ? `<button data-task-action="done" data-task-id="${task.id}">Done</button>` : ""}
      </div>
    </div>
  `;
}

function renderTaskColumn(
	title: string,
	status: TaskStatus,
	tasks: Task[],
	stories: Story[],
	assignableUsers: User[],
): string {
	const filteredTasks = tasks.filter((task) => task.status === status);

	return `
    <section class="column ${status}">
      <h2>${title}</h2>
      <div class="task-list">
        ${
					filteredTasks.length > 0
						? filteredTasks
								.map((task) => taskCard(task, stories, assignableUsers))
								.join("")
						: "<p>Brak zadań</p>"
				}
      </div>
    </section>
  `;
}

export function renderApp(params: {
	user: User | null;
	projects: Project[];
	activeProjectId: string | null;
	stories: Story[];
	tasks: Task[];
	assignableUsers: User[];
}): void {
	const app = document.querySelector<HTMLDivElement>("#app");

	if (!app) {
		return;
	}

	const { user, projects, activeProjectId, stories, tasks, assignableUsers } =
		params;

	app.innerHTML = `
    <header class="topbar">
      <div>
        <h1>Project Board</h1>
        <p>
          Zalogowany użytkownik:
          <strong>
            ${
							user
								? `${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)} (${escapeHtml(user.role)})`
								: "Brak"
						}
          </strong>
        </p>
      </div>

      <div class="project-picker">
        <label for="projectSelect">Aktywny projekt:</label>
        <select id="projectSelect">
          ${projects
						.map(
							(project) => `
                <option value="${project.id}" ${project.id === activeProjectId ? "selected" : ""}>
                  ${escapeHtml(project.name)}
                </option>
              `,
						)
						.join("")}
        </select>
      </div>
    </header>

    <section class="forms-grid">
      <section class="story-form-section">
        <h2 id="formTitle">Dodaj historyjkę</h2>
        <form id="storyForm" class="story-form">
          <input type="hidden" id="editingStoryId" value="" />

          <input type="text" id="name" placeholder="Nazwa historyjki" required />
          <textarea id="description" placeholder="Opis" required></textarea>

          <select id="priority">
            <option value="low">Niski</option>
            <option value="medium" selected>Średni</option>
            <option value="high">Wysoki</option>
          </select>

          <select id="status">
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>

          <div class="form-actions">
            <button type="submit" id="submitButton">Dodaj</button>
            <button type="button" id="cancelEditButton" hidden>Anuluj</button>
          </div>
        </form>
      </section>

      <section class="task-form-section">
        <h2 id="taskFormTitle">Dodaj zadanie</h2>
        <form id="taskForm" class="task-form">
          <input type="hidden" id="editingTaskId" value="" />

          <input type="text" id="taskName" placeholder="Nazwa zadania" required />
          <textarea id="taskDescription" placeholder="Opis zadania" required></textarea>

          <select id="taskPriority">
            <option value="low">Niski</option>
            <option value="medium" selected>Średni</option>
            <option value="high">Wysoki</option>
          </select>

          <select id="taskStoryId" required>
            <option value="">Wybierz historyjkę</option>
            ${stories
							.map(
								(story) => `
                  <option value="${story.id}">${escapeHtml(story.name)}</option>
                `,
							)
							.join("")}
          </select>

          <input
            type="number"
            id="taskEstimatedHours"
            placeholder="Przewidywany czas (h)"
            min="1"
            required
          />

          <div class="form-actions">
            <button type="submit" id="taskSubmitButton">Dodaj zadanie</button>
            <button type="button" id="cancelTaskEditButton" hidden>Anuluj</button>
          </div>
        </form>
      </section>
    </section>

    <section class="board-section">
      <h2>Tablica historyjek</h2>
      <main class="board">
        ${renderStoryColumn("Czekające", "todo", stories)}
        ${renderStoryColumn("W trakcie", "doing", stories)}
        ${renderStoryColumn("Zamknięte", "done", stories)}
      </main>
    </section>

    <section class="board-section">
      <h2>Tablica zadań</h2>
      <main class="board">
        ${renderTaskColumn("Czekające", "todo", tasks, stories, assignableUsers)}
        ${renderTaskColumn("W trakcie", "doing", tasks, stories, assignableUsers)}
        ${renderTaskColumn("Zamknięte", "done", tasks, stories, assignableUsers)}
      </main>
    </section>
  `;
}

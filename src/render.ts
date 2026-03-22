import type { Project, Story, StoryStatus, User } from "./types";

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function storyCard(story: Story): string {
	return `
    <div class="story-card">
      <h3>${escapeHtml(story.name)}</h3>
      <p>${escapeHtml(story.description ?? "")}</p>
      <p><strong>Priorytet:</strong> ${story.priority}</p>
      <p><strong>Data:</strong> ${new Date(story.createdAt).toLocaleString()}</p>
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

function renderColumn(
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

export function renderApp(params: {
	user: User | null;
	projects: Project[];
	activeProjectId: string | null;
	stories: Story[];
}): void {
	const app = document.querySelector<HTMLDivElement>("#app");

	if (!app) {
		return;
	}

	const { user, projects, activeProjectId, stories } = params;

	app.innerHTML = `
    <header class="topbar">
      <div>
        <h1>Project Board</h1>
        <p>
          Zalogowany użytkownik:
          <strong>${user ? `${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}` : "Brak"}</strong>
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

    <main class="board">
      ${renderColumn("Czekające", "todo", stories)}
      ${renderColumn("W trakcie", "doing", stories)}
      ${renderColumn("Zamknięte", "done", stories)}
    </main>
  `;
}

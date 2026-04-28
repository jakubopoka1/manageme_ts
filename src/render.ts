import type {
	Notification,
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

function getPriorityLabel(priority: string): string {
	switch (priority) {
		case "high":
			return "Wysoki";
		case "medium":
			return "Średni";
		default:
			return "Niski";
	}
}

function renderLoginView(): string {
	return `
		<section class="auth-card card shadow-sm border-0">
			<div class="card-body text-center">
				<h1>Project Board</h1>
				<p>Zaloguj się kontem Google, aby wejść do aplikacji.</p>
				<div id="googleLoginButton" class="d-flex justify-content-center"></div>
			</div>
		</section>
	`;
}

function renderGuestView(user: User): string {
	return `
		<section class="auth-card card shadow-sm border-0">
			<div class="card-body text-center">
				<h1>Oczekiwanie na zatwierdzenie konta</h1>
				<p>
					Witaj, <strong>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</strong>.
				</p>
				<p>Twoje konto ma obecnie rolę <strong>gość</strong>.</p>
				<p>Administrator musi nadać Ci dostęp do aplikacji.</p>
				<p>${escapeHtml(user.email)}</p>
				<button id="logoutButton" class="btn btn-outline-secondary">Wyloguj</button>
			</div>
		</section>
	`;
}

function renderBlockedView(user: User): string {
	return `
		<section class="auth-card card shadow-sm border-0">
			<div class="card-body text-center">
				<h1>Konto zablokowane</h1>
				<p>Użytkownik <strong>${escapeHtml(user.email)}</strong> nie ma dostępu do aplikacji.</p>
				<button id="logoutButton" class="btn btn-outline-secondary">Wyloguj</button>
			</div>
		</section>
	`;
}

function renderUsersSection(users: User[], currentUser: User): string {
	if (currentUser.role !== "admin") {
		return "";
	}

	return `
		<section class="board-section" id="usersSection">
			<h2>Lista użytkowników</h2>

			<div class="users-table-wrapper">
				<table class="table table-striped align-middle">
					<thead>
						<tr>
							<th>Imię i nazwisko</th>
							<th>E-mail</th>
							<th>Rola</th>
							<th>Status</th>
							<th>Data utworzenia</th>
							<th>Akcje</th>
						</tr>
					</thead>
					<tbody>
						${users
							.map(
								(user) => `
									<tr>
										<td>
											${
												user.avatarUrl
													? `<img src="${escapeHtml(user.avatarUrl)}" alt="" class="user-avatar" />`
													: ""
											}
											${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}
										</td>
										<td>${escapeHtml(user.email)}</td>
										<td>
											<select
												class="form-select"
												data-user-role="true"
												data-user-id="${user.id}"
												${user.id === currentUser.id ? "disabled" : ""}
											>
												<option value="guest" ${user.role === "guest" ? "selected" : ""}>Gość</option>
												<option value="developer" ${user.role === "developer" ? "selected" : ""}>Developer</option>
												<option value="devops" ${user.role === "devops" ? "selected" : ""}>DevOps</option>
												<option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
											</select>
										</td>
										<td>${user.isBlocked ? "Zablokowany" : "Aktywny"}</td>
										<td>${formatDate(user.createdAt)}</td>
										<td>
											<button
												class="btn btn-sm ${user.isBlocked ? "btn-success" : "btn-danger"}"
												data-user-block="true"
												data-user-id="${user.id}"
												data-blocked="${user.isBlocked}"
												${user.id === currentUser.id ? "disabled" : ""}
											>
												${user.isBlocked ? "Odblokuj" : "Zablokuj"}
											</button>
										</td>
									</tr>
								`,
							)
							.join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;
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

function renderNotificationList(
	notifications: Notification[],
	selectedNotificationId: string | null,
): string {
	if (notifications.length === 0) {
		return "<p>Brak powiadomień.</p>";
	}

	return `
		<div class="notifications-list">
			${notifications
				.map(
					(notification) => `
						<article class="notification-card ${notification.priority} ${notification.isRead ? "read" : "unread"} ${selectedNotificationId === notification.id ? "active" : ""}">
							<div class="notification-card-top">
								<h3>${escapeHtml(notification.title)}</h3>
								<span class="notification-priority ${notification.priority}">${getPriorityLabel(notification.priority)}</span>
							</div>
							<p>${escapeHtml(notification.message)}</p>
							<p><strong>Data:</strong> ${formatDate(notification.date)}</p>
							<p><strong>Status:</strong> ${notification.isRead ? "Przeczytane" : "Nieprzeczytane"}</p>
							<div class="notification-actions">
								<button data-notification-open="${notification.id}">Szczegóły</button>
								${!notification.isRead ? `<button data-notification-read="${notification.id}">Oznacz jako przeczytane</button>` : ""}
							</div>
						</article>
					`,
				)
				.join("")}
		</div>
	`;
}

function renderNotificationDetails(
	selectedNotification: Notification | null,
): string {
	if (!selectedNotification) {
		return `
			<div class="notification-details-empty">
				<p>Wybierz powiadomienie z listy, aby zobaczyć szczegóły.</p>
			</div>
		`;
	}

	return `
		<article class="notification-details-card ${selectedNotification.priority}">
			<h3>${escapeHtml(selectedNotification.title)}</h3>
			<p>${escapeHtml(selectedNotification.message)}</p>
			<p><strong>Priorytet:</strong> ${getPriorityLabel(selectedNotification.priority)}</p>
			<p><strong>Data utworzenia:</strong> ${formatDate(selectedNotification.date)}</p>
			<p><strong>Status:</strong> ${selectedNotification.isRead ? "Przeczytane" : "Nieprzeczytane"}</p>
			<div class="notification-actions">
				${!selectedNotification.isRead ? `<button data-notification-read="${selectedNotification.id}">Oznacz jako przeczytane</button>` : ""}
				<button data-notification-clear-details="true">Zamknij szczegóły</button>
			</div>
		</article>
	`;
}

function renderNotificationModal(notification: Notification | null): string {
	if (!notification) {
		return "";
	}

	return `
		<div class="notification-modal-overlay">
			<div class="notification-modal-card ${notification.priority}">
				<h3>${escapeHtml(notification.title)}</h3>
				<p>${escapeHtml(notification.message)}</p>
				<p><strong>Priorytet:</strong> ${getPriorityLabel(notification.priority)}</p>
				<div class="notification-actions">
					<button data-notification-open="${notification.id}">Przejdź do powiadomienia</button>
					<button data-notification-close-modal="true">Zamknij</button>
				</div>
			</div>
		</div>
	`;
}

export function renderApp(params: {
	user: User | null;
	users: User[];
	projects: Project[];
	activeProjectId: string | null;
	stories: Story[];
	tasks: Task[];
	assignableUsers: User[];
	notifications: Notification[];
	selectedNotificationId: string | null;
	unreadNotificationsCount: number;
	activeNotification: Notification | null;
	modalNotification: Notification | null;
}): void {
	const app = document.querySelector<HTMLDivElement>("#app");

	if (!app) {
		return;
	}

	if (!params.user) {
		app.innerHTML = renderLoginView();
		return;
	}

	if (params.user.isBlocked) {
		app.innerHTML = renderBlockedView(params.user);
		return;
	}

	if (params.user.role === "guest") {
		app.innerHTML = renderGuestView(params.user);
		return;
	}

	const {
		user,
		users,
		projects,
		activeProjectId,
		stories,
		tasks,
		assignableUsers,
		notifications,
		selectedNotificationId,
		unreadNotificationsCount,
		activeNotification,
		modalNotification,
	} = params;

	app.innerHTML = `
		<header class="topbar card shadow-sm border-0 mb-4">
			<div class="card-body topbar-inner">
				<div>
					<h1 class="mb-2">Project Board</h1>
					<p class="mb-0">
						Zalogowany użytkownik:
						<strong>
							${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}
							(${escapeHtml(user.role)})
						</strong>
					</p>

					<nav class="top-nav">
						<a href="#storiesSection">Historyjki</a>
						<a href="#tasksSection">Zadania</a>
						<a href="#notificationsSection">Powiadomienia</a>
						${user.role === "admin" ? `<a href="#usersSection">Użytkownicy</a>` : ""}
					</nav>
				</div>

				<div class="topbar-actions">
					<a href="#notificationsSection" class="notifications-link">
						Powiadomienia
						<span class="notification-badge">${unreadNotificationsCount}</span>
					</a>

					<div class="project-picker">
						<label for="projectSelect" class="form-label mb-1">Aktywny projekt:</label>
						<select id="projectSelect" class="form-select">
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

					<button type="button" id="themeToggle" class="btn btn-outline-secondary">
						Dark mode
					</button>

					<button type="button" id="logoutButton" class="btn btn-outline-danger">
						Wyloguj
					</button>
				</div>
			</div>
		</header>

		<section class="forms-grid mb-4">
			<section class="story-form-section card shadow-sm border-0">
				<div class="card-body">
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
				</div>
			</section>

			<section class="task-form-section card shadow-sm border-0">
				<div class="card-body">
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
				</div>
			</section>
		</section>

		<section class="board-section" id="storiesSection">
			<h2>Tablica historyjek</h2>
			<main class="board">
				${renderStoryColumn("Czekające", "todo", stories)}
				${renderStoryColumn("W trakcie", "doing", stories)}
				${renderStoryColumn("Zamknięte", "done", stories)}
			</main>
		</section>

		<section class="board-section" id="tasksSection">
			<h2>Tablica zadań</h2>
			<main class="board">
				${renderTaskColumn("Czekające", "todo", tasks, stories, assignableUsers)}
				${renderTaskColumn("W trakcie", "doing", tasks, stories, assignableUsers)}
				${renderTaskColumn("Zamknięte", "done", tasks, stories, assignableUsers)}
			</main>
		</section>

		<section class="board-section" id="notificationsSection">
			<div class="notifications-header">
				<h2>Powiadomienia</h2>
				<button type="button" data-mark-all-notifications-read="true">
					Oznacz wszystkie jako przeczytane
				</button>
			</div>

			<div class="notifications-layout">
				<div>
					${renderNotificationList(notifications, selectedNotificationId)}
				</div>

				<div>
					<h3>Szczegóły powiadomienia</h3>
					${renderNotificationDetails(activeNotification)}
				</div>
			</div>
		</section>

		${renderUsersSection(users, user)}

		${renderNotificationModal(modalNotification)}
	`;
}

import { ApiService } from "./api";
import { initGoogleLogin } from "./auth-service";
import { NotificationService } from "./notification-service";
import { renderApp } from "./render";
import { StoryService } from "./story-service";
import { TaskService } from "./task-service";
import type {
	Notification,
	Story,
	StoryPriority,
	StoryStatus,
	Task,
	TaskPriority,
	UserRole,
} from "./types";

const api = new ApiService();
const storyService = new StoryService(api);
const taskService = new TaskService(api);
const notificationService = new NotificationService();

let selectedNotificationId: string | null = null;
let modalNotificationId: string | null = null;

function maybeShowModal(notification: Notification): void {
	if (notification.priority === "medium" || notification.priority === "high") {
		modalNotificationId = notification.id;
	}
}

function refresh(): void {
	const activeProjectId = api.getActiveProjectId();
	const activeProjectStories = storyService.getStoriesForActiveProject();
	const activeProjectTasks = activeProjectId
		? taskService.getTasksByProjectId(activeProjectId)
		: [];

	const loggedUser = api.getLoggedUser();

	const notifications = loggedUser
		? notificationService.getNotificationsForUser(loggedUser.id)
		: [];

	const activeNotification = selectedNotificationId
		? notificationService.getNotificationById(selectedNotificationId)
		: null;

	const modalNotification = modalNotificationId
		? notificationService.getNotificationById(modalNotificationId)
		: null;

	renderApp({
		user: loggedUser,
		users: api.getUsers(),
		projects: api.getProjects(),
		activeProjectId,
		stories: activeProjectStories,
		tasks: activeProjectTasks,
		assignableUsers: taskService.getAssignableUsers(),
		notifications,
		selectedNotificationId,
		unreadNotificationsCount: loggedUser
			? notificationService.getUnreadCount(loggedUser.id)
			: 0,
		activeNotification,
		modalNotification,
	});

	bindEvents();
}

function resetStoryForm(): void {
	const form = document.querySelector<HTMLFormElement>("#storyForm");
	const editingStoryId =
		document.querySelector<HTMLInputElement>("#editingStoryId");
	const formTitle = document.querySelector<HTMLElement>("#formTitle");
	const submitButton =
		document.querySelector<HTMLButtonElement>("#submitButton");
	const cancelEditButton =
		document.querySelector<HTMLButtonElement>("#cancelEditButton");

	form?.reset();

	if (editingStoryId) {
		editingStoryId.value = "";
	}

	if (formTitle) {
		formTitle.textContent = "Dodaj historyjkę";
	}

	if (submitButton) {
		submitButton.textContent = "Dodaj";
	}

	if (cancelEditButton) {
		cancelEditButton.hidden = true;
	}
}

function fillStoryFormForEdit(story: Story): void {
	const editingStoryId =
		document.querySelector<HTMLInputElement>("#editingStoryId");
	const nameInput = document.querySelector<HTMLInputElement>("#name");
	const descriptionInput =
		document.querySelector<HTMLTextAreaElement>("#description");
	const priorityInput = document.querySelector<HTMLSelectElement>("#priority");
	const statusInput = document.querySelector<HTMLSelectElement>("#status");
	const formTitle = document.querySelector<HTMLElement>("#formTitle");
	const submitButton =
		document.querySelector<HTMLButtonElement>("#submitButton");
	const cancelEditButton =
		document.querySelector<HTMLButtonElement>("#cancelEditButton");

	if (editingStoryId) {
		editingStoryId.value = story.id;
	}

	if (nameInput) {
		nameInput.value = story.name;
	}

	if (descriptionInput) {
		descriptionInput.value = story.description ?? "";
	}

	if (priorityInput) {
		priorityInput.value = story.priority;
	}

	if (statusInput) {
		statusInput.value = story.status;
	}

	if (formTitle) {
		formTitle.textContent = "Edytuj historyjkę";
	}

	if (submitButton) {
		submitButton.textContent = "Zapisz";
	}

	if (cancelEditButton) {
		cancelEditButton.hidden = false;
	}

	document.querySelector("#storyForm")?.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

function resetTaskForm(): void {
	const form = document.querySelector<HTMLFormElement>("#taskForm");
	const editingTaskId =
		document.querySelector<HTMLInputElement>("#editingTaskId");
	const formTitle = document.querySelector<HTMLElement>("#taskFormTitle");
	const submitButton =
		document.querySelector<HTMLButtonElement>("#taskSubmitButton");
	const cancelEditButton = document.querySelector<HTMLButtonElement>(
		"#cancelTaskEditButton",
	);

	form?.reset();

	if (editingTaskId) {
		editingTaskId.value = "";
	}

	if (formTitle) {
		formTitle.textContent = "Dodaj zadanie";
	}

	if (submitButton) {
		submitButton.textContent = "Dodaj zadanie";
	}

	if (cancelEditButton) {
		cancelEditButton.hidden = true;
	}
}

function fillTaskFormForEdit(task: Task): void {
	const editingTaskId =
		document.querySelector<HTMLInputElement>("#editingTaskId");
	const nameInput = document.querySelector<HTMLInputElement>("#taskName");
	const descriptionInput =
		document.querySelector<HTMLTextAreaElement>("#taskDescription");
	const priorityInput =
		document.querySelector<HTMLSelectElement>("#taskPriority");
	const estimatedHoursInput = document.querySelector<HTMLInputElement>(
		"#taskEstimatedHours",
	);
	const storyInput = document.querySelector<HTMLSelectElement>("#taskStoryId");
	const formTitle = document.querySelector<HTMLElement>("#taskFormTitle");
	const submitButton =
		document.querySelector<HTMLButtonElement>("#taskSubmitButton");
	const cancelEditButton = document.querySelector<HTMLButtonElement>(
		"#cancelTaskEditButton",
	);

	if (editingTaskId) {
		editingTaskId.value = task.id;
	}

	if (nameInput) {
		nameInput.value = task.name;
	}

	if (descriptionInput) {
		descriptionInput.value = task.description ?? "";
	}

	if (priorityInput) {
		priorityInput.value = task.priority;
	}

	if (estimatedHoursInput) {
		estimatedHoursInput.value = String(task.estimatedHours);
	}

	if (storyInput) {
		storyInput.value = task.storyId;
	}

	if (formTitle) {
		formTitle.textContent = "Edytuj zadanie";
	}

	if (submitButton) {
		submitButton.textContent = "Zapisz zadanie";
	}

	if (cancelEditButton) {
		cancelEditButton.hidden = false;
	}

	document.querySelector("#taskForm")?.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

function bindEvents(): void {
	initGoogleLogin((profile) => {
		const result = api.loginWithGoogleProfile(profile);

		if (result.isNewUser) {
			notificationService.createNotificationForAdmins(api.getAdmins(), {
				title: "Nowe konto w systemie",
				message: `Użytkownik ${result.user.firstName} ${result.user.lastName} (${result.user.email}) utworzył konto i oczekuje na zatwierdzenie.`,
				priority: "high",
			});
		}

		refresh();
	});

	document
		.querySelector<HTMLButtonElement>("#logoutButton")
		?.addEventListener("click", () => {
			api.logout();
			selectedNotificationId = null;
			modalNotificationId = null;
			refresh();
		});

	document
		.querySelectorAll<HTMLSelectElement>("[data-user-role]")
		.forEach((select) => {
			select.addEventListener("change", () => {
				const userId = select.dataset.userId;
				const role = select.value as UserRole;

				if (!userId) {
					return;
				}

				api.updateUserRole(userId, role);
				refresh();
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>("[data-user-block]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const userId = button.dataset.userId;
				const blocked = button.dataset.blocked === "true";

				if (!userId) {
					return;
				}

				api.setUserBlocked(userId, !blocked);
				refresh();
			});
		});

	const themeToggle = document.querySelector<HTMLButtonElement>("#themeToggle");
	const projectSelect =
		document.querySelector<HTMLSelectElement>("#projectSelect");
	const storyForm = document.querySelector<HTMLFormElement>("#storyForm");
	const cancelEditButton =
		document.querySelector<HTMLButtonElement>("#cancelEditButton");

	const taskForm = document.querySelector<HTMLFormElement>("#taskForm");
	const cancelTaskEditButton = document.querySelector<HTMLButtonElement>(
		"#cancelTaskEditButton",
	);

	themeToggle?.addEventListener("click", () => {
		const currentTheme = document.documentElement.getAttribute("data-bs-theme");
		const nextTheme = currentTheme === "dark" ? "light" : "dark";

		localStorage.setItem(THEME_KEY, nextTheme);
		applyTheme(nextTheme);
	});

	projectSelect?.addEventListener("change", (event) => {
		const target = event.target as HTMLSelectElement;
		api.setActiveProject(target.value);
		refresh();
	});

	storyForm?.addEventListener("submit", (event) => {
		event.preventDefault();

		const loggedUser = api.getLoggedUser();
		if (!loggedUser) {
			return;
		}

		const editingStoryId =
			document.querySelector<HTMLInputElement>("#editingStoryId");
		const nameInput = document.querySelector<HTMLInputElement>("#name");
		const descriptionInput =
			document.querySelector<HTMLTextAreaElement>("#description");
		const priorityInput =
			document.querySelector<HTMLSelectElement>("#priority");
		const statusInput = document.querySelector<HTMLSelectElement>("#status");

		if (
			!editingStoryId ||
			!nameInput ||
			!descriptionInput ||
			!priorityInput ||
			!statusInput
		) {
			return;
		}

		const name = nameInput.value.trim();
		const description = descriptionInput.value.trim();

		if (!name) {
			return;
		}

		if (editingStoryId.value) {
			const existingStory = api.getStoryById(editingStoryId.value);

			if (!existingStory) {
				return;
			}

			const updatedStory: Story = {
				...existingStory,
				name,
				description,
				priority: priorityInput.value as StoryPriority,
				status: statusInput.value as StoryStatus,
			};

			storyService.updateStory(updatedStory);
			refresh();
			resetStoryForm();
			return;
		}

		storyService.createStory({
			name,
			description,
			priority: priorityInput.value as StoryPriority,
			status: statusInput.value as StoryStatus,
			ownerId: loggedUser.id,
		});

		refresh();
		resetStoryForm();
	});

	taskForm?.addEventListener("submit", (event) => {
		event.preventDefault();

		const editingTaskId =
			document.querySelector<HTMLInputElement>("#editingTaskId");
		const nameInput = document.querySelector<HTMLInputElement>("#taskName");
		const descriptionInput =
			document.querySelector<HTMLTextAreaElement>("#taskDescription");
		const priorityInput =
			document.querySelector<HTMLSelectElement>("#taskPriority");
		const estimatedHoursInput = document.querySelector<HTMLInputElement>(
			"#taskEstimatedHours",
		);
		const storyInput =
			document.querySelector<HTMLSelectElement>("#taskStoryId");

		if (
			!editingTaskId ||
			!nameInput ||
			!descriptionInput ||
			!priorityInput ||
			!estimatedHoursInput ||
			!storyInput
		) {
			return;
		}

		const name = nameInput.value.trim();
		const description = descriptionInput.value.trim();
		const estimatedHours = Number(estimatedHoursInput.value);

		if (!name || !storyInput.value || Number.isNaN(estimatedHours)) {
			return;
		}

		if (editingTaskId.value) {
			taskService.updateTask(editingTaskId.value, {
				name,
				description,
				priority: priorityInput.value as TaskPriority,
				estimatedHours,
			});

			refresh();
			resetTaskForm();
			return;
		}

		const newTask = taskService.createTask({
			name,
			description,
			priority: priorityInput.value as TaskPriority,
			storyId: storyInput.value,
			estimatedHours,
		});

		const story = api.getStoryById(newTask.storyId);
		if (story) {
			const notification = notificationService.createNotification({
				title: "Nowe zadanie w historyjce",
				message: `Do historyjki "${story.name}" dodano zadanie "${newTask.name}".`,
				priority: "medium",
				recipientId: story.ownerId,
			});

			const loggedUser = api.getLoggedUser();
			if (loggedUser?.id === story.ownerId) {
				maybeShowModal(notification);
			}
		}

		refresh();
		resetTaskForm();
	});

	cancelEditButton?.addEventListener("click", () => {
		resetStoryForm();
	});

	cancelTaskEditButton?.addEventListener("click", () => {
		resetTaskForm();
	});

	document
		.querySelectorAll<HTMLButtonElement>("[data-action]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const action = button.dataset.action;
				const storyId = button.dataset.id;

				if (!storyId || !action) {
					return;
				}

				if (action === "delete") {
					storyService.deleteStory(storyId);
					refresh();
					resetStoryForm();
					return;
				}

				if (action === "move-todo") {
					storyService.moveStory(storyId, "todo");
					refresh();
					return;
				}

				if (action === "move-doing") {
					storyService.moveStory(storyId, "doing");
					refresh();
					return;
				}

				if (action === "move-done") {
					storyService.moveStory(storyId, "done");
					refresh();
					return;
				}

				if (action === "edit") {
					const story = api.getStoryById(storyId);

					if (!story) {
						return;
					}

					fillStoryFormForEdit(story);
				}
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>("[data-task-action]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const action = button.dataset.taskAction;
				const taskId = button.dataset.taskId;

				if (!taskId || !action) {
					return;
				}

				if (action === "delete") {
					const task = taskService.getTaskById(taskId);

					if (task) {
						const story = api.getStoryById(task.storyId);

						if (story) {
							const notification = notificationService.createNotification({
								title: "Usunięto zadanie z historyjki",
								message: `Z historyjki "${story.name}" usunięto zadanie "${task.name}".`,
								priority: "medium",
								recipientId: story.ownerId,
							});

							const loggedUser = api.getLoggedUser();
							if (loggedUser?.id === story.ownerId) {
								maybeShowModal(notification);
							}
						}
					}

					taskService.deleteTask(taskId);
					refresh();
					resetTaskForm();
					return;
				}

				if (action === "edit") {
					const task = taskService.getTaskById(taskId);

					if (!task) {
						return;
					}

					fillTaskFormForEdit(task);
					return;
				}

				if (action === "done") {
					const task = taskService.getTaskById(taskId);
					taskService.markTaskAsDone(taskId);

					if (task) {
						const story = api.getStoryById(task.storyId);

						if (story) {
							const notification = notificationService.createNotification({
								title: "Zmiana statusu zadania w historyjce",
								message: `Zadanie "${task.name}" w historyjce "${story.name}" zmieniło status na "done".`,
								priority: "medium",
								recipientId: story.ownerId,
							});

							const loggedUser = api.getLoggedUser();
							if (loggedUser?.id === story.ownerId) {
								maybeShowModal(notification);
							}
						}
					}

					refresh();
					return;
				}

				if (action === "todo") {
					const task = taskService.getTaskById(taskId);
					taskService.moveTaskToTodo(taskId);

					if (task) {
						const story = api.getStoryById(task.storyId);

						if (story) {
							notificationService.createNotification({
								title: "Zmiana statusu zadania w historyjce",
								message: `Zadanie "${task.name}" w historyjce "${story.name}" wróciło do statusu "todo".`,
								priority: "low",
								recipientId: story.ownerId,
							});
						}
					}

					refresh();
				}
			});
		});

	document
		.querySelectorAll<HTMLSelectElement>("[data-assign-task]")
		.forEach((select) => {
			select.addEventListener("change", () => {
				const taskId = select.dataset.taskId;
				const userId = select.value;

				if (!taskId || !userId) {
					return;
				}

				const task = taskService.getTaskById(taskId);
				taskService.assignUserToTask(taskId, userId);

				const updatedTask = taskService.getTaskById(taskId);
				const assignedUser = api.getUsers().find((user) => user.id === userId);

				if (task && updatedTask && assignedUser) {
					const story = api.getStoryById(task.storyId);

					const assignmentNotification = notificationService.createNotification(
						{
							title: "Przypisanie do zadania",
							message: `Zostałeś przypisany do zadania "${updatedTask.name}".`,
							priority: "high",
							recipientId: assignedUser.id,
						},
					);

					const loggedUser = api.getLoggedUser();
					if (loggedUser?.id === assignedUser.id) {
						maybeShowModal(assignmentNotification);
					}

					if (story) {
						notificationService.createNotification({
							title: "Zmiana statusu zadania w historyjce",
							message: `Zadanie "${updatedTask.name}" w historyjce "${story.name}" zmieniło status na "doing".`,
							priority: "low",
							recipientId: story.ownerId,
						});
					}
				}

				refresh();
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>("[data-notification-open]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const notificationId = button.dataset.notificationOpen;

				if (!notificationId) {
					return;
				}

				selectedNotificationId = notificationId;
				notificationService.markAsRead(notificationId);
				modalNotificationId = null;
				refresh();

				document
					.querySelector("#notificationsSection")
					?.scrollIntoView({ behavior: "smooth", block: "start" });
			});
		});

	document
		.querySelectorAll<HTMLButtonElement>("[data-notification-read]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const notificationId = button.dataset.notificationRead;

				if (!notificationId) {
					return;
				}

				notificationService.markAsRead(notificationId);
				refresh();
			});
		});

	document
		.querySelector<HTMLButtonElement>("[data-mark-all-notifications-read]")
		?.addEventListener("click", () => {
			const loggedUser = api.getLoggedUser();

			if (!loggedUser) {
				return;
			}

			notificationService.markAllAsReadForUser(loggedUser.id);
			refresh();
		});

	document
		.querySelector<HTMLButtonElement>("[data-notification-clear-details]")
		?.addEventListener("click", () => {
			selectedNotificationId = null;
			refresh();
		});

	document
		.querySelector<HTMLButtonElement>("[data-notification-close-modal]")
		?.addEventListener("click", () => {
			modalNotificationId = null;
			refresh();
		});
}

const THEME_KEY = "app-theme";

function getPreferredTheme(): "light" | "dark" {
	const savedTheme = localStorage.getItem(THEME_KEY);

	if (savedTheme === "light" || savedTheme === "dark") {
		return savedTheme;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: "light" | "dark"): void {
	document.documentElement.setAttribute("data-bs-theme", theme);

	const button = document.querySelector<HTMLButtonElement>("#themeToggle");

	if (!button) {
		return;
	}

	button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

function initTheme(): void {
	applyTheme(getPreferredTheme());
}

async function initApp(): Promise<void> {
	await api.init();

	api.seed();
	notificationService.seed(api.getUsers());

	initTheme();
	refresh();
}

void initApp();

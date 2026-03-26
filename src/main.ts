import { ApiService } from "./api";
import { renderApp } from "./render";
import { StoryService } from "./story-service";
import { TaskService } from "./task-service";
import { UserSession } from "./user-session";
import type {
	Story,
	StoryPriority,
	StoryStatus,
	Task,
	TaskPriority,
} from "./types";

const api = new ApiService();
const userSession = new UserSession(api);
const storyService = new StoryService(api);
const taskService = new TaskService(api);

api.seed();

function refresh(): void {
	const activeProjectId = api.getActiveProjectId();
	const activeProjectStories = storyService.getStoriesForActiveProject();
	const activeProjectTasks = activeProjectId
		? taskService.getTasksByProjectId(activeProjectId)
		: [];

	renderApp({
		user: userSession.getLoggedUser(),
		projects: api.getProjects(),
		activeProjectId,
		stories: activeProjectStories,
		tasks: activeProjectTasks,
		assignableUsers: taskService.getAssignableUsers(),
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
	const projectSelect =
		document.querySelector<HTMLSelectElement>("#projectSelect");
	const storyForm = document.querySelector<HTMLFormElement>("#storyForm");
	const cancelEditButton =
		document.querySelector<HTMLButtonElement>("#cancelEditButton");

	const taskForm = document.querySelector<HTMLFormElement>("#taskForm");
	const cancelTaskEditButton = document.querySelector<HTMLButtonElement>(
		"#cancelTaskEditButton",
	);

	projectSelect?.addEventListener("change", (event) => {
		const target = event.target as HTMLSelectElement;
		api.setActiveProject(target.value);
		refresh();
	});

	storyForm?.addEventListener("submit", (event) => {
		event.preventDefault();

		const loggedUser = userSession.getLoggedUser();
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

		taskService.createTask({
			name,
			description,
			priority: priorityInput.value as TaskPriority,
			storyId: storyInput.value,
			estimatedHours,
		});

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
					taskService.markTaskAsDone(taskId);
					refresh();
					return;
				}

				if (action === "todo") {
					taskService.moveTaskToTodo(taskId);
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

				taskService.assignUserToTask(taskId, userId);
				refresh();
			});
		});
}

refresh();

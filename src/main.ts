import { ApiService } from "./api";
import { renderApp } from "./render";
import { StoryService } from "./story-service";
import { UserSession } from "./user-session";
import type { Story, StoryPriority, StoryStatus } from "./types";

const api = new ApiService();
const userSession = new UserSession(api);
const storyService = new StoryService(api);

api.seed();

function refresh(): void {
	renderApp({
		user: userSession.getLoggedUser(),
		projects: api.getProjects(),
		activeProjectId: api.getActiveProjectId(),
		stories: storyService.getStoriesForActiveProject(),
	});

	bindEvents();
}

function resetForm(): void {
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

function fillFormForEdit(story: Story): void {
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
}

function bindEvents(): void {
	const projectSelect =
		document.querySelector<HTMLSelectElement>("#projectSelect");
	const storyForm = document.querySelector<HTMLFormElement>("#storyForm");
	const cancelEditButton =
		document.querySelector<HTMLButtonElement>("#cancelEditButton");

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
			resetForm();
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
		resetForm();
	});

	cancelEditButton?.addEventListener("click", () => {
		resetForm();
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
					resetForm();
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

					fillFormForEdit(story);
				}
			});
		});
}

refresh();

import { ApiService } from "./api";
import type { Story, StoryPriority, StoryStatus } from "./types";

export class StoryService {
	private api: ApiService;

	constructor(api: ApiService) {
		this.api = api;
	}

	getStoriesForActiveProject(): Story[] {
		const activeProject = this.api.getActiveProject();

		if (!activeProject) {
			return [];
		}

		return this.api.getStoriesByProject(activeProject.id);
	}

	createStory(data: {
		name: string;
		description: string;
		priority: StoryPriority;
		status: StoryStatus;
		ownerId: string;
	}): void {
		const activeProject = this.api.getActiveProject();

		if (!activeProject) {
			throw new Error("Brak aktywnego projektu");
		}

		this.api.createStory({
			name: data.name,
			description: data.description,
			priority: data.priority,
			status: data.status,
			ownerId: data.ownerId,
			projectId: activeProject.id,
		});
	}

	updateStory(story: Story): void {
		this.api.updateStory(story);
	}

	deleteStory(storyId: string): void {
		this.api.deleteStory(storyId);
	}

	moveStory(storyId: string, newStatus: StoryStatus): void {
		const story = this.api.getStoryById(storyId);

		if (!story) {
			return;
		}

		this.api.updateStory({
			...story,
			status: newStatus,
		});
	}
}

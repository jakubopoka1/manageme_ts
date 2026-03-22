export type StoryStatus = "todo" | "doing" | "done";
export type StoryPriority = "low" | "medium" | "high";

export interface Story {
	id: string;
	name: string;
	description?: string;
	status: StoryStatus;
	createdAt: string;
	priority: StoryPriority;
	projectId: string;
	ownerId: string;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
}

export interface Project {
	id: string;
	name: string;
}

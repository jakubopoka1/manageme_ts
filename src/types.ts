export type StoryStatus = "todo" | "doing" | "done";
export type TaskStatus = "todo" | "doing" | "done";

export type StoryPriority = "low" | "medium" | "high";
export type TaskPriority = "low" | "medium" | "high";

export type UserRole = "admin" | "devops" | "developer";

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

export interface Task {
	id: string;
	name: string;
	description?: string;
	priority: TaskPriority;
	storyId: string;
	estimatedHours: number;
	status: TaskStatus;
	createdAt: string;
	startedAt: string | null;
	completedAt: string | null;
	assigneeId: string | null;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	role: UserRole;
}

export interface Project {
	id: string;
	name: string;
}

export type ISOString = string;
export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
	id: string;
	title: string;
	message: string;
	date: ISOString;
	priority: NotificationPriority;
	isRead: boolean;
	recipientId: string;
}

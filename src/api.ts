import { SUPER_ADMIN_EMAIL, STORAGE_PROVIDER } from "./config";
import { supabase } from "./supabase-client";
import type { GoogleProfile } from "./auth-service";
import type { Project, Story, Task, User, UserRole } from "./types";

type Database = {
	users: User[];
	projects: Project[];
	stories: Story[];
	tasks: Task[];
	activeProjectId: string | null;
	loggedUserId: string | null;
};

const STORAGE_KEY = "kanban_app_db";

const initialDb: Database = {
	users: [],
	projects: [],
	stories: [],
	tasks: [],
	activeProjectId: null,
	loggedUserId: null,
};

export class ApiService {
	private db: Database = initialDb;

	async init(): Promise<void> {
		if (STORAGE_PROVIDER === "localStorage") {
			this.db = this.readFromLocalStorage();
			return;
		}

		const { data, error } = await supabase
			.from("app_storage")
			.select("data")
			.eq("key", STORAGE_KEY)
			.maybeSingle();

		if (error) {
			console.error("Supabase read error:", error);
			this.db = initialDb;
			return;
		}

		if (!data) {
			this.db = initialDb;
			await this.save();
			return;
		}

		this.db = this.normalizeDb(data.data as Partial<Database>);
	}

	private normalizeDb(parsed: Partial<Database>): Database {
		return {
			users: (parsed.users ?? []).map((user) => ({
				...user,
				email: user.email ?? "",
				role: user.role ?? "guest",
				isBlocked: user.isBlocked ?? false,
				createdAt: user.createdAt ?? new Date().toISOString(),
			})),
			projects: parsed.projects ?? [],
			stories: parsed.stories ?? [],
			tasks: parsed.tasks ?? [],
			activeProjectId: parsed.activeProjectId ?? null,
			loggedUserId: parsed.loggedUserId ?? null,
		};
	}

	private readFromLocalStorage(): Database {
		const raw = localStorage.getItem(STORAGE_KEY);

		if (!raw) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
			return initialDb;
		}

		return this.normalizeDb(JSON.parse(raw) as Partial<Database>);
	}

	private async save(): Promise<void> {
		if (STORAGE_PROVIDER === "localStorage") {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
			return;
		}

		const { error } = await supabase.from("app_storage").upsert({
			key: STORAGE_KEY,
			data: this.db,
		});

		if (error) {
			console.error("Supabase save error:", error);
		}
	}

	seed(): void {
		if (this.db.projects.length > 0) {
			return;
		}

		const project: Project = {
			id: crypto.randomUUID(),
			name: "ManageMe",
		};

		this.db.projects = [project];
		this.db.activeProjectId = project.id;

		void this.save();
	}

	getLoggedUser(): User | null {
		return (
			this.db.users.find((user) => user.id === this.db.loggedUserId) ?? null
		);
	}

	getUsers(): User[] {
		return this.db.users;
	}

	getAssignableUsers(): User[] {
		return this.db.users.filter(
			(user) =>
				!user.isBlocked &&
				(user.role === "developer" || user.role === "devops"),
		);
	}

	loginWithGoogleProfile(profile: GoogleProfile): {
		user: User;
		isNewUser: boolean;
	} {
		const existingUser = this.db.users.find(
			(user) => user.email === profile.email,
		);

		if (existingUser) {
			this.db.loggedUserId = existingUser.id;
			void this.save();

			return {
				user: existingUser,
				isNewUser: false,
			};
		}

		const isSuperAdmin =
			profile.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

		const newUser: User = {
			id: crypto.randomUUID(),
			firstName: profile.firstName || profile.email.split("@")[0],
			lastName: profile.lastName || "",
			email: profile.email,
			avatarUrl: profile.avatarUrl,
			role: isSuperAdmin ? "admin" : "guest",
			isBlocked: false,
			createdAt: new Date().toISOString(),
		};

		this.db.users.push(newUser);
		this.db.loggedUserId = newUser.id;

		void this.save();

		return {
			user: newUser,
			isNewUser: true,
		};
	}

	logout(): void {
		this.db.loggedUserId = null;
		void this.save();
	}

	updateUserRole(userId: string, role: UserRole): void {
		this.db.users = this.db.users.map((user) =>
			user.id === userId
				? {
						...user,
						role,
					}
				: user,
		);

		void this.save();
	}

	setUserBlocked(userId: string, isBlocked: boolean): void {
		this.db.users = this.db.users.map((user) =>
			user.id === userId
				? {
						...user,
						isBlocked,
					}
				: user,
		);

		void this.save();
	}

	getAdmins(): User[] {
		return this.db.users.filter(
			(user) => user.role === "admin" && !user.isBlocked,
		);
	}

	getProjects(): Project[] {
		return this.db.projects;
	}

	getActiveProjectId(): string | null {
		return this.db.activeProjectId;
	}

	setActiveProject(projectId: string): void {
		this.db.activeProjectId = projectId;
		void this.save();
	}

	getActiveProject(): Project | null {
		return (
			this.db.projects.find(
				(project) => project.id === this.db.activeProjectId,
			) ?? null
		);
	}

	getStoriesByProject(projectId: string): Story[] {
		return this.db.stories.filter((story) => story.projectId === projectId);
	}

	getStoryById(storyId: string): Story | null {
		return this.db.stories.find((story) => story.id === storyId) ?? null;
	}

	createStory(story: Omit<Story, "id" | "createdAt">): Story {
		const newStory: Story = {
			...story,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};

		this.db.stories.push(newStory);
		void this.save();

		return newStory;
	}

	updateStory(updatedStory: Story): void {
		this.db.stories = this.db.stories.map((story) =>
			story.id === updatedStory.id ? updatedStory : story,
		);

		void this.save();
	}

	deleteStory(storyId: string): void {
		this.db.stories = this.db.stories.filter((story) => story.id !== storyId);
		this.db.tasks = this.db.tasks.filter((task) => task.storyId !== storyId);
		void this.save();
	}

	getTasks(): Task[] {
		return this.db.tasks;
	}

	getTaskById(taskId: string): Task | null {
		return this.db.tasks.find((task) => task.id === taskId) ?? null;
	}

	getTasksByStoryId(storyId: string): Task[] {
		return this.db.tasks.filter((task) => task.storyId === storyId);
	}

	getTasksByProjectId(projectId: string): Task[] {
		const storyIds = this.db.stories
			.filter((story) => story.projectId === projectId)
			.map((story) => story.id);

		return this.db.tasks.filter((task) => storyIds.includes(task.storyId));
	}

	createTask(task: Omit<Task, "id" | "createdAt">): Task {
		const newTask: Task = {
			...task,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};

		this.db.tasks.push(newTask);
		void this.save();

		return newTask;
	}

	updateTask(updatedTask: Task): void {
		this.db.tasks = this.db.tasks.map((task) =>
			task.id === updatedTask.id ? updatedTask : task,
		);

		void this.save();
	}

	deleteTask(taskId: string): void {
		this.db.tasks = this.db.tasks.filter((task) => task.id !== taskId);
		void this.save();
	}
}

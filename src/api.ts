import { SUPER_ADMIN_EMAIL } from "./config";
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

export class ApiService {
	private readDb(): Database {
		const raw = localStorage.getItem(STORAGE_KEY);

		const initialDb: Database = {
			users: [],
			projects: [],
			stories: [],
			tasks: [],
			activeProjectId: null,
			loggedUserId: null,
		};

		if (!raw) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
			return initialDb;
		}

		const parsed = JSON.parse(raw) as Partial<Database>;

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

	private writeDb(db: Database): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
	}

	seed(): void {
		const db = this.readDb();

		if (db.projects.length > 0) {
			return;
		}

		const project1: Project = {
			id: crypto.randomUUID(),
			name: "Projekt Rekrutacja",
		};

		const project2: Project = {
			id: crypto.randomUUID(),
			name: "Projekt Sklep",
		};

		db.projects = [project1, project2];
		db.activeProjectId = project1.id;

		this.writeDb(db);
	}

	getLoggedUser(): User | null {
		const db = this.readDb();
		return db.users.find((u) => u.id === db.loggedUserId) ?? null;
	}

	getUsers(): User[] {
		return this.readDb().users;
	}

	getAssignableUsers(): User[] {
		return this.readDb().users.filter(
			(user) =>
				!user.isBlocked &&
				(user.role === "developer" || user.role === "devops"),
		);
	}

	loginWithGoogleProfile(profile: GoogleProfile): {
		user: User;
		isNewUser: boolean;
	} {
		const db = this.readDb();

		const existingUser = db.users.find((user) => user.email === profile.email);

		if (existingUser) {
			db.loggedUserId = existingUser.id;
			this.writeDb(db);

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

		db.users.push(newUser);
		db.loggedUserId = newUser.id;

		this.writeDb(db);

		return {
			user: newUser,
			isNewUser: true,
		};
	}

	logout(): void {
		const db = this.readDb();
		db.loggedUserId = null;
		this.writeDb(db);
	}

	updateUserRole(userId: string, role: UserRole): void {
		const db = this.readDb();

		db.users = db.users.map((user) =>
			user.id === userId
				? {
						...user,
						role,
					}
				: user,
		);

		this.writeDb(db);
	}

	setUserBlocked(userId: string, isBlocked: boolean): void {
		const db = this.readDb();

		db.users = db.users.map((user) =>
			user.id === userId
				? {
						...user,
						isBlocked,
					}
				: user,
		);

		this.writeDb(db);
	}

	getAdmins(): User[] {
		return this.readDb().users.filter(
			(user) => user.role === "admin" && !user.isBlocked,
		);
	}

	getProjects(): Project[] {
		return this.readDb().projects;
	}

	getActiveProjectId(): string | null {
		return this.readDb().activeProjectId;
	}

	setActiveProject(projectId: string): void {
		const db = this.readDb();
		db.activeProjectId = projectId;
		this.writeDb(db);
	}

	getActiveProject(): Project | null {
		const db = this.readDb();
		return db.projects.find((p) => p.id === db.activeProjectId) ?? null;
	}

	getStoriesByProject(projectId: string): Story[] {
		const db = this.readDb();
		return db.stories.filter((story) => story.projectId === projectId);
	}

	getStoryById(storyId: string): Story | null {
		const db = this.readDb();
		return db.stories.find((story) => story.id === storyId) ?? null;
	}

	createStory(story: Omit<Story, "id" | "createdAt">): Story {
		const db = this.readDb();

		const newStory: Story = {
			...story,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};

		db.stories.push(newStory);
		this.writeDb(db);

		return newStory;
	}

	updateStory(updatedStory: Story): void {
		const db = this.readDb();

		db.stories = db.stories.map((story) =>
			story.id === updatedStory.id ? updatedStory : story,
		);

		this.writeDb(db);
	}

	deleteStory(storyId: string): void {
		const db = this.readDb();
		db.stories = db.stories.filter((story) => story.id !== storyId);
		db.tasks = db.tasks.filter((task) => task.storyId !== storyId);
		this.writeDb(db);
	}

	getTasks(): Task[] {
		return this.readDb().tasks;
	}

	getTaskById(taskId: string): Task | null {
		const db = this.readDb();
		return db.tasks.find((task) => task.id === taskId) ?? null;
	}

	getTasksByStoryId(storyId: string): Task[] {
		const db = this.readDb();
		return db.tasks.filter((task) => task.storyId === storyId);
	}

	getTasksByProjectId(projectId: string): Task[] {
		const db = this.readDb();

		const storyIds = db.stories
			.filter((story) => story.projectId === projectId)
			.map((story) => story.id);

		return db.tasks.filter((task) => storyIds.includes(task.storyId));
	}

	createTask(task: Omit<Task, "id" | "createdAt">): Task {
		const db = this.readDb();

		const newTask: Task = {
			...task,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};

		db.tasks.push(newTask);
		this.writeDb(db);

		return newTask;
	}

	updateTask(updatedTask: Task): void {
		const db = this.readDb();

		db.tasks = db.tasks.map((task) =>
			task.id === updatedTask.id ? updatedTask : task,
		);

		this.writeDb(db);
	}

	deleteTask(taskId: string): void {
		const db = this.readDb();
		db.tasks = db.tasks.filter((task) => task.id !== taskId);
		this.writeDb(db);
	}
}

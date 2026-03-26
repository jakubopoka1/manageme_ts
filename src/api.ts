import type { Project, Story, Task, User } from "./types";

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
			users: parsed.users ?? [],
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

		if (db.users.length > 0) {
			return;
		}

		const adminUser: User = {
			id: crypto.randomUUID(),
			firstName: "Johnny",
			lastName: "Bravo",
			role: "admin",
		};

		const developerUser: User = {
			id: crypto.randomUUID(),
			firstName: "Luke",
			lastName: "Skywalker",
			role: "developer",
		};

		const devopsUser: User = {
			id: crypto.randomUUID(),
			firstName: "Travis",
			lastName: "Scott",
			role: "devops",
		};

		const project1: Project = {
			id: crypto.randomUUID(),
			name: "Projekt Rekrutacja",
		};

		const project2: Project = {
			id: crypto.randomUUID(),
			name: "Projekt Sklep",
		};

		const story1: Story = {
			id: crypto.randomUUID(),
			name: "Dodanie logowania",
			description: "Użytkownik może zalogować się do systemu",
			priority: "high",
			projectId: project1.id,
			createdAt: new Date().toISOString(),
			status: "todo",
			ownerId: adminUser.id,
		};

		const story2: Story = {
			id: crypto.randomUUID(),
			name: "Widok dashboardu",
			description: "Po zalogowaniu użytkownik widzi dashboard",
			priority: "medium",
			projectId: project1.id,
			createdAt: new Date().toISOString(),
			status: "doing",
			ownerId: adminUser.id,
		};

		const story3: Story = {
			id: crypto.randomUUID(),
			name: "Koszyk zakupowy",
			description: "Użytkownik może dodać produkt do koszyka",
			priority: "high",
			projectId: project2.id,
			createdAt: new Date().toISOString(),
			status: "done",
			ownerId: adminUser.id,
		};

		const task1: Task = {
			id: crypto.randomUUID(),
			name: "Przygotowanie formularza logowania",
			description: "Frontend formularza logowania",
			priority: "high",
			storyId: story1.id,
			estimatedHours: 8,
			status: "todo",
			createdAt: new Date().toISOString(),
			startedAt: null,
			completedAt: null,
			assigneeId: null,
		};

		const task2: Task = {
			id: crypto.randomUUID(),
			name: "Konfiguracja pipeline CI",
			description: "Przygotowanie pipeline dla projektu",
			priority: "medium",
			storyId: story2.id,
			estimatedHours: 6,
			status: "doing",
			createdAt: new Date().toISOString(),
			startedAt: new Date().toISOString(),
			completedAt: null,
			assigneeId: devopsUser.id,
		};

		const task3: Task = {
			id: crypto.randomUUID(),
			name: "Test koszyka zakupowego",
			description: "Sprawdzenie poprawności dodawania produktów",
			priority: "medium",
			storyId: story3.id,
			estimatedHours: 5,
			status: "done",
			createdAt: new Date().toISOString(),
			startedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
			assigneeId: developerUser.id,
		};

		const newDb: Database = {
			users: [adminUser, developerUser, devopsUser],
			projects: [project1, project2],
			stories: [story1, story2, story3],
			tasks: [task1, task2, task3],
			activeProjectId: project1.id,
			loggedUserId: adminUser.id,
		};

		this.writeDb(newDb);
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
			(user) => user.role === "developer" || user.role === "devops",
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

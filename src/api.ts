import type { Project, Story, User } from "./types";

type Database = {
	users: User[];
	projects: Project[];
	stories: Story[];
	activeProjectId: string | null;
	loggedUserId: string | null;
};

const STORAGE_KEY = "kanban_app_db";

export class ApiService {
	private readDb(): Database {
		const raw = localStorage.getItem(STORAGE_KEY);

		if (!raw) {
			const initialDb: Database = {
				users: [],
				projects: [],
				stories: [],
				activeProjectId: null,
				loggedUserId: null,
			};

			localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
			return initialDb;
		}

		return JSON.parse(raw) as Database;
	}

	private writeDb(db: Database): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
	}

	seed(): void {
		const db = this.readDb();

		if (db.users.length > 0) {
			return;
		}

		const mockUser: User = {
			id: crypto.randomUUID(),
			firstName: "Jan",
			lastName: "Kowalski",
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
			ownerId: mockUser.id,
		};

		const story2: Story = {
			id: crypto.randomUUID(),
			name: "Widok dashboardu",
			description: "Po zalogowaniu użytkownik widzi dashboard",
			priority: "medium",
			projectId: project1.id,
			createdAt: new Date().toISOString(),
			status: "doing",
			ownerId: mockUser.id,
		};

		const story3: Story = {
			id: crypto.randomUUID(),
			name: "Koszyk zakupowy",
			description: "Użytkownik może dodać produkt do koszyka",
			priority: "high",
			projectId: project2.id,
			createdAt: new Date().toISOString(),
			status: "done",
			ownerId: mockUser.id,
		};

		const newDb: Database = {
			users: [mockUser],
			projects: [project1, project2],
			stories: [story1, story2, story3],
			activeProjectId: project1.id,
			loggedUserId: mockUser.id,
		};

		this.writeDb(newDb);
	}

	getLoggedUser(): User | null {
		const db = this.readDb();
		return db.users.find((u) => u.id === db.loggedUserId) ?? null;
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
		this.writeDb(db);
	}

	getStoryById(storyId: string): Story | null {
		const db = this.readDb();
		return db.stories.find((story) => story.id === storyId) ?? null;
	}
}

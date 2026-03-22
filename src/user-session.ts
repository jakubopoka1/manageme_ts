import { ApiService } from "./api";
import type { User } from "./types";

export class UserSession {
	private api: ApiService;

	constructor(api: ApiService) {
		this.api = api;
	}

	getLoggedUser(): User | null {
		return this.api.getLoggedUser();
	}

	getLoggedUserFullName(): string {
		const user = this.getLoggedUser();

		if (!user) {
			return "Brak zalogowanego użytkownika";
		}

		return `${user.firstName} ${user.lastName}`;
	}
}

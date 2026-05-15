const closeNotificationIfVisible = () => {
	cy.get("body").then(($body) => {
		const closeButtons = $body.find("button").filter((_, button) => {
			return button.textContent?.trim() === "Zamknij";
		});

		if (closeButtons.length > 0) {
			cy.wrap(closeButtons.first()).click({ force: true });
		}
	});
};

describe("ManageMe - testy E2E CRUD", () => {
	beforeEach(() => {
		cy.clearLocalStorage();
		cy.visit("/");
	});

	it("tworzy projekt, historyjkę i zadanie", () => {
		cy.get("#projectName").type("Projekt E2E");
		cy.get("#addProjectButton").click();

		cy.get("#projectSelect").should("contain", "Projekt E2E");
		cy.get("#projectSelect").select("Projekt E2E");

		cy.get("#name").type("Historyjka E2E");
		cy.get("#description").type("Opis historyjki E2E");
		cy.get("#priority").select("high");
		cy.get("#status").select("todo");
		cy.get("#submitButton").click();

		cy.contains(".story-card", "Historyjka E2E").should("be.visible");

		cy.get("#taskName").type("Zadanie E2E");
		cy.get("#taskDescription").type("Opis zadania E2E");
		cy.get("#taskPriority").select("medium");
		cy.get("#taskStoryId").select("Historyjka E2E");
		cy.get("#taskEstimatedHours").type("5");
		cy.get("#taskSubmitButton").click();

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie E2E").should("be.visible");
	});

	it("edytuje projekt, historyjkę i zadanie", () => {
		cy.get("#projectName").type("Projekt E2E");
		cy.get("#addProjectButton").click();

		cy.get("#projectSelect").select("Projekt E2E");

		cy.get("#projectName").type("Projekt Edytowany");
		cy.get("#editProjectButton").click();

		cy.get("#projectSelect").should("contain", "Projekt Edytowany");
		cy.get("#projectSelect").select("Projekt Edytowany");

		cy.get("#name").type("Historyjka E2E");
		cy.get("#description").type("Opis");
		cy.get("#submitButton").click();

		cy.get("#taskName").type("Zadanie E2E");
		cy.get("#taskDescription").type("Opis");
		cy.get("#taskStoryId").select("Historyjka E2E");
		cy.get("#taskEstimatedHours").type("3");
		cy.get("#taskSubmitButton").click();

		closeNotificationIfVisible();

		cy.contains(".story-card", "Historyjka E2E")
			.find('[data-action="edit"]')
			.click({ force: true });

		cy.get("#name").clear().type("Historyjka Edytowana");
		cy.get("#submitButton").click();

		cy.contains(".story-card", "Historyjka Edytowana").should("be.visible");

		cy.contains(".task-card", "Zadanie E2E")
			.find('[data-task-action="edit"]')
			.click({ force: true });

		cy.get("#taskName").clear().type("Zadanie Edytowane");
		cy.get("#taskSubmitButton").click();

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie Edytowane").should("be.visible");
	});

	it("zmienia status zadania", () => {
		cy.get("#projectName").type("Projekt E2E");
		cy.get("#addProjectButton").click();
		cy.get("#projectSelect").select("Projekt E2E");

		cy.get("#name").type("Historyjka E2E");
		cy.get("#description").type("Opis");
		cy.get("#submitButton").click();

		cy.get("#taskName").type("Zadanie E2E");
		cy.get("#taskDescription").type("Opis");
		cy.get("#taskStoryId").select("Historyjka E2E");
		cy.get("#taskEstimatedHours").type("2");
		cy.get("#taskSubmitButton").click();

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie E2E")
			.find('[data-task-action="done"]')
			.click({ force: true });

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie E2E").should(($card) => {
			expect($card.text().toLowerCase()).to.include("done");
		});
	});

	it("usuwa zadanie, historyjkę i projekt", () => {
		cy.get("#projectName").type("Projekt E2E");
		cy.get("#addProjectButton").click();
		cy.get("#projectSelect").select("Projekt E2E");

		cy.get("#name").type("Historyjka E2E");
		cy.get("#description").type("Opis");
		cy.get("#submitButton").click();

		cy.get("#taskName").type("Zadanie E2E");
		cy.get("#taskDescription").type("Opis");
		cy.get("#taskStoryId").select("Historyjka E2E");
		cy.get("#taskEstimatedHours").type("4");
		cy.get("#taskSubmitButton").click();

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie E2E")
			.find('[data-task-action="delete"]')
			.click({ force: true });

		closeNotificationIfVisible();

		cy.contains(".task-card", "Zadanie E2E").should("not.exist");

		cy.contains(".story-card", "Historyjka E2E")
			.find('[data-action="delete"]')
			.click({ force: true });

		cy.contains(".story-card", "Historyjka E2E").should("not.exist");

		cy.on("window:confirm", () => true);

		cy.get("#projectSelect").select("Projekt E2E");
		cy.get("#deleteProjectButton").click();

		cy.get("#projectSelect").should("not.contain", "Projekt E2E");
	});
});

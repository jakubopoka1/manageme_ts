import type { Notification, NotificationPriority } from "./types";

const STORAGE_KEY = "kanban_app_notifications";

export class NotificationService {
	private read(): Notification[] {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		try {
			return JSON.parse(raw) as Notification[];
		} catch {
			return [];
		}
	}

	private write(notifications: Notification[]): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
	}

	seed(users: { id: string; role: string }[]): void {
		const current = this.read();
		if (current.length > 0 || users.length === 0) {
			return;
		}

		const admin = users.find((user) => user.role === "admin");
		if (!admin) {
			return;
		}

		this.createNotification({
			title: "Utworzono nowy projekt",
			message:
				'Projekt "Projekt startowy" został utworzony i jest gotowy do pracy.',
			priority: "high",
			recipientId: admin.id,
		});

		this.createNotification({
			title: "Witamy w centrum powiadomień",
			message:
				"Tutaj zobaczysz najnowsze zdarzenia związane z projektami, historyjkami i zadaniami.",
			priority: "medium",
			recipientId: admin.id,
		});
	}

	getNotificationsForUser(userId: string): Notification[] {
		return this.read()
			.filter((notification) => notification.recipientId === userId)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	getUnreadCount(userId: string): number {
		return this.getNotificationsForUser(userId).filter(
			(notification) => !notification.isRead,
		).length;
	}

	getNotificationById(notificationId: string): Notification | null {
		return (
			this.read().find((notification) => notification.id === notificationId) ??
			null
		);
	}

	createNotification(input: {
		title: string;
		message: string;
		priority: NotificationPriority;
		recipientId: string;
	}): Notification {
		const notifications = this.read();

		const notification: Notification = {
			id: crypto.randomUUID(),
			title: input.title,
			message: input.message,
			date: new Date().toISOString(),
			priority: input.priority,
			isRead: false,
			recipientId: input.recipientId,
		};

		notifications.unshift(notification);
		this.write(notifications);

		return notification;
	}

	createNotificationForAdmins(
		admins: { id: string }[],
		input: {
			title: string;
			message: string;
			priority: NotificationPriority;
		},
	): void {
		admins.forEach((admin) => {
			this.createNotification({
				title: input.title,
				message: input.message,
				priority: input.priority,
				recipientId: admin.id,
			});
		});
	}

	markAsRead(notificationId: string): void {
		const notifications = this.read();
		const notification = notifications.find(
			(item) => item.id === notificationId,
		);

		if (!notification || notification.isRead) {
			return;
		}

		notification.isRead = true;
		this.write(notifications);
	}

	markAllAsReadForUser(userId: string): void {
		const notifications = this.read();
		let hasChanges = false;

		notifications.forEach((notification) => {
			if (notification.recipientId === userId && !notification.isRead) {
				notification.isRead = true;
				hasChanges = true;
			}
		});

		if (hasChanges) {
			this.write(notifications);
		}
	}
}

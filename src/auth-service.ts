import { GOOGLE_CLIENT_ID } from "./config";

export type GoogleProfile = {
	email: string;
	firstName: string;
	lastName: string;
	avatarUrl?: string;
};

type GoogleCredentialResponse = {
	credential: string;
};

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string;
						callback: (response: GoogleCredentialResponse) => void;
					}) => void;
					renderButton: (
						element: HTMLElement,
						options: {
							theme: string;
							size: string;
							text: string;
							shape: string;
						},
					) => void;
				};
			};
		};
	}
}

function decodeJwtPayload(token: string): Record<string, string> {
	const payload = token.split(".")[1];
	const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
	const json = window.atob(normalized);

	const decoded = decodeURIComponent(
		json
			.split("")
			.map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
			.join(""),
	);

	return JSON.parse(decoded) as Record<string, string>;
}

export function initGoogleLogin(
	onLogin: (profile: GoogleProfile) => void,
): void {
	const container =
		document.querySelector<HTMLDivElement>("#googleLoginButton");

	if (!container || !window.google) {
		return;
	}

	window.google.accounts.id.initialize({
		client_id: GOOGLE_CLIENT_ID,
		callback: (response) => {
			const payload = decodeJwtPayload(response.credential);

			onLogin({
				email: payload.email,
				firstName: payload.given_name ?? "",
				lastName: payload.family_name ?? "",
				avatarUrl: payload.picture,
			});
		},
	});

	window.google.accounts.id.renderButton(container, {
		theme: "outline",
		size: "large",
		text: "signin_with",
		shape: "pill",
	});
}

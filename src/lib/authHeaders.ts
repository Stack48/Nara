// Fournit les headers d'authentification pour les appels API côté client.
// TODO : brancher sur la vraie session Cognito quand le flux de login
// sera en place — c'est le SEUL endroit à modifier ce jour-là.
export function getAuthHeaders(): Record<string, string> {
	const cognitoId =
		process.env.NEXT_PUBLIC_DEV_COGNITO_ID ?? "";

	return cognitoId ? { "x-cognito-id": cognitoId } : {};
}
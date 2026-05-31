import { login, logout, getUser } from "@/hooks/useAuth";

// Mock Amplify
jest.mock("aws-amplify/auth", () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    fetchAuthSession: jest.fn(),
    resetPassword: jest.fn(),
    confirmResetPassword: jest.fn(),
}));

jest.mock("@/lib/amplify", () => ({}));

import { signIn, signOut, getCurrentUser } from "aws-amplify/auth";

describe("Auth — useAuth", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Login réussi
    it("login réussi retourne un résultat", async () => {
        (signIn as jest.Mock).mockResolvedValue({ isSignedIn: true });
        (signOut as jest.Mock).mockResolvedValue({});

        const result = await login("test@test.com", "Test1234!");
        expect(result).toEqual({ isSignedIn: true });
    });

    // ✅ Login échoue avec mauvais mot de passe
    it("login échoue avec mauvais mot de passe", async () => {
        (signIn as jest.Mock).mockRejectedValue(new Error("Incorrect username or password"));
        (signOut as jest.Mock).mockResolvedValue({});

        await expect(login("test@test.com", "mauvais")).rejects.toThrow("Incorrect username or password");
    });

    // ✅ Token expiré → 401
    it("getUser retourne null si pas de session", async () => {
        (getCurrentUser as jest.Mock).mockRejectedValue(new Error("No current user"));

        const user = await getUser();
        expect(user).toBeNull();
    });

    // ✅ Logout réussi
    it("logout réussi", async () => {
        (signOut as jest.Mock).mockResolvedValue({});
        await expect(logout()).resolves.not.toThrow();
    });

});
import { Amplify } from "aws-amplify";

export const amplifyConfig = {
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
            loginWith: {
                email: true,
                username: true,
            },
            signUpVerificationMethod: "code" as const,
            userAttributes: {
                email: { required: true },
            },
            cookieStorage: {
                domain: process.env.NEXT_PUBLIC_DOMAIN ?? "localhost",
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict" as const,
                path: "/",
            },
        },
    },
};

Amplify.configure(amplifyConfig);

export default Amplify;
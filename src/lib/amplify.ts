import { Amplify } from "aws-amplify";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";

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
        },
    },
};

Amplify.configure(amplifyConfig, { ssr: true });

export const { runWithAmplifyServerContext } = createServerRunner({
    config: amplifyConfig,
});

export default Amplify;
import { Amplify } from "aws-amplify";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
            loginWith: {
                email: true,
                username: true,
            },
            signUpVerificationMethod: "code",
            userAttributes: {
                email: {
                    required: true,
                },
            },
        },
    },
});

export default Amplify;
/** @type {import('jest').Config} */
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^server-only$": "<rootDir>/src/__mocks__/server-only.ts",
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testMatch: ["**/__tests__/**/*.test.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
};

module.exports = config;
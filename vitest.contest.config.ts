import path from "node:path";

const backendNodeModules = path.resolve(__dirname, "backend/node_modules");
const backendPackage = (name: string) => path.join(backendNodeModules, name);

export default {
  root: __dirname,
  resolve: {
    alias: {
      bcryptjs: backendPackage("bcryptjs"),
      "cookie-parser": backendPackage("cookie-parser"),
      cors: backendPackage("cors"),
      dotenv: backendPackage("dotenv"),
      express: backendPackage("express"),
      helmet: backendPackage("helmet"),
      jsonwebtoken: backendPackage("jsonwebtoken"),
      mongoose: path.join(backendPackage("mongoose"), "index.js"),
      morgan: backendPackage("morgan"),
      passport: backendPackage("passport"),
      "passport-google-oauth20": backendPackage("passport-google-oauth20"),
      supertest: path.join(backendPackage("supertest"), "index.js"),
    },
  },
  test: {
    deps: {
      moduleDirectories: [backendNodeModules, "node_modules"],
    },
    environment: "node",
    fileParallelism: false,
    include: ["tests/contest/**/*.test.ts"],
    setupFiles: ["tests/contest/setup/vitest-global-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
};

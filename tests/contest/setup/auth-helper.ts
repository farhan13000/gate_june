import request from "supertest";
import { generateToken } from "../../../backend/src/utils/jwt";
import { createTestUser } from "./test-users";

export function authCookie(user: any) {
  return [`token=${generateToken(String(user._id))}`];
}

export async function createAuthedAgent(app: any, role: "student" | "admin" = "student", rating = 1200) {
  const user = await createTestUser(role, rating);
  const agent = request.agent(app);
  agent.jar.setCookie(`token=${generateToken(String(user._id))}`);
  return { user, agent, cookie: authCookie(user) };
}

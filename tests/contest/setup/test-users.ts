import User from "../../../backend/src/models/User";

let seq = 0;

export async function createTestUser(role: "student" | "admin" = "student", rating = 1200) {
  seq += 1;
  return User.create({
    fullName: `${role} ${seq}`,
    email: `${role}.${seq}@contest.test`,
    passwordHash: "password123",
    role,
    rating,
    authProvider: "local",
    domains: ["GATE_DA"],
  });
}

export async function createManyStudents(count: number, ratingStart = 1000) {
  const users = [];
  for (let i = 0; i < count; i += 1) {
    users.push(await createTestUser("student", ratingStart + i));
  }
  return users;
}

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),           // Clerk user ID: "user_2abc..."
  username: text("username").unique(),   // public handle, e.g. "gorilla42"
  units: text("units", { enum: ["kg"] }).notNull().default("kg"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const friendships = sqliteTable("friendships", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  fromUserId: text("from_user_id").notNull().references(() => users.id),
  toUserId: text("to_user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "accepted"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const bodyWeightEntries = sqliteTable("body_weight_entries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),          // ISO date: YYYY-MM-DD
  weightKg: real("weight_kg").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
});

export const workoutExercises = sqliteTable("workout_exercises", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id", { mode: "number" })
    .notNull()
    .references(() => workouts.id),
  exerciseId: integer("exercise_id", { mode: "number" })
    .notNull()
    .references(() => exercises.id),
  order: integer("order", { mode: "number" }).notNull(),
});

export const setEntries = sqliteTable("set_entries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  workoutExerciseId: integer("workout_exercise_id", { mode: "number" })
    .notNull()
    .references(() => workoutExercises.id),
  order: integer("order", { mode: "number" }).notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps", { mode: "number" }).notNull(),
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const planExercises = sqliteTable("plan_exercises", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  planId: integer("plan_id", { mode: "number" })
    .notNull()
    .references(() => workoutPlans.id),
  exerciseId: integer("exercise_id", { mode: "number" })
    .notNull()
    .references(() => exercises.id),
  order: integer("order", { mode: "number" }).notNull(),
  plannedSetCount: integer("planned_set_count", { mode: "number" }),
});

export const goals = sqliteTable("goals", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  exerciseId: integer("exercise_id", { mode: "number" })
    .notNull()
    .references(() => exercises.id),
  targetOneRm: real("target_one_rm").notNull(),
  targetDate: text("target_date").notNull(), // ISO date: YYYY-MM-DD
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

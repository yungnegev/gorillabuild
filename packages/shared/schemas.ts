import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  units: z.enum(["kg"]),
  email: z.string().email().optional(),   // from Clerk, not stored in DB
  name: z.string().optional(),            // from Clerk, not stored in DB
  imageUrl: z.string().url().optional(),  // from Clerk, not stored in DB
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

// ─── Friendship ───────────────────────────────────────────────────────────────

export const friendshipSchema = z.object({
  id: z.number(),
  fromUserId: z.string(),
  toUserId: z.string(),
  status: z.enum(["pending", "accepted"]),
  createdAt: z.string().datetime(),
});

export type Friendship = z.infer<typeof friendshipSchema>;

export const friendSchema = z.object({
  friendshipId: z.number(),
  userId: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});

export type Friend = z.infer<typeof friendSchema>;

// ─── Body weight ──────────────────────────────────────────────────────────────

export const bodyWeightEntrySchema = z.object({
  id: z.number(),
  userId: z.string(),
  date: z.string(),       // YYYY-MM-DD
  weightKg: z.number(),
});

export type BodyWeightEntry = z.infer<typeof bodyWeightEntrySchema>;

export const createBodyWeightEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive(),
});

export type CreateBodyWeightEntry = z.infer<typeof createBodyWeightEntrySchema>;

// ─── Exercise ─────────────────────────────────────────────────────────────────

export const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const oneRmPointSchema = z.object({
  workoutId: z.number(),
  date: z.string().datetime(),
  oneRm: z.number(),
  bestWeightKg: z.number(),
  bestReps: z.number(),
});

export type OneRmPoint = z.infer<typeof oneRmPointSchema>;

export const exerciseDetailSchema = exerciseSchema.extend({
  history: z.array(oneRmPointSchema),
});

export type ExerciseDetail = z.infer<typeof exerciseDetailSchema>;

// ─── Set ──────────────────────────────────────────────────────────────────────

export const setEntrySchema = z.object({
  id: z.number(),
  workoutExerciseId: z.number(),
  order: z.number(),
  weightKg: z.number(),
  reps: z.number(),
  oneRm: z.number(),
});

export type SetEntry = z.infer<typeof setEntrySchema>;

export const createSetSchema = z.object({
  weightKg: z.number().positive(),
  reps: z.number().int().positive(),
});

export type CreateSet = z.infer<typeof createSetSchema>;

export const updateSetSchema = z.object({
  weightKg: z.number().positive().optional(),
  reps: z.number().int().positive().optional(),
});

export type UpdateSet = z.infer<typeof updateSetSchema>;

// ─── Workout exercise ─────────────────────────────────────────────────────────

export const workoutExerciseSchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  exerciseId: z.number(),
  exerciseName: z.string(),
  order: z.number(),
  sets: z.array(setEntrySchema),
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

// ─── Workout ──────────────────────────────────────────────────────────────────

export const workoutSchema = z.object({
  id: z.number(),
  userId: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  exercises: z.array(workoutExerciseSchema),
});

export type Workout = z.infer<typeof workoutSchema>;

export const startWorkoutSchema = z.object({
  planId: z.number().optional(),
});

export type StartWorkout = z.infer<typeof startWorkoutSchema>;

// ─── Plan ─────────────────────────────────────────────────────────────────────

export const planExerciseSchema = z.object({
  id: z.number(),
  planId: z.number(),
  exerciseId: z.number(),
  exerciseName: z.string(),
  order: z.number(),
  plannedSetCount: z.number().nullable(),
});

export type PlanExercise = z.infer<typeof planExerciseSchema>;

export const workoutPlanSchema = z.object({
  id: z.number(),
  userId: z.string(),
  name: z.string(),
  updatedAt: z.string().datetime(),
  exercises: z.array(planExerciseSchema),
});

export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

export const createPlanSchema = z.object({
  name: z.string().min(1),
  exercises: z.array(
    z.object({
      exerciseId: z.number(),
      order: z.number(),
      plannedSetCount: z.number().int().positive().optional(),
    })
  ),
});

export type CreatePlan = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.number(),
        order: z.number(),
        plannedSetCount: z.number().int().positive().optional(),
      })
    )
    .optional(),
});

export type UpdatePlan = z.infer<typeof updatePlanSchema>;

// ─── Goal ─────────────────────────────────────────────────────────────────────

export const goalSchema = z.object({
  id: z.number(),
  userId: z.string(),
  exerciseId: z.number(),
  exerciseName: z.string(),
  targetOneRm: z.number(),
  targetDate: z.string(),   // YYYY-MM-DD
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  currentOneRm: z.number().nullable(),
  remainingKg: z.number().nullable(),
});

export type Goal = z.infer<typeof goalSchema>;

export const createGoalSchema = z.object({
  exerciseId: z.number(),
  targetOneRm: z.number().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateGoal = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  targetOneRm: z.number().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type UpdateGoal = z.infer<typeof updateGoalSchema>;

// ─── Comparison ───────────────────────────────────────────────────────────────

export const comparisonBodyWeightSchema = z.object({
  date: z.string(),       // YYYY-MM-DD
  weightKg: z.number(),
});

export type ComparisonBodyWeight = z.infer<typeof comparisonBodyWeightSchema>;

export const comparisonSeriesSchema = z.object({
  userId: z.string(),
  username: z.string().nullable(),
  points: z.array(oneRmPointSchema),
  bodyWeights: z.array(comparisonBodyWeightSchema).optional(),
});

export type ComparisonSeries = z.infer<typeof comparisonSeriesSchema>;

export const comparisonSchema = z.object({
  exercise: exerciseSchema,
  mine: comparisonSeriesSchema,
  friend: comparisonSeriesSchema,
});

export type Comparison = z.infer<typeof comparisonSchema>;

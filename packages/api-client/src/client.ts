import type {
  User,
  Exercise,
  ExerciseDetail,
  Workout,
  WorkoutPlan,
  Friend,
  Friendship,
  BodyWeightEntry,
  Goal,
  Comparison,
  StartWorkout,
  CreateSet,
  UpdateSet,
  CreatePlan,
  UpdatePlan,
  CreateBodyWeightEntry,
  CreateGoal,
} from "@gorillabuild/shared";

type RequestOptions = {
  headers?: Record<string, string>;
};

function createFetcher(baseUrl: string, defaultOptions?: RequestOptions) {
  return async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...defaultOptions?.headers,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  };
}

export function createApiClient(baseUrl: string, options?: RequestOptions) {
  const fetcher = createFetcher(baseUrl, options);

  return {
    health: () => fetcher<{ status: string }>("/api/health"),

    users: {
      me: () => fetcher<User>("/api/users/me"),
      updateMe: (data: { username?: string; units?: "kg" }) =>
        fetcher<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(data) }),
    },

    exercises: {
      list: () => fetcher<Exercise[]>("/api/exercises"),
      get: (id: number) => fetcher<ExerciseDetail>(`/api/exercises/${id}`),
    },

    workouts: {
      active: () => fetcher<Workout | null>("/api/workouts"),
      start: (data: StartWorkout = {}) =>
        fetcher<{ id: number }>("/api/workouts", { method: "POST", body: JSON.stringify(data) }),
      finish: (id: number) =>
        fetcher<{ ok: boolean }>(`/api/workouts/${id}`, { method: "PATCH" }),
      addExercise: (workoutId: number, exerciseId: number) =>
        fetcher<{ id: number }>(`/api/workouts/${workoutId}/exercises`, {
          method: "POST",
          body: JSON.stringify({ exerciseId }),
        }),
    },

    sets: {
      add: (workoutExerciseId: number, data: CreateSet) =>
        fetcher<{ id: number }>(`/api/workout-exercises/${workoutExerciseId}/sets`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: number, data: UpdateSet) =>
        fetcher<{ id: number }>(`/api/sets/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        fetcher<{ ok: boolean }>(`/api/sets/${id}`, { method: "DELETE" }),
    },

    plans: {
      list: () => fetcher<WorkoutPlan[]>("/api/plans"),
      get: (id: number) => fetcher<WorkoutPlan>(`/api/plans/${id}`),
      create: (data: CreatePlan) =>
        fetcher<WorkoutPlan>("/api/plans", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: UpdatePlan) =>
        fetcher<WorkoutPlan>(`/api/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        fetcher<{ ok: boolean }>(`/api/plans/${id}`, { method: "DELETE" }),
    },

    friends: {
      list: () => fetcher<Friend[]>("/api/friends"),
      requests: () => fetcher<(Friendship & { username: string | null; name: string | null })[]>("/api/friends/requests"),
      add: (handle: string) =>
        fetcher<Friendship>("/api/friends", { method: "POST", body: JSON.stringify({ handle }) }),
      accept: (friendshipId: number) =>
        fetcher<{ ok: boolean }>(`/api/friends/${friendshipId}/accept`, { method: "PATCH" }),
      comparison: (friendshipId: number, exerciseId: number) =>
        fetcher<Comparison>(`/api/friends/${friendshipId}/exercises/${exerciseId}`),
    },

    bodyWeight: {
      list: () => fetcher<BodyWeightEntry[]>("/api/body-weight"),
      add: (data: CreateBodyWeightEntry) =>
        fetcher<BodyWeightEntry>("/api/body-weight", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    goal: {
      list: () => fetcher<Goal[]>("/api/goal"),
      set: (data: CreateGoal) =>
        fetcher<Goal>("/api/goal", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: number) => fetcher<{ ok: boolean }>(`/api/goal/${id}`, { method: "DELETE" }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

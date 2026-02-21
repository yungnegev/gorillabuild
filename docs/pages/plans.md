# Plans

**Роут:** `(tabs)/plans` → URL `/plans`

## Назначение

Главный экран вкладки Plans. Список сохранённых планов тренировок, создание новых планов и точка входа для старта пустой тренировки.

## Содержимое экрана

- Кнопка **«Добавить план»** — открывает форму создания плана (одно поле: название). Создание через `POST /api/plans` с телом `{ name, exercises: [] }`. После успеха список обновляется.
- **FAB "Start empty workout"** — переход на пустую активную тренировку.
- **Список планов пользователя** (`WorkoutPlan`): карточки с названием и датой обновления, тап ведёт на `plans/[id]`. Удаление плана — на экране Plan Detail (кнопка «Удалить план»).

**Откуда данные:** список загружается при открытии страницы (серверный рендер через `getPlans(userId)` из БД). Для обновления без перезагрузки — `GET /api/plans`. Создание — `POST /api/plans`.

## Переходы

| Действие | Куда |
|----------|------|
| «Добавить план» → форма → «Создать» | План создаётся, список обновляется, форма закрывается |
| FAB "Start empty workout" | `workout/active` (пустая тренировка) |
| Тап на план | `plans/[id]` (Plan Detail) |

## Модель данных (экран списка)

| Сущность | Поля |
|----------|------|
| `WorkoutPlan` | `id`, `userId`, `name`, `updatedAt` |

Полная модель плана с упражнениями — на экране Plan Detail; там же `PlanExercise` (`planId`, `exerciseId`, `order`, `plannedSetCount?`).

## База данных (сверка с докой)

Таблицы в `apps/web/db/schema.ts`:

| Таблица | Поля | Соответствие доке |
|---------|------|-------------------|
| `workout_plans` | `id`, `user_id`, `name`, `updated_at` | ✓ WorkoutPlan (id, userId, name, updatedAt) |
| `plan_exercises` | `id`, `plan_id`, `exercise_id`, `order`, `planned_set_count` (nullable) | ✓ PlanExercise (planId, exerciseId, order, plannedSetCount?) — сущность без `id`, в БД `id` есть как PK |

Ссылки: `workout_plans.user_id` → `users.id`; `plan_exercises.plan_id` → `workout_plans.id`, `plan_exercises.exercise_id` → `exercises.id`.

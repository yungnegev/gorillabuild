# Routing

Навигация построена на tab-bar с четырьмя вкладками.

## Tab-bar

| Вкладка | Путь |
|---------|------|
| Plans   | `(tabs)/plans` |
| Friends | `(tabs)/friends` |
| Goal    | `(tabs)/goal` |
| Profile | `(tabs)/profile` |

## Полная карта роутов

```
(tabs)/
  plans/                  → Plans (список планов + FAB)
  plans/[id]/             → Plan Detail
  friends/                → Friends (список друзей)
  friends/[id]/           → Friend Detail
  goal/                   → Goal
  profile/                → Profile / Settings

workout/
  active/                 → Active Workout (открывается поверх tab-bar)

exercise/
  [id]/                   → Exercise Detail (открывается из Active Workout и Friend Detail)
```

## Переходы

| Откуда | Действие | Куда |
|--------|----------|------|
| Plans | FAB "Start empty workout" | `workout/active` |
| Plans | Тап на план | `plans/[id]` |
| Plan Detail | Кнопка "Start plan" | `workout/active` |
| Active Workout | Тап на упражнение | `exercise/[id]` |
| Friends | Тап на друга | `friends/[id]` |
| Friend Detail | Выбор упражнения | `exercise/[id]` |
| Active Workout | "Finish workout" | Закрывает `workout/active`, возврат на Plans |
| Exercise Detail | "Поставить цель" / "Изменить цель" | `(tabs)/goal` (форма с предзаполненным упражнением) |

## Восстановление незавершённой тренировки

При открытии приложения, если есть незавершённая тренировка (`finishedAt` = null), приложение
автоматически открывает `workout/active`.

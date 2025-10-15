# WorkoutTracking Specification

## Concept Overview

**Purpose**: maintain historical workout data for progression tracking and volume monitoring

**Principle**: each workout session records exercises with weights, sets, and reps, and tracks weekly training volume for muscle group balance

## State

- **WorkoutSessions**: a set with
  - user: User
  - date: Date
  - sessionId: String

- **ExerciseRecords**: a set with
  - sessionId: String
  - exercise: Exercise
  - weight: Number
  - sets: Number
  - reps: Number
  - notes: String?

- **WeeklyVolume**: a set with
  - user: User
  - muscleGroup: MuscleGroup
  - weekStart: Date
  - volume: Number

## Actions

### startSession
```typescript
startSession(user: User, date: Date): string
```
- **Effect**: creates new workout session
- **Returns**: sessionId

### recordExercise
```typescript
recordExercise(sessionId: string, exercise: Exercise, weight: number, sets: number, reps: number, notes?: string): void
```
- **Requires**: sessionId exists
- **Effect**: adds exercise record to session

### getLastWeight
```typescript
getLastWeight(user: User, exercise: Exercise): number | null
```
- **Effect**: returns most recent weight for exercise by user, or null if none
- **Returns**: weight or null

### getWorkoutHistory
```typescript
getWorkoutHistory(user: User, exercise: Exercise, limit: number): string[]
```
- **Effect**: returns recent exercise record IDs sorted by date descending
- **Returns**: list of exercise record IDs

### updateVolume
```typescript
updateVolume(user: User, exercise: Exercise, sets: number, reps: number, weight: number, weekStart?: Date): void
```
- **Effect**: updates weekly volume for exercise's muscle groups

### checkBalance
```typescript
checkBalance(user: User, weekStart: Date): MuscleGroup[]
```
- **Effect**: returns muscle groups with significantly lower volume
- **Returns**: list of imbalanced muscle groups

### getWeeklyVolume
```typescript
getWeeklyVolume(user: User, weekStart: Date): { muscleGroup: MuscleGroup; volume: number }[]
```
- **Effect**: returns weekly volume data
- **Returns**: list of muscle group volumes

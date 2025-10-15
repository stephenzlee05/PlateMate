# ExerciseCatalog Specification

## Concept Overview

**Purpose**: maintain database of exercises with metadata

**Principle**: standardized exercise information for consistent tracking

## State

- **Exercises**: a set with
  - exerciseId: String
  - name: String
  - muscleGroups: Set<MuscleGroup>
  - movementPattern: String
  - equipment: String?
  - instructions: String?

## Actions

### addExercise
```typescript
addExercise(name: string, muscleGroups: Set<MuscleGroup>, movementPattern: string, equipment?: string, instructions?: string): string
```
- **Effect**: adds new exercise to catalog
- **Returns**: exerciseId

### searchExercises
```typescript
searchExercises(query: string, muscleGroup?: MuscleGroup): string[]
```
- **Effect**: returns exercise IDs matching search criteria
- **Returns**: list of matching exercise IDs

### getExercise
```typescript
getExercise(exerciseId: string): { name: string; muscleGroups: MuscleGroup[]; movementPattern: string; equipment: string; instructions: string } | null
```
- **Effect**: returns exercise details
- **Returns**: exercise details or null

### recommendExercises
```typescript
recommendExercises(muscleGroup: MuscleGroup, limit: number): string[]
```
- **Effect**: returns recommended exercises for muscle group
- **Returns**: list of recommended exercise IDs

### getExercisesByMovementPattern
```typescript
getExercisesByMovementPattern(movementPattern: string): string[]
```
- **Effect**: returns exercises matching movement pattern
- **Returns**: list of matching exercise IDs

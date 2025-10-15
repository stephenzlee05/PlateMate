---
timestamp: 'Sun Oct 12 2025 18:11:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_181106.7d950cfd.md]]'
content_id: f8f9560eb32ced9a3880f271b529034faf593cd020c6fa74037ae4a90319af9d
---

# concept: ProgressionEngine

**purpose**: automatically suggest weight progressions based on performance

**principle**: progressive overload through systematic weight increases

## State

* **ProgressionRules**: a set with
  * exercise: Exercise
  * increment: Number
  * deloadThreshold: Number
  * targetSessions: Number
* **UserProgressions**: a set with
  * user: User
  * exercise: Exercise
  * currentWeight: Number
  * sessionsAtWeight: Number
  * lastProgression: Date

## Actions

### suggestWeight

```typescript
suggestWeight(user: User, exercise: Exercise, lastWeight: number, lastSets: number, lastReps: number): { newWeight: number; reason: string; action: "increase" | "maintain" | "deload" }
```

* **Effect**: calculates next weight based on performance and rules
* **Returns**: weight suggestion details

### updateProgression

```typescript
updateProgression(user: User, exercise: Exercise, newWeight: number): void
```

* **Effect**: updates user's current weight and resets session counter

### getProgressionRule

```typescript
getProgressionRule(exercise: Exercise): { increment: number; deloadThreshold: number; targetSessions: number } | null
```

* **Effect**: returns progression rule for exercise type
* **Returns**: progression rule details or null

***

# PlateMate Backend API Specification

**Base URL:** `http://localhost:8000/api`

**Purpose:** A comprehensive fitness tracking and workout management system with exercise catalog, user management, progression tracking, routine planning, and workout history.

---

## ExerciseCatalog Concept

**Purpose:** Maintain database of exercises with metadata

### POST /api/ExerciseCatalog/addExercise

**Description:** Adds a new exercise to the catalog.

**Request Body:**
```json
{
  "name": "string",
  "muscleGroups": ["string"],
  "movementPattern": "string",
  "equipment": "string | null",
  "instructions": "string | null"
}
```

**Success Response:**
```json
{
  "exerciseId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExerciseCatalog/searchExercises

**Description:** Searches for exercises matching criteria.

**Request Body:**
```json
{
  "query": "string | null",
  "muscleGroup": "string | null"
}
```

**Success Response:**
```json
{
  "exercises": [
    {
      "exerciseId": "string",
      "name": "string",
      "muscleGroups": ["string"],
      "movementPattern": "string",
      "equipment": "string | null",
      "instructions": "string | null"
    }
  ]
}
```

---

### POST /api/ExerciseCatalog/getExercise

**Description:** Gets exercise details by ID.

**Request Body:**
```json
{
  "exerciseId": "string"
}
```

**Success Response:**
```json
{
  "exercise": {
    "exerciseId": "string",
    "name": "string",
    "muscleGroups": ["string"],
    "movementPattern": "string",
    "equipment": "string | null",
    "instructions": "string | null"
  }
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExerciseCatalog/recommendExercises

**Description:** Recommends exercises for a specific muscle group.

**Request Body:**
```json
{
  "muscleGroup": "string",
  "limit": "number"
}
```

**Success Response:**
```json
{
  "exerciseIds": ["string"]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExerciseCatalog/getExercisesByMovementPattern

**Description:** Gets exercises by movement pattern.

**Request Body:**
```json
{
  "movementPattern": "string"
}
```

**Success Response:**
```json
{
  "exerciseIds": ["string"]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ExerciseCatalog/_getAllExercises

**Description:** Gets all exercises.

**Request Body:**
```json
{}
```

**Success Response:**
```json
{
  "exercises": [
    {
      "exerciseId": "string",
      "name": "string",
      "muscleGroups": ["string"],
      "movementPattern": "string",
      "equipment": "string | null",
      "instructions": "string | null"
    }
  ]
}
```

---

### POST /api/ExerciseCatalog/_getExercisesByMuscleGroup

**Description:** Gets exercises by muscle group.

**Request Body:**
```json
{
  "muscleGroup": "string"
}
```

**Success Response:**
```json
[
  {
    "exerciseId": "string",
    "name": "string",
    "muscleGroups": ["string"],
    "movementPattern": "string",
    "equipment": "string | null",
    "instructions": "string | null"
  }
]
```

---

### POST /api/ExerciseCatalog/_getExercisesByMovementPattern

**Description:** Gets exercises by movement pattern.

**Request Body:**
```json
{
  "movementPattern": "string"
}
```

**Success Response:**
```json
[
  {
    "exerciseId": "string",
    "name": "string",
    "muscleGroups": ["string"],
    "movementPattern": "string",
    "equipment": "string | null",
    "instructions": "string | null"
  }
]
```

---

### POST /api/ExerciseCatalog/_getExercisesByEquipment

**Description:** Gets exercises by equipment.

**Request Body:**
```json
{
  "equipment": "string"
}
```

**Success Response:**
```json
[
  {
    "exerciseId": "string",
    "name": "string",
    "muscleGroups": ["string"],
    "movementPattern": "string",
    "equipment": "string | null",
    "instructions": "string | null"
  }
]
```

---

## UserManagement Concept

**Purpose:** Manage user accounts and preferences

### POST /api/UserManagement/createUser

**Description:** Creates a new user with default preferences.

**Request Body:**
```json
{
  "username": "string",
  "email": "string"
}
```

**Success Response:**
```json
{
  "userId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/getUser

**Description:** Gets user basic information with preferences.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response:**
```json
{
  "user": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "preferences": {
      "defaultIncrement": "number",
      "units": "string",
      "notifications": "boolean"
    }
  }
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/getUserPreferencesId

**Description:** Gets user's preferences ID.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response:**
```json
{
  "preferencesId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/createDefaultPreferences

**Description:** Creates default preferences for a new user.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response:**
```json
{
  "preferencesId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/updatePreferences

**Description:** Updates user preferences by userId.

**Request Body:**
```json
{
  "userId": "string",
  "preferences": {
    "defaultIncrement": "number | null",
    "units": "string | null",
    "notifications": "boolean | null"
  }
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/updatePreferencesById

**Description:** Updates user preferences by preferencesId.

**Request Body:**
```json
{
  "preferencesId": "string",
  "preferences": {
    "defaultIncrement": "number | null",
    "units": "string | null",
    "notifications": "boolean | null"
  }
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/getPreferences

**Description:** Gets user preferences by ID.

**Request Body:**
```json
{
  "preferencesId": "string"
}
```

**Success Response:**
```json
{
  "defaultIncrement": "number",
  "units": "string",
  "notifications": "boolean"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/getPreferencesByUser

**Description:** Gets user preferences by user ID.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response:**
```json
{
  "preferencesId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserManagement/_getAllUsers

**Description:** Gets all users.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "userId": "string",
    "username": "string",
    "email": "string",
    "preferences": "string"
  }
]
```

---

### POST /api/UserManagement/_getAllPreferences

**Description:** Gets all user preferences.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "preferencesId": "string",
    "userId": "string",
    "defaultIncrement": "number",
    "units": "string",
    "notifications": "boolean"
  }
]
```

---

### POST /api/UserManagement/_getUserPreferences

**Description:** Gets preferences for a specific user.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response:**
```json
[
  {
    "preferencesId": "string",
    "userId": "string",
    "defaultIncrement": "number",
    "units": "string",
    "notifications": "boolean"
  }
]
```

---

## ProgressionEngine Concept

**Purpose:** Automatically suggest weight progressions based on performance

### POST /api/ProgressionEngine/suggestWeight

**Description:** Suggests next weight based on performance and rules.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string",
  "lastWeight": "number",
  "lastSets": "number",
  "lastReps": "number"
}
```

**Success Response:**
```json
{
  "suggestion": {
    "newWeight": "number",
    "reason": "string",
    "action": "increase | maintain | deload"
  }
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ProgressionEngine/updateProgression

**Description:** Updates user's current weight and resets session counter.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string",
  "newWeight": "number"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ProgressionEngine/getProgressionRule

**Description:** Gets progression rule for exercise.

**Request Body:**
```json
{
  "exercise": "string"
}
```

**Success Response:**
```json
{
  "rule": {
    "exercise": "string",
    "increment": "number",
    "deloadThreshold": "number",
    "targetSessions": "number"
  }
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ProgressionEngine/createProgressionRule

**Description:** Creates a progression rule for an exercise.

**Request Body:**
```json
{
  "exercise": "string",
  "increment": "number",
  "deloadThreshold": "number",
  "targetSessions": "number"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/ProgressionEngine/_getUserProgression

**Description:** Gets user's progression for an exercise.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string"
}
```

**Success Response:**
```json
[
  {
    "user": "string",
    "exercise": "string",
    "currentWeight": "number",
    "sessionsAtWeight": "number",
    "lastProgression": "string"
  }
]
```

---

### POST /api/ProgressionEngine/_getAllProgressionRules

**Description:** Gets all progression rules.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "exercise": "string",
    "increment": "number",
    "deloadThreshold": "number",
    "targetSessions": "number"
  }
]
```

---

### POST /api/ProgressionEngine/_getAllUserProgressions

**Description:** Gets all user progressions.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "user": "string",
    "exercise": "string",
    "currentWeight": "number",
    "sessionsAtWeight": "number",
    "lastProgression": "string"
  }
]
```

---

## RoutinePlanner Concept

**Purpose:** Manage workout templates and balance muscle group training

### POST /api/RoutinePlanner/createTemplate

**Description:** Creates a new workout template.

**Request Body:**
```json
{
  "user": "string",
  "name": "string",
  "exercises": ["string"]
}
```

**Success Response:**
```json
{
  "templateId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/getSuggestedWorkout

**Description:** Gets suggested workout template based on recent training volume and balance.

**Request Body:**
```json
{
  "user": "string",
  "date": "string"
}
```

**Success Response:**
```json
{
  "template": {
    "templateId": "string",
    "name": "string",
    "exercises": ["string"],
    "muscleGroups": ["string"]
  } | null
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/updateVolume

**Description:** Updates weekly volume for exercise's muscle groups.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string",
  "sets": "number",
  "reps": "number",
  "weight": "number",
  "weekStart": "string | null"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/checkBalance

**Description:** Checks for muscle group imbalances.

**Request Body:**
```json
{
  "user": "string",
  "weekStart": "string"
}
```

**Success Response:**
```json
{
  "imbalance": ["string"]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/getTemplate

**Description:** Gets template details by ID.

**Request Body:**
```json
{
  "templateId": "string"
}
```

**Success Response:**
```json
{
  "name": "string",
  "exercises": ["string"],
  "muscleGroups": ["string"]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/setDefaultTemplate

**Description:** Sets a template as default for a user.

**Request Body:**
```json
{
  "user": "string",
  "templateId": "string"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/RoutinePlanner/_getUserTemplates

**Description:** Gets all templates for a user.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response:**
```json
[
  {
    "templateId": "string",
    "name": "string",
    "exercises": ["string"],
    "muscleGroups": ["string"]
  }
]
```

---

### POST /api/RoutinePlanner/_getWeeklyVolume

**Description:** Gets weekly volume for a user and week.

**Request Body:**
```json
{
  "user": "string",
  "weekStart": "string"
}
```

**Success Response:**
```json
[
  {
    "user": "string",
    "muscleGroup": "string",
    "weekStart": "string",
    "volume": "number"
  }
]
```

---

### POST /api/RoutinePlanner/_getAllTemplates

**Description:** Gets all workout templates.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "templateId": "string",
    "name": "string",
    "exercises": ["string"],
    "muscleGroups": ["string"]
  }
]
```

---

## WorkoutTracking Concept

**Purpose:** Maintain historical workout data for progression tracking

### POST /api/WorkoutTracking/startSession

**Description:** Starts a new workout session.

**Request Body:**
```json
{
  "user": "string",
  "date": "string"
}
```

**Success Response:**
```json
{
  "sessionId": "string"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/recordExercise

**Description:** Records an exercise in a workout session.

**Request Body:**
```json
{
  "sessionId": "string",
  "exercise": "string",
  "weight": "number",
  "sets": "number",
  "reps": "number",
  "notes": "string | null"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/getLastWeight

**Description:** Gets the last weight used for an exercise by a user.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string"
}
```

**Success Response:**
```json
{
  "weight": "number | null"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/getWorkoutHistory

**Description:** Gets workout history for a user and exercise.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string",
  "limit": "number"
}
```

**Success Response:**
```json
{
  "records": [
    {
      "sessionId": "string",
      "exercise": "string",
      "weight": "number",
      "sets": "number",
      "reps": "number",
      "notes": "string | null",
      "recordedAt": "string"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/updateVolume

**Description:** Updates weekly volume for exercise's muscle groups.

**Request Body:**
```json
{
  "user": "string",
  "exercise": "string",
  "sets": "number",
  "reps": "number",
  "weight": "number",
  "weekStart": "string | null"
}
```

**Success Response:**
```json
{}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/checkBalance

**Description:** Checks for muscle group imbalances.

**Request Body:**
```json
{
  "user": "string",
  "weekStart": "string"
}
```

**Success Response:**
```json
{
  "imbalance": ["string"]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/getWeeklyVolume

**Description:** Gets weekly volume for a user and week.

**Request Body:**
```json
{
  "user": "string",
  "weekStart": "string"
}
```

**Success Response:**
```json
{
  "volumes": [
    {
      "muscleGroup": "string",
      "volume": "number"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

---

### POST /api/WorkoutTracking/_getUserSessions

**Description:** Gets all workout sessions for a user.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response:**
```json
[
  {
    "sessionId": "string",
    "user": "string",
    "date": "string"
  }
]
```

---

### POST /api/WorkoutTracking/_getSessionRecords

**Description:** Gets all exercise records for a session.

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Success Response:**
```json
[
  {
    "sessionId": "string",
    "exercise": "string",
    "weight": "number",
    "sets": "number",
    "reps": "number",
    "notes": "string | null",
    "recordedAt": "string"
  }
]
```

---

### POST /api/WorkoutTracking/_getUserRecords

**Description:** Gets all exercise records for a user.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response:**
```json
[
  {
    "sessionId": "string",
    "exercise": "string",
    "weight": "number",
    "sets": "number",
    "reps": "number",
    "notes": "string | null",
    "recordedAt": "string"
  }
]
```

---

### POST /api/WorkoutTracking/_getWeeklyVolume

**Description:** Gets weekly volume for a user and week.

**Request Body:**
```json
{
  "user": "string",
  "weekStart": "string"
}
```

**Success Response:**
```json
[
  {
    "user": "string",
    "muscleGroup": "string",
    "weekStart": "string",
    "volume": "number"
  }
]
```

---

### POST /api/WorkoutTracking/_getAllWeeklyVolume

**Description:** Gets all weekly volume records.

**Request Body:**
```json
{}
```

**Success Response:**
```json
[
  {
    "user": "string",
    "muscleGroup": "string",
    "weekStart": "string",
    "volume": "number"
  }
]
```

---

## General Notes

- All endpoints use POST method
- All requests should include `Content-Type: application/json` header
- All responses are JSON format
- Error responses include an `error` field with descriptive message
- Success responses vary by endpoint but typically include the requested data
- Query endpoints (prefixed with `_`) are for internal use and debugging
- All timestamps are in ISO format
- All IDs are string identifiers generated by the system
- Empty request bodies should be sent as `{}`









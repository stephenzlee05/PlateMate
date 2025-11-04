[@syncs](syncs.md)
[@architecture](../../background/implementing-synchronizations.md)
[@syncsRead](src/syncs/README.md)
[@api](api-specification.md)

# prompt: Generate src/syncs/workouts.sync.ts with request/response syncs for all WorkoutTracking state-modifying actions: startSession, recordExercise, updateVolume, deleteSession, removeWorkoutSession, removeWorkoutSessionDebug, removeWorkoutSessionRobust
# response:

Here's the `src/syncs/workouts.sync.ts` file implementing request/response synchronizations for the specified `WorkoutTracking` state-modifying actions.

This implementation assumes the following structure for `WorkoutTracking` actions within your `@concepts`:

```typescript
// Assumed concept actions for WorkoutTracking (for context, not part of the sync file)
// concept WorkoutTracking
// actions
//   startSession (user, workoutType) : (session)
//   recordExercise (session, exerciseName, sets, reps, weight) : (exerciseRecord)
//   updateVolume (exerciseRecord, newSets, newReps, newWeight) : (success: boolean)
//   deleteSession (session) : (success: boolean)
//   removeWorkoutSession (session) : (success: boolean)
//   removeWorkoutSessionDebug (session) : (success: boolean)
//   removeWorkoutSessionRobust (session) : (success: boolean)
```

```typescript
// src/syncs/workouts.sync.ts

import { actions, Sync } from "@engine";
import { Requesting, WorkoutTracking } from "@concepts"; // Assumes WorkoutTracking and Requesting are defined in @concepts

// --- startSession ---

/**
 * Handles incoming requests to start a new workout session.
 * Triggers the WorkoutTracking.startSession action.
 */
export const StartSessionRequest: Sync = ({ request, user, workoutType }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/startSession", user, workoutType },
    { request }, // Capture the request ID
  ]),
  then: actions([
    WorkoutTracking.startSession,
    { user, workoutType }, // Pass parameters to the concept action
  ]),
});

/**
 * Responds to a startSession request upon successful session creation.
 */
export const StartSessionResponse: Sync = ({ request, session }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/startSession" }, { request }],
    [WorkoutTracking.startSession, {}, { session }], // Match success output 'session'
  ),
  then: actions([
    Requesting.respond,
    { request, session }, // Respond with the new session ID
  ]),
});

/**
 * Responds to a startSession request if an error occurs during session creation.
 */
export const StartSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/startSession" }, { request }],
    [WorkoutTracking.startSession, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- recordExercise ---

/**
 * Handles incoming requests to record an exercise.
 * Triggers the WorkoutTracking.recordExercise action.
 */
export const RecordExerciseRequest: Sync = ({
  request,
  session,
  exerciseName,
  sets,
  reps,
  weight,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/recordExercise", session, exerciseName, sets, reps, weight },
    { request },
  ]),
  then: actions([
    WorkoutTracking.recordExercise,
    { session, exerciseName, sets, reps, weight },
  ]),
});

/**
 * Responds to a recordExercise request upon successful exercise recording.
 */
export const RecordExerciseResponse: Sync = ({ request, exerciseRecord }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/recordExercise" }, { request }],
    [WorkoutTracking.recordExercise, {}, { exerciseRecord }], // Match success output 'exerciseRecord'
  ),
  then: actions([
    Requesting.respond,
    { request, exerciseRecord }, // Respond with the new exercise record ID
  ]),
});

/**
 * Responds to a recordExercise request if an error occurs during recording.
 */
export const RecordExerciseResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/recordExercise" }, { request }],
    [WorkoutTracking.recordExercise, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- updateVolume ---

/**
 * Handles incoming requests to update exercise volume.
 * Triggers the WorkoutTracking.updateVolume action.
 */
export const UpdateVolumeRequest: Sync = ({
  request,
  exerciseRecord,
  newSets,
  newReps,
  newWeight,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/updateVolume", exerciseRecord, newSets, newReps, newWeight },
    { request },
  ]),
  then: actions([
    WorkoutTracking.updateVolume,
    { exerciseRecord, newSets, newReps, newWeight },
  ]),
});

/**
 * Responds to an updateVolume request upon successful volume update.
 */
export const UpdateVolumeResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/updateVolume" }, { request }],
    [WorkoutTracking.updateVolume, {}, { success }], // Match success output 'success'
  ),
  then: actions([
    Requesting.respond,
    { request, success }, // Respond with the success status
  ]),
});

/**
 * Responds to an updateVolume request if an error occurs during update.
 */
export const UpdateVolumeResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/updateVolume" }, { request }],
    [WorkoutTracking.updateVolume, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- deleteSession ---

/**
 * Handles incoming requests to delete a workout session.
 * Triggers the WorkoutTracking.deleteSession action.
 */
export const DeleteSessionRequest: Sync = ({ request, session }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/deleteSession", session },
    { request },
  ]),
  then: actions([
    WorkoutTracking.deleteSession,
    { session },
  ]),
});

/**
 * Responds to a deleteSession request upon successful session deletion.
 */
export const DeleteSessionResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/deleteSession" }, { request }],
    [WorkoutTracking.deleteSession, {}, { success }], // Match success output 'success'
  ),
  then: actions([
    Requesting.respond,
    { request, success }, // Respond with the success status
  ]),
});

/**
 * Responds to a deleteSession request if an error occurs during deletion.
 */
export const DeleteSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/deleteSession" }, { request }],
    [WorkoutTracking.deleteSession, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- removeWorkoutSession ---

/**
 * Handles incoming requests to remove a workout session.
 * Triggers the WorkoutTracking.removeWorkoutSession action.
 */
export const RemoveWorkoutSessionRequest: Sync = ({ request, session }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSession", session },
    { request },
  ]),
  then: actions([
    WorkoutTracking.removeWorkoutSession,
    { session },
  ]),
});

/**
 * Responds to a removeWorkoutSession request upon successful session removal.
 */
export const RemoveWorkoutSessionResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSession" }, { request }],
    [WorkoutTracking.removeWorkoutSession, {}, { success }], // Match success output 'success'
  ),
  then: actions([
    Requesting.respond,
    { request, success }, // Respond with the success status
  ]),
});

/**
 * Responds to a removeWorkoutSession request if an error occurs during removal.
 */
export const RemoveWorkoutSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSession" }, { request }],
    [WorkoutTracking.removeWorkoutSession, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- removeWorkoutSessionDebug ---

/**
 * Handles incoming requests to debug-remove a workout session.
 * Triggers the WorkoutTracking.removeWorkoutSessionDebug action.
 */
export const RemoveWorkoutSessionDebugRequest: Sync = ({ request, session }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSessionDebug", session },
    { request },
  ]),
  then: actions([
    WorkoutTracking.removeWorkoutSessionDebug,
    { session },
  ]),
});

/**
 * Responds to a removeWorkoutSessionDebug request upon successful removal.
 */
export const RemoveWorkoutSessionDebugResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionDebug" }, { request }],
    [WorkoutTracking.removeWorkoutSessionDebug, {}, { success }], // Match success output 'success'
  ),
  then: actions([
    Requesting.respond,
    { request, success }, // Respond with the success status
  ]),
});

/**
 * Responds to a removeWorkoutSessionDebug request if an error occurs during removal.
 */
export const RemoveWorkoutSessionDebugResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionDebug" }, { request }],
    [WorkoutTracking.removeWorkoutSessionDebug, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});

// --- removeWorkoutSessionRobust ---

/**
 * Handles incoming requests to robust-remove a workout session.
 * Triggers the WorkoutTracking.removeWorkoutSessionRobust action.
 */
export const RemoveWorkoutSessionRobustRequest: Sync = ({ request, session }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSessionRobust", session },
    { request },
  ]),
  then: actions([
    WorkoutTracking.removeWorkoutSessionRobust,
    { session },
  ]),
});

/**
 * Responds to a removeWorkoutSessionRobust request upon successful removal.
 */
export const RemoveWorkoutSessionRobustResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionRobust" }, { request }],
    [WorkoutTracking.removeWorkoutSessionRobust, {}, { success }], // Match success output 'success'
  ),
  then: actions([
    Requesting.respond,
    { request, success }, // Respond with the success status
  ]),
});

/**
 * Responds to a removeWorkoutSessionRobust request if an error occurs during removal.
 */
export const RemoveWorkoutSessionRobustResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionRobust" }, { request }],
    [WorkoutTracking.removeWorkoutSessionRobust, {}, { error }], // Match error output 'error'
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the error details
  ]),
});
```
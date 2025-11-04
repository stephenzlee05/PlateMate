/**
 * WorkoutTracking synchronizations
 * 
 * Handles request/response cycles for WorkoutTracking actions that require authentication.
 * All workout tracking actions require a valid user.
 */

import { Requesting, UserManagement, WorkoutTracking, Engine } from "@concepts";
import { actions, Frames, Sync } from "@engine";

/**
 * Helper function to validate user exists
 */
async function validateUser(frames: Frames, userId: any): Promise<Frames> {
  const originalFrame = frames[0];
  
  // Check if userId is provided
  if (!userId || userId === undefined) {
    return new Frames({
      ...originalFrame,
      error: "User ID is required",
    });
  }
  
  // Call getUser directly (it returns a single object, not an array)
  const userResult = await UserManagement.getUser({ userId });
  
  // Check if the result contains an error
  if ('error' in userResult) {
    return new Frames({
      ...originalFrame,
      error: userResult.error || "User not found",
    });
  }
  
  return frames;
}

/**
 * StartSession - Requires valid user
 */
export const StartSessionRequest: Sync = ({ request, user, date }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/startSession", user, date },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.startSession, { user, date }]),
});

export const StartSessionResponse: Sync = ({ request, sessionId, name }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/startSession" }, { request }],
    [WorkoutTracking.startSession, {}, { sessionId, name }],
  ),
  then: actions([Requesting.respond, { request, sessionId, name }]),
});

export const StartSessionErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/startSession" }, { request }],
    [WorkoutTracking.startSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * RecordExercise - Requires valid session (which implies valid user)
 */
export const RecordExerciseRequest: Sync = ({ request, sessionId, exercise, weight, sets, reps, notes }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/recordExercise", sessionId, exercise, weight, sets, reps, notes },
    { request },
  ]),
  then: actions([WorkoutTracking.recordExercise, { sessionId, exercise, weight, sets, reps, notes }]),
});

export const RecordExerciseSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/recordExercise" }, { request }],
    [WorkoutTracking.recordExercise, {}, {}],
  ),
  where: async (frames) => {
    // Filter out frames where the action output contains an error
    // The last action symbol in the frame corresponds to the recordExercise action
    const filteredFrames = new Frames();
    for (const frame of frames) {
      // Get the action ID from the last action symbol (recordExercise action)
      // Action symbols are named "action_0", "action_1", etc.
      const actionSymbols = Object.getOwnPropertySymbols(frame).filter(
        s => s.toString().startsWith('Symbol(action_')
      );
      if (actionSymbols.length > 0) {
        const lastActionSymbol = actionSymbols[actionSymbols.length - 1];
        const actionId = frame[lastActionSymbol];
        if (typeof actionId === 'string') {
          const actionRecord = Engine.Action._getById(actionId);
          // Only include frames where the action output doesn't have an error
          if (actionRecord?.output && 'error' in actionRecord.output) {
            continue; // Skip error cases
          }
        }
      }
      filteredFrames.push(frame);
    }
    return filteredFrames;
  },
  then: actions([Requesting.respond, { request, success: true }]),
});

export const RecordExerciseErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/recordExercise" }, { request }],
    [WorkoutTracking.recordExercise, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * UpdateVolume - Requires valid user
 */
export const UpdateVolumeRequest: Sync = ({ request, user, exercise, sets, reps, weight, weekStart }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/updateVolume", user, exercise, sets, reps, weight, weekStart },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.updateVolume, { user, exercise, sets, reps, weight, weekStart }]),
});

export const UpdateVolumeResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/updateVolume" }, { request }],
    [WorkoutTracking.updateVolume, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * DeleteSession - Session validation handled by the concept
 */
export const DeleteSessionRequest: Sync = ({ request, sessionId }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/deleteSession", sessionId },
    { request },
  ]),
  then: actions([WorkoutTracking.deleteSession, { sessionId }]),
});

export const DeleteSessionSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/deleteSession" }, { request }],
    [WorkoutTracking.deleteSession, {}, {}],
  ),
  where: async (frames) => {
    // Filter out frames where the action output contains an error
    const filteredFrames = new Frames();
    for (const frame of frames) {
      const actionSymbols = Object.getOwnPropertySymbols(frame).filter(
        s => s.toString().startsWith('Symbol(action_')
      );
      if (actionSymbols.length > 0) {
        const lastActionSymbol = actionSymbols[actionSymbols.length - 1];
        const actionId = frame[lastActionSymbol];
        if (typeof actionId === 'string') {
          const actionRecord = Engine.Action._getById(actionId);
          // Only include frames where the action output doesn't have an error
          if (actionRecord?.output && 'error' in actionRecord.output) {
            continue; // Skip error cases
          }
        }
      }
      filteredFrames.push(frame);
    }
    return filteredFrames;
  },
  then: actions([Requesting.respond, { request, success: true }]),
});

export const DeleteSessionErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/deleteSession" }, { request }],
    [WorkoutTracking.deleteSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * RemoveWorkoutSession - Requires valid user
 */
export const RemoveWorkoutSessionRequest: Sync = ({ request, sessionId, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSession", sessionId, user },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.removeWorkoutSession, { sessionId, user }]),
});

export const RemoveWorkoutSessionResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSession" }, { request }],
    [WorkoutTracking.removeWorkoutSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * RemoveWorkoutSessionDebug - Requires valid user
 */
export const RemoveWorkoutSessionDebugRequest: Sync = ({ request, sessionId, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSessionDebug", sessionId, user },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.removeWorkoutSessionDebug, { sessionId, user }]),
});

export const RemoveWorkoutSessionDebugResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionDebug" }, { request }],
    [WorkoutTracking.removeWorkoutSessionDebug, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * RemoveWorkoutSessionRobust - Requires valid user
 */
export const RemoveWorkoutSessionRobustRequest: Sync = ({ request, sessionId, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/removeWorkoutSessionRobust", sessionId, user },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.removeWorkoutSessionRobust, { sessionId, user }]),
});

export const RemoveWorkoutSessionRobustResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/removeWorkoutSessionRobust" }, { request }],
    [WorkoutTracking.removeWorkoutSessionRobust, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

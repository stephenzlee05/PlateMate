/**
 * ProgressionEngine synchronizations
 * 
 * Handles request/response cycles for ProgressionEngine actions that require authentication.
 */

import { Requesting, ProgressionEngine, UserManagement, Engine } from "@concepts";
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
 * UpdateProgression - Requires valid user
 */
export const UpdateProgressionRequest: Sync = ({ request, user, exercise, newWeight }) => ({
  when: actions([
    Requesting.request,
    { path: "/ProgressionEngine/updateProgression", user, exercise, newWeight },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([ProgressionEngine.updateProgression, { user, exercise, newWeight }]),
});

export const UpdateProgressionSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/updateProgression" }, { request }],
    [ProgressionEngine.updateProgression, {}, {}],
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

export const UpdateProgressionErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/updateProgression" }, { request }],
    [ProgressionEngine.updateProgression, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * CreateProgressionRule - For now, we'll allow authenticated users to create rules
 * In a production system, you might want to restrict this to admins only
 */
export const CreateProgressionRuleRequest: Sync = ({ request, exercise, increment, deloadThreshold, targetSessions }) => ({
  when: actions([
    Requesting.request,
    { path: "/ProgressionEngine/createProgressionRule", exercise, increment, deloadThreshold, targetSessions },
    { request },
  ]),
  // Note: This doesn't require user authentication since progression rules are public/global
  // If you want to require authentication for rule creation, uncomment the where clause below
  // where: async (frames) => {
  //   const userId = frames[0]?.input?.userId;
  //   if (!userId) {
  //     const originalFrame = frames[0];
  //     return new Frames({
  //       ...originalFrame,
  //       error: "User authentication required",
  //     });
  //   }
  //   const userResult = await frames.query(UserManagement.getUser, { userId }, {});
  //   if (userResult.length === 0 || userResult[0]?.output?.error) {
  //     const originalFrame = frames[0];
  //     return new Frames({
  //       ...originalFrame,
  //       error: "User not found",
  //     });
  //   }
  //   return frames;
  // },
  then: actions([ProgressionEngine.createProgressionRule, { exercise, increment, deloadThreshold, targetSessions }]),
});

export const CreateProgressionRuleResponse: Sync = ({ request, ruleId }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/createProgressionRule" }, { request }],
    [ProgressionEngine.createProgressionRule, {}, { ruleId }],
  ),
  then: actions([Requesting.respond, { request, ruleId }]),
});

export const CreateProgressionRuleErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/createProgressionRule" }, { request }],
    [ProgressionEngine.createProgressionRule, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * DeleteProgressionRule - Allows deletion of progression rules
 * In a production system, you might want to restrict this to admins only
 */
export const DeleteProgressionRuleRequest: Sync = ({ request, exercise }) => ({
  when: actions([
    Requesting.request,
    { path: "/ProgressionEngine/deleteProgressionRule", exercise },
    { request },
  ]),
  then: actions([ProgressionEngine.deleteProgressionRule, { exercise }]),
});

export const DeleteProgressionRuleSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/deleteProgressionRule" }, { request }],
    [ProgressionEngine.deleteProgressionRule, {}, {}],
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

export const DeleteProgressionRuleErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ProgressionEngine/deleteProgressionRule" }, { request }],
    [ProgressionEngine.deleteProgressionRule, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

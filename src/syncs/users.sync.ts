/**
 * UserManagement synchronizations
 * 
 * Handles request/response cycles for UserManagement actions that are excluded
 * from passthrough routes and require authentication where appropriate.
 */

import { Requesting, UserManagement, Engine } from "@concepts";
import { actions, Frames, Sync } from "@engine";

/**
 * CreateUser - No authentication required (anyone can create an account)
 */
export const CreateUserRequest: Sync = ({ request, username, email }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserManagement/createUser", username, email },
    { request },
  ]),
  then: actions([UserManagement.createUser, { username, email }]),
});

export const CreateUserResponse: Sync = ({ request, userId }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/createUser" }, { request }],
    [UserManagement.createUser, {}, { userId }],
  ),
  then: actions([Requesting.respond, { request, userId }]),
});

export const CreateUserErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/createUser" }, { request }],
    [UserManagement.createUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * CreateDefaultPreferences - Requires valid user
 */
export const CreateDefaultPreferencesRequest: Sync = ({ request, userId }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserManagement/createDefaultPreferences", userId },
    { request },
  ]),
  where: async (frames) => {
    // Validate user exists
    const originalFrame = frames[0];
    const userIdValue = originalFrame.input.userId;
    
    if (!userIdValue || userIdValue === undefined) {
      return new Frames({
        ...originalFrame,
        error: "User ID is required",
      });
    }
    
    const userResult = await UserManagement.getUser({ userId: userIdValue });
    if ('error' in userResult) {
      // User doesn't exist - return error frame that will be handled by error response sync
      return new Frames({
        ...originalFrame,
        error: userResult.error || "User not found",
      });
    }
    return frames;
  },
  then: actions([UserManagement.createDefaultPreferences, { userId }]),
});

export const CreateDefaultPreferencesResponse: Sync = ({ request, preferencesId }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/createDefaultPreferences" }, { request }],
    [UserManagement.createDefaultPreferences, {}, { preferencesId }],
  ),
  then: actions([Requesting.respond, { request, preferencesId }]),
});

export const CreateDefaultPreferencesErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/createDefaultPreferences" }, { request }],
    [UserManagement.createDefaultPreferences, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * UpdatePreferences - Requires valid user
 */
export const UpdatePreferencesRequest: Sync = ({ request, userId, preferences }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserManagement/updatePreferences", userId, preferences },
    { request },
  ]),
  where: async (frames) => {
    // Validate user exists
    const originalFrame = frames[0];
    const userIdValue = originalFrame.input.userId;
    
    if (!userIdValue || userIdValue === undefined) {
      return new Frames({
        ...originalFrame,
        error: "User ID is required",
      });
    }
    
    const userResult = await UserManagement.getUser({ userId: userIdValue });
    if ('error' in userResult) {
      // User doesn't exist
      return new Frames({
        ...originalFrame,
        error: userResult.error || "User not found",
      });
    }
    return frames;
  },
  then: actions([UserManagement.updatePreferences, { userId, preferences }]),
});

export const UpdatePreferencesSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/updatePreferences" }, { request }],
    [UserManagement.updatePreferences, {}, {}],
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

export const UpdatePreferencesErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/updatePreferences" }, { request }],
    [UserManagement.updatePreferences, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * UpdatePreferencesById - Requires valid preferences (indirectly validates user)
 */
export const UpdatePreferencesByIdRequest: Sync = ({ request, preferencesId, preferences }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserManagement/updatePreferencesById", preferencesId, preferences },
    { request },
  ]),
  then: actions([UserManagement.updatePreferencesById, { preferencesId, preferences }]),
});

export const UpdatePreferencesByIdSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/updatePreferencesById" }, { request }],
    [UserManagement.updatePreferencesById, {}, {}],
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

export const UpdatePreferencesByIdErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/updatePreferencesById" }, { request }],
    [UserManagement.updatePreferencesById, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

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
 * DeleteUser - Requires valid user (user must exist to be deleted)
 * Note: The action itself validates that the user exists, so we can rely on that
 * for authentication. The where clause validation would prevent the action from
 * executing properly when it returns error frames.
 */
export const DeleteUserRequest: Sync = ({ request, userId }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserManagement/deleteUser", userId },
    { request },
  ]),
  then: actions([UserManagement.deleteUser, { userId }]),
});

export const DeleteUserResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/deleteUser" }, { request }],
    [UserManagement.deleteUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteUserSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserManagement/deleteUser" }, { request }],
    [UserManagement.deleteUser, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

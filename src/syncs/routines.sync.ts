/**
 * RoutinePlanner synchronizations
 * 
 * Handles request/response cycles for RoutinePlanner actions that require authentication.
 */

import { Requesting, RoutinePlanner, UserManagement, Engine } from "@concepts";
import { actions, Frames, Sync } from "@engine";
import type { Frame } from "../engine/frames.ts";

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
 * CreateTemplate - Requires valid user
 */
export const CreateTemplateRequest: Sync = ({ request, user, name, exercises }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/createTemplate", user, name, exercises },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([RoutinePlanner.createTemplate, { user, name, exercises }]),
});

export const CreateTemplateSuccessResponse: Sync = ({ request, templateId }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/createTemplate" }, { request }],
    [RoutinePlanner.createTemplate, {}, { templateId }],
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
          // Only include frames where the action output has templateId (success) and no error
          if (actionRecord?.output) {
            if ('error' in actionRecord.output) {
              continue; // Skip error cases
            }
            if ('templateId' in actionRecord.output) {
              filteredFrames.push(frame);
            }
          }
        }
      }
    }
    return filteredFrames;
  },
  then: actions([Requesting.respond, { request, templateId }]),
});

export const CreateTemplateErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/createTemplate" }, { request }],
    [RoutinePlanner.createTemplate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * UpdateVolume - Requires valid user
 */
export const UpdateVolumeRequest: Sync = ({ request, user, exercise, sets, reps, weight, weekStart }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/updateVolume", user, exercise, sets, reps, weight, weekStart },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([RoutinePlanner.updateVolume, { user, exercise, sets, reps, weight, weekStart }]),
});

export const UpdateVolumeSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/updateVolume" }, { request }],
    [RoutinePlanner.updateVolume, {}, {}],
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

export const UpdateVolumeErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/updateVolume" }, { request }],
    [RoutinePlanner.updateVolume, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * SetDefaultTemplate - Requires valid user
 */
export const SetDefaultTemplateRequest: Sync = ({ request, user, templateId }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/setDefaultTemplate", user, templateId },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([RoutinePlanner.setDefaultTemplate, { user, templateId }]),
});

export const SetDefaultTemplateSuccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/setDefaultTemplate" }, { request }],
    [RoutinePlanner.setDefaultTemplate, {}, {}],
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

export const SetDefaultTemplateErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/setDefaultTemplate" }, { request }],
    [RoutinePlanner.setDefaultTemplate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * GetSuggestedWorkout - Requires valid user
 */
export const GetSuggestedWorkoutRequest: Sync = ({ request, user, date }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/getSuggestedWorkout", user, date },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([RoutinePlanner.getSuggestedWorkout, { user, date }]),
});

export const GetSuggestedWorkoutResponse: Sync = ({ request, template }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/getSuggestedWorkout" }, { request }],
    [RoutinePlanner.getSuggestedWorkout, {}, { template }],
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
  then: actions([Requesting.respond, { request, template }]),
});

export const GetSuggestedWorkoutErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/getSuggestedWorkout" }, { request }],
    [RoutinePlanner.getSuggestedWorkout, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * CheckBalance - Requires valid user
 */
export const CheckBalanceRequest: Sync = ({ request, user, weekStart }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/checkBalance", user, weekStart },
    { request },
  ]),
  where: async (frames) => {
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([RoutinePlanner.checkBalance, { user, weekStart }]),
});

export const CheckBalanceResponse: Sync = ({ request, imbalance }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/checkBalance" }, { request }],
    [RoutinePlanner.checkBalance, {}, { imbalance }],
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
  then: actions([Requesting.respond, { request, imbalance }]),
});

export const CheckBalanceErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RoutinePlanner/checkBalance" }, { request }],
    [RoutinePlanner.checkBalance, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * GetUserTemplates - Requires valid user
 * Note: _getUserTemplates is a query, not an action, so we call it directly in the where clause
 */
export const GetUserTemplatesRequest: Sync = ({ request, user, templates }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/_getUserTemplates", user },
    { request },
  ]),
  where: async (frames) => {
    // Get user from the bound symbol (user is bound in the when clause)
    const userId = frames[0]?.[user] as string | undefined;
    if (!userId) {
      // Return empty frames so this handler's then clause doesn't execute
      // Error will be handled by GetUserTemplatesErrorResponse
      return new Frames();
    }
    
    // Validate user first
    const validatedFrames = await validateUser(frames, userId);
    if (validatedFrames.length === 0 || validatedFrames[0]?.error) {
      // Return empty frames so this handler's then clause doesn't execute
      // Error will be handled by GetUserTemplatesErrorResponse
      return new Frames();
    }
    
    // Call the query directly (queries aren't instrumented as actions)
    const templatesResult = await RoutinePlanner._getUserTemplates({ user: userId });
    
    // Add templates to each frame using the symbol binding
    const resultFrames = new Frames();
    for (const frame of validatedFrames) {
      // Create new frame with spread (copies enumerable properties)
      const newFrame: Record<string | symbol, unknown> = { ...frame, [templates]: templatesResult };
      // Copy all symbol properties from original frame (spread doesn't copy symbols)
      // This must be done after the spread to ensure all symbols are preserved
      for (const sym of Object.getOwnPropertySymbols(frame)) {
        newFrame[sym] = frame[sym];
      }
      resultFrames.push(newFrame as Frame);
    }
    return resultFrames;
  },
  then: actions([Requesting.respond, { request, templates }]),
});

export const GetUserTemplatesErrorResponse: Sync = ({ request, error }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/_getUserTemplates" },
    { request },
  ]),
  where: async (frames) => {
    // Get user from the action record's input
    // Find the action symbol to get the action record
    const frame = frames[0];
    if (!frame) return new Frames();
    
    const actionSymbols = Object.getOwnPropertySymbols(frame).filter(
      s => s.toString().startsWith('Symbol(action_')
    );
    
    let userId: string | undefined;
    if (actionSymbols.length > 0) {
      const actionId = frame[actionSymbols[0]] as string | undefined;
      if (typeof actionId === 'string') {
        const actionRecord = Engine.Action._getById(actionId);
        userId = actionRecord?.input?.user as string | undefined;
      }
    }
    
    // Check if user is missing
    if (!userId) {
      // Bind error to symbol
      const errorFrames = new Frames();
      for (const frame of frames) {
        const newFrame: Record<string | symbol, unknown> = { ...frame, [error]: "User ID is required" };
        for (const sym of Object.getOwnPropertySymbols(frame)) {
          newFrame[sym] = frame[sym];
        }
        errorFrames.push(newFrame as Frame);
      }
      return errorFrames;
    }
    
    // Validate user to check for errors
    const validatedFrames = await validateUser(frames, userId);
    
    // Only match frames that have an error property (from validation)
    // If validation succeeded (no error), return empty frames so this handler doesn't match
    const errorFrames = new Frames();
    for (const frame of validatedFrames) {
      if (frame.error) {
        // Create new frame with error bound to symbol
        const newFrame: Record<string | symbol, unknown> = { ...frame, [error]: frame.error };
        // Copy all symbol properties from original frame
        for (const sym of Object.getOwnPropertySymbols(frame)) {
          newFrame[sym] = frame[sym];
        }
        errorFrames.push(newFrame as Frame);
      }
    }
    return errorFrames;
  },
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * GetWeeklyVolume - Requires valid user
 * Note: _getWeeklyVolume is a query, not an action, so we call it directly in the where clause
 */
export const GetWeeklyVolumeRequest: Sync = ({ request, user, weekStart, volumes }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/_getWeeklyVolume", user, weekStart },
    { request },
  ]),
  where: async (frames) => {
    // Get user and weekStart from the bound symbols (bound in the when clause)
    const userId = frames[0]?.[user] as string | undefined;
    const weekStartDate = frames[0]?.[weekStart] as string | undefined;
    
    if (!userId) {
      // Return empty frames so this handler's then clause doesn't execute
      // Error will be handled by GetWeeklyVolumeErrorResponse
      return new Frames();
    }
    
    // Validate user first
    const validatedFrames = await validateUser(frames, userId);
    if (validatedFrames.length === 0 || validatedFrames[0]?.error) {
      // Return empty frames so this handler's then clause doesn't execute
      // Error will be handled by GetWeeklyVolumeErrorResponse
      return new Frames();
    }
    
    // Call the query directly (queries aren't instrumented as actions)
    const volumesResult = await RoutinePlanner._getWeeklyVolume({ user: userId, weekStart: weekStartDate });
    
    // Add volumes to each frame using the symbol binding
    const resultFrames = new Frames();
    for (const frame of validatedFrames) {
      // Create new frame with spread (copies enumerable properties)
      const newFrame: Record<string | symbol, unknown> = { ...frame, [volumes]: volumesResult };
      // Copy all symbol properties from original frame (spread doesn't copy symbols)
      // This must be done after the spread to ensure all symbols are preserved
      for (const sym of Object.getOwnPropertySymbols(frame)) {
        newFrame[sym] = frame[sym];
      }
      resultFrames.push(newFrame as Frame);
    }
    return resultFrames;
  },
  then: actions([Requesting.respond, { request, volumes }]),
});

export const GetWeeklyVolumeErrorResponse: Sync = ({ request, error }) => ({
  when: actions([
    Requesting.request,
    { path: "/RoutinePlanner/_getWeeklyVolume" },
    { request },
  ]),
  where: async (frames) => {
    // Get user from the action record's input
    // Find the action symbol to get the action record
    const frame = frames[0];
    if (!frame) return new Frames();
    
    const actionSymbols = Object.getOwnPropertySymbols(frame).filter(
      s => s.toString().startsWith('Symbol(action_')
    );
    
    let userId: string | undefined;
    if (actionSymbols.length > 0) {
      const actionId = frame[actionSymbols[0]] as string | undefined;
      if (typeof actionId === 'string') {
        const actionRecord = Engine.Action._getById(actionId);
        userId = actionRecord?.input?.user as string | undefined;
      }
    }
    
    // Check if user is missing
    if (!userId) {
      // Bind error to symbol
      const errorFrames = new Frames();
      for (const frame of frames) {
        const newFrame: Record<string | symbol, unknown> = { ...frame, [error]: "User ID is required" };
        for (const sym of Object.getOwnPropertySymbols(frame)) {
          newFrame[sym] = frame[sym];
        }
        errorFrames.push(newFrame as Frame);
      }
      return errorFrames;
    }
    
    // Validate user to check for errors
    const validatedFrames = await validateUser(frames, userId);
    
    // Only match frames that have an error property (from validation)
    // If validation succeeded (no error), return empty frames so this handler doesn't match
    const errorFrames = new Frames();
    for (const frame of validatedFrames) {
      if (frame.error) {
        // Create new frame with error bound to symbol
        const newFrame: Record<string | symbol, unknown> = { ...frame, [error]: frame.error };
        // Copy all symbol properties from original frame
        for (const sym of Object.getOwnPropertySymbols(frame)) {
          newFrame[sym] = frame[sym];
        }
        errorFrames.push(newFrame as Frame);
      }
    }
    return errorFrames;
  },
  then: actions([Requesting.respond, { request, error }]),
});
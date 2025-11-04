# Synchronizations Documentation

This directory contains synchronization files that handle request/response cycles for excluded actions and implement authentication.

## Design Overview

The Requesting concept provides two ways to handle HTTP requests:
1. **Passthrough routes**: Direct access to concept actions (for public queries)
2. **Request actions**: Requests go through `Requesting.request` and require syncs to handle them (for authenticated/monitored actions)

All state-modifying actions are excluded from passthrough and handled via syncs to enable authentication.

## Authentication Strategy

Since there's no Sessioning concept in this codebase, we use a simple authentication approach:

- **User Validation**: Actions that require a user validate that the userId exists in UserManagement
- **Validation Location**: Validation happens in the `where` clause of request syncs
- **Validation Method**: We query `UserManagement.getUser` to verify the user exists

### Actions Requiring Authentication

The following actions require user validation:
- `WorkoutTracking.startSession`, `recordExercise`, `deleteSession`, etc. - require valid user
- `UserManagement.updatePreferences`, `createDefaultPreferences` - require valid user  
- `RoutinePlanner.createTemplate`, `updateVolume`, `setDefaultTemplate` - require valid user
- `ProgressionEngine.updateProgression` - requires valid user

### Actions Not Requiring Authentication

- `UserManagement.createUser` - Anyone can create an account
- `ExerciseCatalog.addExercise` - Public (could be restricted to admins in production)
- `ProgressionEngine.createProgressionRule` - Public (could be restricted to admins in production)

## Sync Structure

Each excluded action has two syncs:

1. **Request Sync**: Catches `Requesting.request`, validates (if needed), and calls the concept action
2. **Response Sync**: Catches the concept action completion and responds via `Requesting.respond`

### Example Pattern

```typescript
// Request sync
export const StartSessionRequest: Sync = ({ request, user, date }) => ({
  when: actions([
    Requesting.request,
    { path: "/WorkoutTracking/startSession", user, date },
    { request },
  ]),
  where: async (frames) => {
    // Validate user exists
    return await validateUser(frames, frames[0]?.input?.user);
  },
  then: actions([WorkoutTracking.startSession, { user, date }]),
});

// Response sync
export const StartSessionResponse: Sync = ({ request, sessionId, name, error }) => ({
  when: actions(
    [Requesting.request, { path: "/WorkoutTracking/startSession" }, { request }],
    [WorkoutTracking.startSession, {}, { sessionId, name, error }],
  ),
  then: actions([Requesting.respond, { request, sessionId, name, error }]),
});
```

## Files

- `users.sync.ts` - UserManagement syncs (createUser, updatePreferences, etc.)
- `workouts.sync.ts` - WorkoutTracking syncs (startSession, recordExercise, deleteSession, etc.)
- `routines.sync.ts` - RoutinePlanner syncs (createTemplate, updateVolume, etc.)
- `progression.sync.ts` - ProgressionEngine syncs (updateProgression, createProgressionRule)
- `exercises.sync.ts` - ExerciseCatalog syncs (addExercise)
- `auth.sync.ts` - Helper syncs for authentication (currently contains ValidateUser helper)

## Path Format

**Important**: The `path` parameter in `Requesting.request` does NOT include the base URL prefix.

- Excluded route: `/api/UserManagement/createUser`
- Path in sync: `/UserManagement/createUser`

## Error Handling

Error handling works as follows:

1. **Validation Errors**: If user validation fails, the concept action may still be called with invalid input, which will return an error that gets passed through the response sync.

2. **Concept Action Errors**: Concept actions validate their inputs and return `{ error: "..." }` on failure. These errors are captured by response syncs and returned to the client.

3. **Timeout Errors**: If no sync responds to a request, it will timeout and return a 504 error.

## Future Improvements

1. **Session Management**: Implement a proper Sessioning concept for more robust authentication
2. **Authorization**: Add role-based access control (e.g., admin-only actions)
3. **Token-Based Auth**: Implement JWT or session tokens instead of passing userId directly
4. **Better Error Handling**: Implement separate error response syncs for validation failures to avoid calling concept actions unnecessarily

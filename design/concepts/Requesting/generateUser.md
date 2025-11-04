[@syncs](syncs.md)
[@architecture](../../background/implementing-synchronizations.md)
[@syncsRead](src/syncs/README.md)
[@api](api-specification.md)

# prompt: Generate src/syncs/users.sync.ts with synchronizations for CreateUserRequest/Response - CreateDefaultPreferencesRequest/Response - UpdatePreferencesRequest/Response - UpdatePreferencesByIdRequest/Response
# response:

```typescript
// src/syncs/users.sync.ts

// These two help you declare synchronizations
import { actions, Frames, Sync } from "@engine";
// Choose whatever concepts you have.
// Assuming concepts for Requesting, User, UserPreferences, and Sessioning exist.
import { Requesting, User, UserPreferences, Sessioning } from "@concepts";

/*
  Concept Assumptions:

  @concepts/requesting.ts
  declare class Requesting {
    // Action: Initiates an external request, can bind `request` symbol.
    static request(path: string, body?: any, pathParams?: Record<string, string>): void; // Output: (request: symbol)
    // Action: Responds to a previous request.
    static respond(request: symbol, data?: any, error?: any): void;
  }

  @concepts/user.ts
  declare class User {
    // Action: Creates a new user, binds `user` symbol on success, `error` on failure.
    static createUser(username: string, email: string, password_hash: string): void; // Output: (user: symbol) OR (error: any)
    // Query: Retrieves user details by user symbol.
    static _getById(user: symbol): void; // Output: (username: string, email: string)
  }

  @concepts/userpreferences.ts
  declare class UserPreferences {
    // Action: Creates default preferences for a user, binds `preferencesId` on success, `error` on failure.
    static createPreferences(user: symbol, preferencesData: any): void; // Output: (preferencesId: symbol) OR (error: any)
    // Action: Updates preferences for a user, binds `preferencesId` on success, `error` on failure.
    static updatePreferences(user: symbol, preferencesData: any): void; // Output: (preferencesId: symbol) OR (error: any)
    // Action: Updates preferences by their ID (e.g., for admin), binds `preferencesId` on success, `error` on failure.
    static updatePreferencesById(preferencesId: symbol, preferencesData: any): void; // Output: (preferencesId: symbol) OR (error: any)
    // Query: Retrieves preferences by user symbol.
    static _getPreferencesByUser(user: symbol): void; // Output: (preferencesId: symbol, preferencesData: any)
    // Query: Retrieves preferences by preferences ID.
    static _getPreferencesById(preferencesId: symbol): void; // Output: (user: symbol, preferencesData: any)
  }

  @concepts/sessioning.ts
  declare class Sessioning {
    // Query: Retrieves the user associated with a session symbol.
    static _getUser(session: symbol): void; // Output: (user: symbol)
  }
*/

/**
 * 1. CreateUserRequest
 * When a request comes in for /users/create, trigger the User.createUser action.
 */
export const CreateUserRequest: Sync = (
  { request, username, email, password },
) => ({
  when: actions([
    Requesting.request,
    { path: "/users/create", body: { username, email, password } },
    { request },
  ]),
  then: actions([User.createUser, { username, email, password }]),
});

/**
 * 2. CreateUserResponse (Success)
 * When a user creation request completes successfully, respond to the original request with the new user's ID.
 */
export const CreateUserResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/users/create" }, { request }],
    [User.createUser, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, data: { user } }]),
});

/**
 * 2.1. CreateUserResponse (Error)
 * When a user creation request fails, respond to the original request with the error.
 */
export const CreateUserResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/users/create" }, { request }],
    [User.createUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * 3. CreateDefaultPreferencesRequest
 * When a new user is created, automatically create a set of default preferences for them.
 * This is an internal synchronization not directly tied to an external request.
 */
export const CreateDefaultPreferencesRequest: Sync = (
  { user, defaultSettings },
) => ({
  when: actions([
    User.createUser,
    {},
    { user }, // Triggered by a new user being created
  ]),
  where: async (frames) => {
    // Define default settings. In a real app, these might come from a config concept.
    return frames.map(($) => ({
      ...$,
      [defaultSettings]: { theme: "light", notifications: true, language: "en" },
    }));
  },
  then: actions([
    UserPreferences.createPreferences,
    { user, preferencesData: defaultSettings },
  ]),
});

/**
 * 4. CreateDefaultPreferencesResponse
 * When default preferences are successfully created for a user.
 * This can be used for internal logging or to trigger other background processes.
 */
export const CreateDefaultPreferencesResponse: Sync = (
  { user, preferencesId },
) => ({
  when: actions([
    UserPreferences.createPreferences,
    { user },
    { preferencesId }, // Get the user from input and preferencesId from output
  ]),
  then: actions(
    // No external response required, but this indicates internal completion.
    // Could trigger a log or analytics event here.
  ),
});

/**
 * 4.1. CreateDefaultPreferencesResponseError
 * When default preferences creation fails.
 */
export const CreateDefaultPreferencesResponseError: Sync = (
  { user, error },
) => ({
  when: actions([
    UserPreferences.createPreferences,
    { user },
    { error },
  ]),
  then: actions(
    // Log the error or trigger an admin notification.
  ),
});

/**
 * 5. UpdatePreferencesRequest
 * When a request comes in for /preferences/update, get the current user from the session,
 * and then update their preferences.
 */
export const UpdatePreferencesRequest: Sync = (
  { request, session, user, preferencesData },
) => ({
  when: actions([
    Requesting.request,
    { path: "/preferences/update", session, body: preferencesData },
    { request },
  ]),
  where: async (frames) => {
    // Query the Sessioning concept to get the 'user' associated with the 'session'.
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    return frames;
  },
  then: actions([UserPreferences.updatePreferences, { user, preferencesData }]),
});

/**
 * 6. UpdatePreferencesResponse (Success)
 * When a preferences update request completes successfully, respond with the updated preferences ID.
 */
export const UpdatePreferencesResponse: Sync = (
  { request, user, preferencesId },
) => ({
  when: actions(
    [Requesting.request, { path: "/preferences/update" }, { request }],
    [UserPreferences.updatePreferences, { user }, { preferencesId }],
  ),
  then: actions([Requesting.respond, { request, data: { preferencesId } }]),
});

/**
 * 6.1. UpdatePreferencesResponse (Error)
 * When a preferences update request fails, respond with the error.
 */
export const UpdatePreferencesResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/preferences/update" }, { request }],
    [UserPreferences.updatePreferences, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * 7. UpdatePreferencesByIdRequest
 * When a request comes in for /preferences/update/:id (e.g., for an admin to update specific preferences by ID),
 * extract the preferencesId from pathParams and update with the preferencesData from the body.
 */
export const UpdatePreferencesByIdRequest: Sync = (
  { request, preferencesId, preferencesData },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/preferences/update/:id",
      pathParams: { id: preferencesId }, // Binds 'id' from path to 'preferencesId' variable
      body: preferencesData,
    },
    { request },
  ]),
  then: actions([
    UserPreferences.updatePreferencesById,
    { preferencesId, preferencesData },
  ]),
});

/**
 * 8. UpdatePreferencesByIdResponse (Success)
 * When an update by preferences ID request completes successfully, respond with the updated preferences ID.
 */
export const UpdatePreferencesByIdResponse: Sync = (
  { request, preferencesId },
) => ({
  when: actions(
    [Requesting.request, { path: "/preferences/update/:id" }, { request }],
    [UserPreferences.updatePreferencesById, { preferencesId }, { preferencesId }],
  ),
  then: actions([Requesting.respond, { request, data: { preferencesId } }]),
});

/**
 * 8.1. UpdatePreferencesByIdResponse (Error)
 * When an update by preferences ID request fails, respond with the error.
 */
export const UpdatePreferencesByIdResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/preferences/update/:id" }, { request }],
    [UserPreferences.updatePreferencesById, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
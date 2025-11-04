/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // ExerciseCatalog - Read-only queries and safe read actions
  "/api/ExerciseCatalog/searchExercises": "public read-only search query",
  "/api/ExerciseCatalog/getExercise": "public read-only query",
  "/api/ExerciseCatalog/recommendExercises": "public read-only recommendation",
  "/api/ExerciseCatalog/getExercisesByMovementPattern": "public read-only query",
  "/api/ExerciseCatalog/_getAllExercises": "public query for all exercises",
  "/api/ExerciseCatalog/_getExercisesByMuscleGroup": "public query by muscle group",
  "/api/ExerciseCatalog/_getExercisesByMovementPattern": "public query by movement pattern",
  "/api/ExerciseCatalog/_getExercisesByEquipment": "public query by equipment",
  
  // ProgressionEngine - Read-only queries and safe read actions
  "/api/ProgressionEngine/suggestWeight": "public read-only weight suggestion",
  "/api/ProgressionEngine/getProgressionRule": "public read-only rule query",
  "/api/ProgressionEngine/_getUserProgression": "public query for user progression",
  "/api/ProgressionEngine/_getAllProgressionRules": "public query for all rules",
  "/api/ProgressionEngine/_getAllUserProgressions": "public query for all progressions",
  
  // RoutinePlanner - Read-only queries and safe read actions
  "/api/RoutinePlanner/getTemplate": "public read-only template query",
  "/api/RoutinePlanner/_getAllTemplates": "public query for all templates",
  
  // UserManagement - Read-only queries and safe read actions
  "/api/UserManagement/getUser": "public read-only user query",
  "/api/UserManagement/getUserPreferencesId": "public read-only preferences ID query",
  "/api/UserManagement/getPreferences": "public read-only preferences query",
  "/api/UserManagement/getPreferencesByUser": "public read-only user preferences query",
  "/api/UserManagement/_getAllUsers": "public query for all users",
  "/api/UserManagement/_getAllPreferences": "public query for all preferences",
  "/api/UserManagement/_getUserPreferences": "public query for user preferences",
  
  // WorkoutTracking - Read-only queries and safe read actions
  "/api/WorkoutTracking/getLastWeight": "public read-only last weight query",
  "/api/WorkoutTracking/getWorkoutHistory": "public read-only workout history query",
  "/api/WorkoutTracking/getSessionInfo": "public read-only session info query",
  "/api/WorkoutTracking/getWeeklyVolume": "public read-only weekly volume query",
  "/api/WorkoutTracking/getSuggestedWorkouts": "public read-only workout suggestions",
  "/api/WorkoutTracking/getSuggestedExercises": "public read-only exercise suggestions",
  "/api/WorkoutTracking/getCompleteWorkoutSuggestions": "public read-only complete suggestions",
  "/api/WorkoutTracking/checkBalance": "public read-only balance check",
  "/api/WorkoutTracking/_getUserSessions": "public query for user sessions",
  "/api/WorkoutTracking/_getSessionRecords": "public query for session records",
  "/api/WorkoutTracking/_getUserRecords": "public query for user records",
  "/api/WorkoutTracking/_getWeeklyVolume": "public query for weekly volume",
  "/api/WorkoutTracking/_getAllWeeklyVolume": "public query for all weekly volume",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // ExerciseCatalog - State-modifying actions
  "/api/ExerciseCatalog/addExercise",
  
  // ProgressionEngine - State-modifying actions
  "/api/ProgressionEngine/updateProgression",
  "/api/ProgressionEngine/createProgressionRule",
  "/api/ProgressionEngine/deleteProgressionRule",
  
  // RoutinePlanner - State-modifying actions and user-specific queries
  "/api/RoutinePlanner/createTemplate",
  "/api/RoutinePlanner/updateVolume",
  "/api/RoutinePlanner/setDefaultTemplate",
  "/api/RoutinePlanner/getSuggestedWorkout",
  "/api/RoutinePlanner/checkBalance",
  "/api/RoutinePlanner/_getUserTemplates",
  "/api/RoutinePlanner/_getWeeklyVolume",
  "/api/RoutinePlanner/getWeekStart", // private helper method
  
  // UserManagement - State-modifying actions
  "/api/UserManagement/createUser",
  "/api/UserManagement/createDefaultPreferences",
  "/api/UserManagement/updatePreferences",
  "/api/UserManagement/updatePreferencesById",
  "/api/UserManagement/deleteUser",
  
  // WorkoutTracking - State-modifying actions
  "/api/WorkoutTracking/startSession",
  "/api/WorkoutTracking/recordExercise",
  "/api/WorkoutTracking/updateVolume",
  "/api/WorkoutTracking/removeWorkoutSession",
  "/api/WorkoutTracking/removeWorkoutSessionDebug",
  "/api/WorkoutTracking/removeWorkoutSessionRobust",
  "/api/WorkoutTracking/deleteSession",
  // WorkoutTracking - Private helper methods
  "/api/WorkoutTracking/getWeekStart", // private helper method
  "/api/WorkoutTracking/generateSessionName", // private helper method
  "/api/WorkoutTracking/analyzeMuscleGroupFrequency", // private helper method
  "/api/WorkoutTracking/getMuscleGroupsForExercise", // private helper method
  "/api/WorkoutTracking/generateWorkoutSuggestions", // private helper method
];

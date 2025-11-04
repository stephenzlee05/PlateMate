/**
 * ExerciseCatalog synchronizations
 * 
 * Handles request/response cycles for ExerciseCatalog actions that are excluded.
 */

import { Requesting, ExerciseCatalog, UserManagement } from "@concepts";
import { actions, Frames, Sync } from "@engine";

/**
 * AddExercise - For now, we'll allow authenticated users to add exercises
 * In a production system, you might want to restrict this to admins only
 */
export const AddExerciseRequest: Sync = ({ request, name, muscleGroups, movementPattern, equipment, instructions }) => ({
  when: actions([
    Requesting.request,
    { path: "/ExerciseCatalog/addExercise", name, muscleGroups, movementPattern, equipment, instructions },
    { request },
  ]),
  // Note: This doesn't require user authentication since exercise catalog is public
  // If you want to require authentication, uncomment the where clause below
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
  then: actions([ExerciseCatalog.addExercise, { name, muscleGroups, movementPattern, equipment, instructions }]),
});

export const AddExerciseResponse: Sync = ({ request, exerciseId }) => ({
  when: actions(
    [Requesting.request, { path: "/ExerciseCatalog/addExercise" }, { request }],
    [ExerciseCatalog.addExercise, {}, { exerciseId }],
  ),
  then: actions([Requesting.respond, { request, exerciseId }]),
});

export const AddExerciseErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ExerciseCatalog/addExercise" }, { request }],
    [ExerciseCatalog.addExercise, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

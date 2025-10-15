---
timestamp: 'Sun Oct 12 2025 20:06:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_200635.0e837a88.md]]'
content_id: e69ac520873d4ff5678a089fabc8961ca3138820ff2624a80cc2244674d1ca2b
---

# response:

```typescript
// file: src/concepts/RoutinePlannerConcept.test.ts

import { assertEquals, assertExists, assertObjectMatch } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import RoutinePlannerConcept from "./RoutinePlannerConcept.ts";

// Helper for consistency in week start dates for testing.
// This mirrors the private getWeekStart method in the concept.
function getTestWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC
  const dayOfWeek = d.getUTCDay(); // 0 for Sunday, 1 for Monday
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
  d.setUTCDate(diff);
  return d;
}

// Mock Exercise data for testing.
// These are examples and should match the structure expected by the concept.
const mockExercise1 = { exerciseId: "ex1" as ID, name: "Bench Press", muscleGroups: ["chest", "triceps"] as ID[] };
const mockExercise2 = { exerciseId: "ex2" as ID, name: "Squat", muscleGroups: ["quads", "glutes", "hamstrings"] as ID[] };
const mockExercise3 = { exerciseId: "ex3" as ID, name: "Overhead Press", muscleGroups: ["shoulders", "triceps"] as ID[] };
const mockExercise4 = { exerciseId: "ex4" as ID, name: "Deadlift", muscleGroups: ["back", "glutes", "hamstrings"] as ID[] };
const mockExercise5 = { exerciseId: "ex5" as ID, name: "Bicep Curl", muscleGroups: ["biceps"] as ID[] };
const mockExercise6 = { exerciseId: "ex6" as ID, name: "Plank", muscleGroups: ["core"] as ID[] };


Deno.test("RoutinePlannerConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new RoutinePlannerConcept(db);

  const testUser = "user:testUser" as ID;
  const anotherUser = "user:anotherUser" as ID;
  const today = new Date();
  const thisWeekStart = getTestWeekStart(today);

  await t.step("createTemplate - successfully creates a new workout template", async () => {
    console.log("\n--- Testing createTemplate ---");
    const templateName = "Full Body Workout A";
    const exercises = [mockExercise1, mockExercise2];
    const result = await concept.createTemplate({ user: testUser, name: templateName, exercises });

    assertEquals(Object.keys(result).includes("templateId"), true, "Should return a templateId");
    assertExists((result as { templateId: ID }).templateId, "templateId should not be null");

    const createdTemplate = await db.collection("RoutinePlanner.workoutTemplates").findOne({ _id: (result as { templateId: ID }).templateId });
    assertExists(createdTemplate, "Template should be found in the database");
    assertEquals(createdTemplate.name, templateName, "Template name should match");
    assertEquals(createdTemplate.exercises.length, exercises.length, "Exercises count should match");
    assertEquals(createdTemplate.muscleGroups.sort(), ["chest", "glutes", "hamstrings", "quads", "triceps"].sort(), "Muscle groups should be correctly extracted");
    console.log(`Trace: Created template: "${templateName}" (ID: ${(result as { templateId: ID }).templateId}) with muscles: ${createdTemplate.muscleGroups.join(", ")}`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: New template created in state, templateId returned.");
  });

  await t.step("createTemplate - fails with missing user/name/exercises (requirements not met)", async () => {
    console.log("\n--- Testing createTemplate failures ---");
    const exercises = [mockExercise1];

    const res1 = await concept.createTemplate({ user: null!, name: "Bad Template", exercises });
    assertObjectMatch(res1, { error: "User must be provided" }, "Should fail if user is null");
    console.log("Trace: Failed as expected for missing user.");

    const res2 = await concept.createTemplate({ user: testUser, name: "", exercises });
    assertObjectMatch(res2, { error: "Template name must be provided" }, "Should fail if name is empty");
    console.log("Trace: Failed as expected for empty name.");

    const res3 = await concept.createTemplate({ user: testUser, name: "No Exercises", exercises: [] });
    assertObjectMatch(res3, { error: "Exercises list cannot be empty" }, "Should fail if exercises list is empty");
    console.log("Trace: Failed as expected for empty exercises list.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });

  await t.step("createTemplate - fails with duplicate template name (requirement not met)", async () => {
    const templateName = "Unique Workout C";
    await concept.createTemplate({ user: testUser, name: templateName, exercises: [mockExercise1] });
    console.log(`Trace: Created template "${templateName}" once.`);

    const result = await concept.createTemplate({ user: testUser, name: templateName, exercises: [mockExercise2] });
    assertObjectMatch(result, { error: `Template with name '${templateName}' already exists` }, "Should fail if template name already exists");
    console.log(`Trace: Failed as expected for duplicate template name "${templateName}".`);
    console.log("Requirement met: Action prevents creation of duplicate templates by name.");
  });

  let templateIdA: ID, templateIdB: ID, templateIdC: ID, templateIdD: ID, templateIdE: ID;

  await t.step("setup initial templates for further tests", async () => {
    const resA = await concept.createTemplate({ user: testUser, name: "Chest & Triceps", exercises: [mockExercise1, mockExercise3] });
    templateIdA = (resA as { templateId: ID }).templateId;
    console.log(`Trace: Created template A (Chest & Triceps): ${templateIdA}`);

    const resB = await concept.createTemplate({ user: testUser, name: "Legs & Back", exercises: [mockExercise2, mockExercise4] });
    templateIdB = (resB as { templateId: ID }).templateId;
    console.log(`Trace: Created template B (Legs & Back): ${templateIdB}`);

    const resC = await concept.createTemplate({ user: testUser, name: "Arms Day", exercises: [mockExercise5, mockExercise6] });
    templateIdC = (resC as { templateId: ID }).templateId;
    console.log(`Trace: Created template C (Arms Day): ${templateIdC}`);

    const resD = await concept.createTemplate({ user: anotherUser, name: "Another User's Template", exercises: [mockExercise1] });
    templateIdD = (resD as { templateId: ID }).templateId;
    console.log(`Trace: Created template D (Another User's): ${templateIdD}`);

    const resE = await concept.createTemplate({ user: testUser, name: "Shoulders and Biceps", exercises: [mockExercise3, mockExercise5] });
    templateIdE = (resE as { templateId: ID }).templateId;
    console.log(`Trace: Created template E (Shoulders and Biceps): ${templateIdE}`);
    console.log("Effect confirmed: Multiple templates created for different test scenarios.");
  });

  await t.step("getTemplate - successfully retrieves template details", async () => {
    console.log("\n--- Testing getTemplate ---");
    const result = await concept.getTemplate({ templateId: templateIdA });
    assertExists(result, "Template should be found");
    assertEquals(result?.name, "Chest & Triceps", "Template name should match");
    assertEquals(result?.exercises.length, 2, "Template should have 2 exercises");
    console.log(`Trace: Retrieved template ${templateIdA}: ${result?.name}`);
    console.log("Requirement met: Valid template ID provided.");
    console.log("Effect confirmed: Correct template details returned.");
  });

  await t.step("getTemplate - returns null for non-existent template", async () => {
    const result = await concept.getTemplate({ templateId: "nonExistent" as ID });
    assertEquals(result, null, "Should return null for a non-existent template");
    console.log("Trace: Returned null as expected for non-existent template.");
    console.log("Requirement met: Action handles non-existent template IDs gracefully.");
  });

  await t.step("getTemplate - fails with missing templateId (requirement not met)", async () => {
    const res = await concept.getTemplate({ templateId: null! });
    assertObjectMatch(res, { error: "Template ID must be provided" }, "Should fail if templateId is null");
    console.log("Trace: Failed as expected for missing templateId.");
    console.log("Requirement met: Action returns error when template ID is null.");
  });

  await t.step("setDefaultTemplate - successfully sets a default template for a user", async () => {
    console.log("\n--- Testing setDefaultTemplate ---");
    const result = await concept.setDefaultTemplate({ user: testUser, templateId: templateIdA });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const defaultTemplate = await db.collection("RoutinePlanner.userTemplates").findOne({ user: testUser, templateId: templateIdA, isDefault: true });
    assertExists(defaultTemplate, "Template A should be set as default");
    console.log(`Trace: Template ${templateIdA} set as default for ${testUser}`);
    console.log("Requirement met: Valid user and existing template ID provided.");
    console.log("Effect confirmed: UserTemplates state updated for default template.");
  });

  await t.step("setDefaultTemplate - changes default template and unsets previous", async () => {
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdB });
    console.log(`Trace: Template ${templateIdB} set as new default for ${testUser}`);

    const oldDefault = await db.collection("RoutinePlanner.userTemplates").findOne({ user: testUser, templateId: templateIdA, isDefault: true });
    assertEquals(oldDefault, null, "Old default template A should no longer be default");

    const newDefault = await db.collection("RoutinePlanner.userTemplates").findOne({ user: testUser, templateId: templateIdB, isDefault: true });
    assertExists(newDefault, "New default template B should be default");
    console.log("Trace: Previous default unset, new default set.");
    console.log("Requirement met: Valid user and existing template ID provided.");
    console.log("Effect confirmed: Old default removed, new default set in UserTemplates.");
  });

  await t.step("setDefaultTemplate - fails for non-existent templateId (requirement not met)", async () => {
    const result = await concept.setDefaultTemplate({ user: testUser, templateId: "nonExistent" as ID });
    assertObjectMatch(result, { error: "Template with ID 'nonExistent' does not exist" }, "Should fail if template does not exist");
    console.log("Trace: Failed as expected for non-existent template.");
    console.log("Requirement met: Action prevents setting non-existent templates as default.");
  });

  await t.step("setDefaultTemplate - fails with missing user/templateId (requirements not met)", async () => {
    const res1 = await concept.setDefaultTemplate({ user: null!, templateId: templateIdA });
    assertObjectMatch(res1, { error: "User must be provided" }, "Should fail if user is null");

    const res2 = await concept.setDefaultTemplate({ user: testUser, templateId: null! });
    assertObjectMatch(res2, { error: "Template ID must be provided" }, "Should fail if templateId is null");
    console.log("Trace: Failed as expected for missing user/templateId.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });

  await t.step("updateVolume - successfully adds new volume entry for muscle groups", async () => {
    console.log("\n--- Testing updateVolume ---");
    const exercise = mockExercise1; // chest, triceps
    const sets = 3, reps = 10, weight = 100;
    const expectedVolume = sets * reps * weight;

    const result = await concept.updateVolume({ user: testUser, exercise, sets, reps, weight });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const chestVolume = await db.collection("RoutinePlanner.weeklyVolume").findOne({ user: testUser, muscleGroup: "chest" as ID, weekStart: thisWeekStart });
    assertExists(chestVolume, "Chest volume entry should exist");
    assertEquals(chestVolume.volume, expectedVolume, "Chest volume should match");

    const tricepsVolume = await db.collection("RoutinePlanner.weeklyVolume").findOne({ user: testUser, muscleGroup: "triceps" as ID, weekStart: thisWeekStart });
    assertExists(tricepsVolume, "Triceps volume entry should exist");
    assertEquals(tricepsVolume.volume, expectedVolume, "Triceps volume should match");
    console.log(`Trace: Updated volume for chest and triceps to ${expectedVolume} for ${testUser}.`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: New WeeklyVolume entries created for relevant muscle groups.");
  });

  await t.step("updateVolume - increments existing volume for muscle groups", async () => {
    const exercise = mockExercise3; // shoulders, triceps
    const sets = 4, reps = 8, weight = 50;
    const additionalVolume = sets * reps * weight; // 1600

    const result = await concept.updateVolume({ user: testUser, exercise, sets, reps, weight });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const shouldersVolume = await db.collection("RoutinePlanner.weeklyVolume").findOne({ user: testUser, muscleGroup: "shoulders" as ID, weekStart: thisWeekStart });
    assertExists(shouldersVolume, "Shoulders volume entry should exist");
    assertEquals(shouldersVolume.volume, additionalVolume, "Shoulders volume should be the new volume");
    console.log(`Trace: Updated volume for shoulders to ${additionalVolume}.`);


    // Triceps already had 3000 from mockExercise1. Now adds 1600. Total = 4600.
    const tricepsVolume = await db.collection("RoutinePlanner.weeklyVolume").findOne({ user: testUser, muscleGroup: "triceps" as ID, weekStart: thisWeekStart });
    assertExists(tricepsVolume, "Triceps volume entry should still exist");
    assertEquals(tricepsVolume.volume, (3 * 10 * 100) + additionalVolume, "Triceps volume should be incremented");
    console.log(`Trace: Triceps volume incremented to ${tricepsVolume.volume}.`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Existing WeeklyVolume entries incremented for relevant muscle groups.");
  });

  await t.step("updateVolume - fails with missing user/exercise/muscleGroups (requirements not met)", async () => {
    console.log("\n--- Testing updateVolume failures ---");
    const incompleteExercise = { exerciseId: "exTest" as ID, name: "Test", muscleGroups: [] as ID[] }; // Missing muscle groups

    const res1 = await concept.updateVolume({ user: null!, exercise: mockExercise1, sets: 1, reps: 1, weight: 1 });
    assertObjectMatch(res1, { error: "User must be provided" }, "Should fail if user is null");

    const res2 = await concept.updateVolume({ user: testUser, exercise: null!, sets: 1, reps: 1, weight: 1 });
    assertObjectMatch(res2, { error: "Exercise must be provided and contain muscle groups" }, "Should fail if exercise is null");

    const res3 = await concept.updateVolume({ user: testUser, exercise: incompleteExercise, sets: 1, reps: 1, weight: 1 });
    assertObjectMatch(res3, { error: "Exercise must be provided and contain muscle groups" }, "Should fail if exercise has no muscle groups");
    console.log("Trace: Failed as expected for missing user/exercise/muscleGroups.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });

  await t.step("updateVolume - fails with non-positive sets/reps/weight (requirements not met)", async () => {
    const exercise = mockExercise1;
    const res1 = await concept.updateVolume({ user: testUser, exercise, sets: 0, reps: 1, weight: 1 });
    assertObjectMatch(res1, { error: "Sets, reps, and weight must be positive numbers" }, "Should fail if sets is zero");

    const res2 = await concept.updateVolume({ user: testUser, exercise, sets: 1, reps: -1, weight: 1 });
    assertObjectMatch(res2, { error: "Sets, reps, and weight must be positive numbers" }, "Should fail if reps is negative");
    console.log("Trace: Failed as expected for non-positive sets/reps/weight.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });


  await t.step("checkBalance - returns empty array if no volume data exists", async () => {
    console.log("\n--- Testing checkBalance ---");
    const pastWeekStart = getTestWeekStart(new Date("2023-01-01")); // Use a week without data
    const result = await concept.checkBalance({ user: anotherUser, weekStart: pastWeekStart });
    assertObjectMatch(result, { imbalancedGroups: [] }, "Should return empty array for user with no volume data");
    console.log("Trace: No volume data for anotherUser in past week, returned empty imbalanced groups.");
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Returns empty list if no volume entries.");
  });

  await t.step("checkBalance - returns imbalanced groups correctly", async () => {
    // Reset volume data for testUser to control the scenario
    await db.collection("RoutinePlanner.weeklyVolume").deleteMany({ user: testUser });
    console.log("Trace: Resetting volume for testUser.");

    // Simulate volumes:
    // Chest: 1000 (from bench)
    // Triceps: 1000 (from bench)
    // Shoulders: 500 (from overhead press)
    // Quads: 3000 (from squat)
    // Biceps: 100 (from curls)
    // Glutes: 3000 (from squat, deadlift)
    // Hamstrings: 3000 (from squat, deadlift)
    await concept.updateVolume({ user: testUser, exercise: mockExercise1, sets: 2, reps: 5, weight: 100 }); // Chest, Triceps: 1000
    await concept.updateVolume({ user: testUser, exercise: mockExercise3, sets: 1, reps: 10, weight: 50 }); // Shoulders, Triceps: 500 (Triceps total: 1500)
    await concept.updateVolume({ user: testUser, exercise: mockExercise2, sets: 3, reps: 10, weight: 100 }); // Quads, Glutes, Hamstrings: 3000
    await concept.updateVolume({ user: testUser, exercise: mockExercise5, sets: 1, reps: 10, weight: 10 }); // Biceps: 100
    console.log("Trace: Simulated workouts to create imbalance.");

    const result = await concept.checkBalance({ user: testUser, weekStart: thisWeekStart });
    console.log("Trace: Checking balance after simulated workouts.");

    // Expected volumes in state:
    // chest: 1000
    // triceps: 1500
    // shoulders: 500
    // quads: 3000
    // glutes: 3000
    // hamstrings: 3000
    // biceps: 100

    // Total volume: 1000+1500+500+3000+3000+3000+100 = 12100
    // Number of muscle groups with entries: 7
    // Average volume: 12100 / 7 = ~1728.57
    // Imbalance threshold (0.5 * avg): ~864.28

    // Expected imbalanced: shoulders (500), biceps (100)
    assertObjectMatch(result, { imbalancedGroups: ["shoulders", "biceps"].sort() }, "Should identify shoulders and biceps as imbalanced");
    console.log(`Trace: Identified imbalanced groups: ${result.imbalancedGroups.join(", ")}. Expected: shoulders, biceps.`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Correct list of imbalanced muscle groups returned based on volume.");
  });

  await t.step("checkBalance - returns empty array if all groups are balanced", async () => {
    await db.collection("RoutinePlanner.weeklyVolume").deleteMany({ user: testUser }); // Clear previous data
    console.log("Trace: Resetting volume for testUser for balanced test.");

    await concept.updateVolume({ user: testUser, exercise: mockExercise1, sets: 1, reps: 10, weight: 100 }); // Chest, Triceps: 1000
    await concept.updateVolume({ user: testUser, exercise: mockExercise2, sets: 1, reps: 10, weight: 100 }); // Quads, Glutes, Hamstrings: 1000
    await concept.updateVolume({ user: testUser, exercise: { ...mockExercise3, muscleGroups: ["shoulders"] as ID[] }, sets: 1, reps: 10, weight: 100 }); // Shoulders: 1000
    await concept.updateVolume({ user: testUser, exercise: mockExercise5, sets: 1, reps: 10, weight: 100 }); // Biceps: 1000

    const result = await concept.checkBalance({ user: testUser, weekStart: thisWeekStart });
    assertObjectMatch(result, { imbalancedGroups: [] }, "Should return empty array if all groups are balanced");
    console.log("Trace: All groups balanced, returned empty imbalanced groups.");
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Returns empty list if all volume entries are balanced.");
  });

  await t.step("checkBalance - fails with missing user/weekStart (requirements not met)", async () => {
    const res1 = await concept.checkBalance({ user: null!, weekStart: thisWeekStart });
    assertObjectMatch(res1, { error: "User must be provided" }, "Should fail if user is null");

    const res2 = await concept.checkBalance({ user: testUser, weekStart: null! });
    assertObjectMatch(res2, { error: "Week start date must be provided" }, "Should fail if weekStart is null");
    console.log("Trace: Failed as expected for missing user/weekStart.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });

  await t.step("getSuggestedWorkout - returns null if no user templates and no volume history", async () => {
    // Ensure anotherUser has no templates or volume
    await db.collection("RoutinePlanner.userTemplates").deleteMany({ user: anotherUser });
    await db.collection("RoutinePlanner.weeklyVolume").deleteMany({ user: anotherUser });
    console.log("Trace: Ensuring anotherUser has no templates or volume for this test.");

    const result = await concept.getSuggestedWorkout({ user: anotherUser, date: today });
    assertEquals(result, null, "Should return null for a user with no templates and no volume history");
    console.log("Trace: Returned null as expected for no templates/history.");
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Returns null if no basis for suggestion.");
  });

  await t.step("getSuggestedWorkout - returns default template if set, even with no strong imbalance", async () => {
    // Set a default template for testUser
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdA });
    console.log(`Trace: Set ${templateIdA} as default for ${testUser}`);

    // And make sure there's some volume so it doesn't fall into the "no history" path
    await concept.updateVolume({ user: testUser, exercise: mockExercise1, sets: 1, reps: 1, weight: 1 });

    const result = await concept.getSuggestedWorkout({ user: testUser, date: today });
    assertObjectMatch(result!, { templateId: templateIdA }, "Should suggest the default template");
    console.log(`Trace: Suggested default template: ${templateIdA}`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Default template suggested when no stronger imbalance-based suggestion.");
  });

  await t.step("getSuggestedWorkout - returns a template targeting an imbalanced muscle group", async () => {
    // Clear previous defaults for testUser to control the scenario
    await db.collection("RoutinePlanner.userTemplates").updateMany({ user: testUser }, { $set: { isDefault: false } });
    console.log("Trace: Unsetting default templates for testUser for imbalance test.");
    // Clear current volume to set up a specific imbalance
    await db.collection("RoutinePlanner.weeklyVolume").deleteMany({ user: testUser });

    // Ensure user has access to all relevant templates for suggestion logic
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdA }); // Chest, Triceps, Shoulders
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdB }); // Quads, Glutes, Hamstrings, Back
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdC }); // Biceps, Core
    await concept.setDefaultTemplate({ user: testUser, templateId: templateIdE }); // Shoulders, Biceps
    console.log(`Trace: Associated templates A, B, C, E with ${testUser}.`);

    // Create an imbalance: Heavy chest/triceps and legs/back, but no shoulders/biceps/core
    await concept.updateVolume({ user: testUser, exercise: mockExercise1, sets: 5, reps: 10, weight: 100 }); // Chest, Triceps: 5000
    await concept.updateVolume({ user: testUser, exercise: mockExercise2, sets: 5, reps: 10, weight: 100 }); // Quads, Glutes, Hamstrings: 5000
    console.log("Trace: Simulated heavy chest/triceps and legs/back volume.");

    const result = await concept.getSuggestedWorkout({ user: testUser, date: today });
    assertExists(result, "A workout should be suggested");

    const suggestedTemplateId = (result as { templateId: ID }).templateId;
    const suggestedTemplate = await concept.getTemplate({ templateId: suggestedTemplateId });
    console.log(`Trace: Suggested template ID: ${suggestedTemplateId}. Muscle groups: ${suggestedTemplate?.muscleGroups.join(", ")}`);

    // Based on the imbalance (low shoulders, biceps, core) and available templates:
    // Template E targets shoulders, biceps.
    // Template C targets biceps, core.
    // The current logic in `getSuggestedWorkout` finds the lowest volume groups and then the first template that targets any of them.
    // Assuming biceps and core are the lowest (since they have 0 volume), and template C (Biceps, Core) is found first.
    assertEquals(suggestedTemplateId, templateIdC, "Should suggest Template C as it targets biceps and core (imbalanced)");
    console.log(`Trace: Correctly suggested template ${templateIdC} which targets biceps and core, addressing the imbalance.`);
    console.log("Requirement met: Valid inputs provided.");
    console.log("Effect confirmed: Suggests a template that targets imbalanced muscle groups.");
  });

  await t.step("getSuggestedWorkout - fails with missing user/date (requirements not met)", async () => {
    const res1 = await concept.getSuggestedWorkout({ user: null!, date: today });
    assertObjectMatch(res1, { error: "User must be provided" }, "Should fail if user is null");

    const res2 = await concept.getSuggestedWorkout({ user: testUser, date: null! });
    assertObjectMatch(res2, { error: "Date must be provided" }, "Should fail if date is null");
    console.log("Trace: Failed as expected for missing user/date.");
    console.log("Requirement met: Action returns error when preconditions are not met.");
  });

  await t.step("Principle Trace: ensure balanced training across muscle groups and movement patterns", async () => {
    console.log("\n--- Principle Trace ---");
    console.log("Goal: Simulate a user's workout week to demonstrate how the concept balances training.");

    const principleUser = "user:principleUser" as ID;
    const principleToday = new Date("2024-03-10T12:00:00Z"); // Fixed date for consistent weekStart
    const principleWeekStart = getTestWeekStart(principleToday);

    // Ensure principleUser starts fresh
    await db.collection("RoutinePlanner.workoutTemplates").deleteMany({ user: principleUser });
    await db.collection("RoutinePlanner.userTemplates").deleteMany({ user: principleUser });
    await db.collection("RoutinePlanner.weeklyVolume").deleteMany({ user: principleUser });

    // 1. Create a few workout templates targeting different muscle groups.
    const resT1 = await concept.createTemplate({ user: principleUser, name: "Upper Body", exercises: [mockExercise1, mockExercise3] }); // Chest, Triceps, Shoulders
    const t1Id = (resT1 as { templateId: ID }).templateId;
    console.log(`1. Created Upper Body template (ID: ${t1Id}) targeting Chest, Triceps, Shoulders.`);
    await concept.setDefaultTemplate({ user: principleUser, templateId: t1Id }); // Make it accessible for suggestion

    const resT2 = await concept.createTemplate({ user: principleUser, name: "Lower Body", exercises: [mockExercise2, mockExercise4] }); // Quads, Glutes, Hamstrings, Back
    const t2Id = (resT2 as { templateId: ID }).templateId;
    console.log(`   Created Lower Body template (ID: ${t2Id}) targeting Quads, Glutes, Hamstrings, Back.`);
    await concept.setDefaultTemplate({ user: principleUser, templateId: t2Id }); // Make it accessible

    const resT3 = await concept.createTemplate({ user: principleUser, name: "Arms & Core", exercises: [mockExercise5, mockExercise6] }); // Biceps, Core
    const t3Id = (resT3 as { templateId: ID }).templateId;
    console.log(`   Created Arms & Core template (ID: ${t3Id}) targeting Biceps, Core.`);
    await concept.setDefaultTemplate({ user: principleUser, templateId: t3Id }); // Make it accessible

    // 2. Simulate some updateVolume calls for the user, intentionally making one muscle group low.
    console("\n2. Simulating workouts:");
    // Day 1: Heavy Upper Body (leaving biceps/core untouched)
    await concept.updateVolume({ user: principleUser, exercise: mockExercise1, sets: 5, reps: 10, weight: 100 }); // Chest, Triceps: 5000
    await concept.updateVolume({ user: principleUser, exercise: mockExercise3, sets: 4, reps: 8, weight: 60 }); // Shoulders, Triceps: 1920
    console.log(`   Workout 1 (Upper Body) completed on ${principleToday.toLocaleDateString()}`);

    // Day 3: Heavy Lower Body (leaving biceps/core untouched)
    const day3 = new Date(principleToday);
    day3.setDate(principleToday.getDate() + 2);
    await concept.updateVolume({ user: principleUser, exercise: mockExercise2, sets: 5, reps: 10, weight: 150 }); // Quads, Glutes, Hamstrings: 7500
    await concept.updateVolume({ user: principleUser, exercise: mockExercise4, sets: 3, reps: 8, weight: 120 }); // Back, Glutes, Hamstrings: 2880
    console.log(`   Workout 2 (Lower Body) completed on ${day3.toLocaleDateString()}`);

    // Current volumes (approx - raw numbers in store will be exact):
    // Chest: 5000
    // Triceps: 5000 (from ex1) + 1920 (from ex3) = 6920
    // Shoulders: 1920
    // Quads: 7500
    // Glutes: 7500 (from ex2) + 2880 (from ex4) = 10380
    // Hamstrings: 7500 (from ex2) + 2880 (from ex4) = 10380
    // Back: 2880
    // Biceps: 0 (very low)
    // Core: 0 (very low)

    // 3. Call checkBalance to identify the imbalanced groups.
    console("\n3. Checking for imbalances:");
    const balanceResult = await concept.checkBalance({ user: principleUser, weekStart: principleWeekStart });
    assertEquals(balanceResult.imbalancedGroups.sort(), ["biceps", "core"].sort(), "Biceps and Core should be identified as imbalanced");
    console.log(`   Identified imbalanced groups: ${balanceResult.imbalancedGroups.join(", ")}.`);

    // 4. Call getSuggestedWorkout to see if it suggests a template that targets one of those imbalanced groups.
    console("\n4. Getting workout suggestion for the next day:");
    const nextDay = new Date(principleToday);
    nextDay.setDate(principleToday.getDate() + 3); // Simulate next workout day
    const suggestionResult = await concept.getSuggestedWorkout({ user: principleUser, date: nextDay });

    assertExists(suggestionResult, "A workout should be suggested");
    const suggestedTemplateId = (suggestionResult as { templateId: ID }).templateId;
    const suggestedTemplate = await concept.getTemplate({ templateId: suggestedTemplateId });

    assertEquals(suggestedTemplateId, t3Id, "The 'Arms & Core' template should be suggested to balance biceps and core.");
    console.log(`   Suggested template: '${suggestedTemplate?.name}' (ID: ${suggestedTemplateId}).`);
    console.log(`   This template targets: ${suggestedTemplate?.muscleGroups.join(", ")}. This aligns with identified imbalanced groups.`);
    console.log("\nPrinciple demonstrated: The system successfully identified imbalanced muscle groups and suggested a workout to address them, promoting balanced training.");
  });

  await client.close();
});
```

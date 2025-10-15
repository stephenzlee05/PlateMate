---
timestamp: 'Sun Oct 12 2025 19:55:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_195558.7ef92437.md]]'
content_id: 02bec4ad7b52a2fae5aaabf32b81bdb0dde22d93f6d8a9f776f078e24a9dcdac
---

# file: src/concepts/ProgressionEngineConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertObjectMatch } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import ProgressionEngineConcept from "./ProgressionEngineConcept.ts";

Deno.test("ProgressionEngine Concept - Principle: Progressive overload through systematic weight increases", async (t) => {
  const [db, client] = await testDb();
  const concept = new ProgressionEngineConcept(db);

  const userA = freshID() as ID;
  const squatExercise = freshID() as ID;

  // Initial state: No rules, no user progressions.

  console.log("\n--- Principle Trace: Progressive Overload ---");

  // Step 1: Create a progression rule
  console.log("\n1. Setting up a progression rule for Squat.");
  const createRuleResult = await concept.createProgressionRule({
    exercise: squatExercise,
    increment: 5,
    deloadThreshold: 3, // If reps drop to 3 or below, deload
    targetSessions: 2, // Need 2 successful sessions before incrementing
  });
  assertNotEquals((createRuleResult as { error: string }).error, undefined, "Should successfully create rule");
  console.log("   Rule created.");

  // Step 2: User performs first session (good performance)
  console.log("\n2. User performs first session: 100kg, 3 sets of 5 reps (good performance).");
  const suggest1 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100,
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest1)}`);
  assertObjectMatch(suggest1, { newWeight: 100, action: "maintain" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest1.newWeight as number });
  const userProgression1 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression1?.currentWeight, 100);
  assertEquals(userProgression1?.sessionsAtWeight, 1);
  console.log(`   User progression state: ${JSON.stringify(userProgression1)}`);

  // Step 3: User performs second session (good performance) - should maintain, as targetSessions is 2
  console.log("\n3. User performs second session: 100kg, 3 sets of 5 reps (good performance).");
  const suggest2 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100, // Still based on last session's actual weight
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest2)}`);
  assertObjectMatch(suggest2, { newWeight: 100, action: "maintain" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest2.newWeight as number });
  const userProgression2 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression2?.currentWeight, 100);
  assertEquals(userProgression2?.sessionsAtWeight, 2);
  console.log(`   User progression state: ${JSON.stringify(userProgression2)}`);

  // Step 4: User performs third session (good performance) - should increase, as targetSessions met
  console.log("\n4. User performs third session: 100kg, 3 sets of 5 reps (good performance). Target sessions met.");
  const suggest3 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100, // Still based on last session's actual weight
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest3)}`);
  assertObjectMatch(suggest3, { newWeight: 105, action: "increase" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest3.newWeight as number });
  const userProgression3 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression3?.currentWeight, 105);
  assertEquals(userProgression3?.sessionsAtWeight, 1); // Sessions reset for new weight
  console.log(`   User progression state: ${JSON.stringify(userProgression3)}`);

  // Step 5: User performs fourth session (poor performance) - should deload
  console.log("\n5. User performs fourth session: 105kg, 3 sets of 2 reps (poor performance, below deload threshold).");
  const suggest4 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 105,
    lastSets: 3,
    lastReps: 2, // Below deloadThreshold of 3
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest4)}`);
  assertObjectMatch(suggest4, { newWeight: 100, action: "deload" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest4.newWeight as number });
  const userProgression4 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression4?.currentWeight, 100);
  assertEquals(userProgression4?.sessionsAtWeight, 1); // Sessions reset for new weight
  console.log(`   User progression state: ${JSON.stringify(userProgression4)}`);

  console.log("\n   Principle of progressive overload (increase) and systematic deloads demonstrated.");
  await client.close();
});

Deno.test("ProgressionEngine Concept - Action Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new ProgressionEngineConcept(db);

  const userB = freshID() as ID;
  const benchExercise = freshID() as ID;
  const deadliftExercise = freshID() as ID;

  // --- Test createProgressionRule ---
  await t.step("createProgressionRule: Successfully create a rule", async () => {
    console.log("\nTest: createProgressionRule - success");
    const result = await concept.createProgressionRule({
      exercise: benchExercise,
      increment: 2.5,
      deloadThreshold: 2,
      targetSessions: 3,
    });
    assertNotEquals((result as { error: string }).error, undefined, "Should not return an error");
    const rule = await concept["rules"].findOne({ exercise: benchExercise });
    assertNotEquals(rule, null, "Rule should be found in DB");
    assertEquals(rule?.exercise, benchExercise);
    assertEquals(rule?.increment, 2.5);
    console.log(`  Rule created for ${benchExercise}: ${JSON.stringify(rule)}`);
  });

  await t.step("createProgressionRule: Fail to create duplicate rule", async () => {
    console.log("\nTest: createProgressionRule - duplicate failure");
    const result = await concept.createProgressionRule({
      exercise: benchExercise,
      increment: 5,
      deloadThreshold: 1,
      targetSessions: 1,
    });
    assertNotEquals((result as { error: string }).error, undefined, "Should return an error for duplicate rule");
    assertObjectMatch(result, { error: `Progression rule for exercise ${benchExercise} already exists.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  // --- Test _getProgressionRule (Query) ---
  await t.step("_getProgressionRule: Retrieve an existing rule", async () => {
    console.log("\nTest: _getProgressionRule - existing");
    const rule = await concept._getProgressionRule({ exercise: benchExercise });
    assertNotEquals(rule, null, "Should retrieve the rule");
    assertEquals(rule?.increment, 2.5);
    assertEquals(rule?.deloadThreshold, 2);
    console.log(`  Retrieved rule: ${JSON.stringify(rule)}`);
  });

  await t.step("_getProgressionRule: Return null for non-existent rule", async () => {
    console.log("\nTest: _getProgressionRule - non-existent");
    const rule = await concept._getProgressionRule({ exercise: deadliftExercise });
    assertEquals(rule, null, "Should return null for a non-existent rule");
    console.log(`  No rule found for ${deadliftExercise}, returned null as expected.`);
  });

  // --- Test suggestWeight ---
  await t.step("suggestWeight: Error if no rule exists for exercise", async () => {
    console.log("\nTest: suggestWeight - no rule error");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: deadliftExercise,
      lastWeight: 100,
      lastSets: 5,
      lastReps: 5,
    });
    assertNotEquals((suggestion as { newWeight: number }).newWeight, undefined, "Should return an error object");
    assertObjectMatch(suggestion, { error: `No progression rule found for exercise: ${deadliftExercise}` });
    console.log(`  Expected error received: ${suggestion.error}`);
  });

  await t.step("suggestWeight: First session, maintain weight", async () => {
    console.log("\nTest: suggestWeight - first session maintain");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60,
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "maintain" });
    console.log(`  First session: ${JSON.stringify(suggestion)}`);
  });

  // --- Test updateProgression ---
  await t.step("updateProgression: Create new user progression on first update", async () => {
    console.log("\nTest: updateProgression - create new");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertNotEquals(progression, null, "User progression should be created");
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 1);
    console.log(`  Progression created: ${JSON.stringify(progression)}`);
  });

  await t.step("updateProgression: Increment sessions at same weight", async () => {
    console.log("\nTest: updateProgression - increment sessions");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 2);
    console.log(`  Sessions incremented: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Maintain, not enough sessions yet", async () => {
    console.log("\nTest: suggestWeight - maintain, not enough sessions (2/3)");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60, // Previous actual weight
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "maintain" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgression: Increment sessions again, reaching target", async () => {
    console.log("\nTest: updateProgression - increment sessions to reach target");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 3);
    console.log(`  Sessions incremented to target: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Increase weight after target sessions met", async () => {
    console.log("\nTest: suggestWeight - increase weight");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60, // Previous actual weight
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 62.5, action: "increase" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgression: Update with new weight, reset sessions", async () => {
    console.log("\nTest: updateProgression - new weight, reset sessions");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 62.5 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 62.5);
    assertEquals(progression?.sessionsAtWeight, 1);
    console.log(`  Progression updated: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Deload condition met", async () => {
    console.log("\nTest: suggestWeight - deload triggered");
    // Simulate current weight of 62.5kg, but failed reps
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 62.5,
      lastSets: 3,
      lastReps: 1, // Below deload threshold of 2
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "deload" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgressionRule: Update existing rule", async () => {
    console.log("\nTest: updateProgressionRule - success");
    await concept.updateProgressionRule({
      exercise: benchExercise,
      increment: 5,
      targetSessions: 4,
    });
    const updatedRule = await concept["rules"].findOne({ exercise: benchExercise });
    assertEquals(updatedRule?.increment, 5);
    assertEquals(updatedRule?.targetSessions, 4);
    assertEquals(updatedRule?.deloadThreshold, 2); // Unchanged
    console.log(`  Rule updated for ${benchExercise}: ${JSON.stringify(updatedRule)}`);
  });

  await t.step("updateProgressionRule: Fail to update non-existent rule", async () => {
    console.log("\nTest: updateProgressionRule - non-existent failure");
    const result = await concept.updateProgressionRule({
      exercise: deadliftExercise,
      increment: 10,
    });
    assertNotEquals((result as Empty).error, undefined, "Should return an error");
    assertObjectMatch(result, { error: `No progression rule found for exercise ${deadliftExercise}.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  await t.step("deleteProgressionRule: Successfully delete a rule", async () => {
    console.log("\nTest: deleteProgressionRule - success");
    await concept.deleteProgressionRule({ exercise: benchExercise });
    const rule = await concept["rules"].findOne({ exercise: benchExercise });
    assertEquals(rule, null, "Rule should no longer be in DB");
    console.log(`  Rule for ${benchExercise} deleted.`);
  });

  await t.step("deleteProgressionRule: Fail to delete non-existent rule", async () => {
    console.log("\nTest: deleteProgressionRule - non-existent failure");
    const result = await concept.deleteProgressionRule({ exercise: benchExercise }); // Already deleted
    assertNotEquals((result as Empty).error, undefined, "Should return an error");
    assertObjectMatch(result, { error: `No progression rule found for exercise ${benchExercise}.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  await client.close();
});
```

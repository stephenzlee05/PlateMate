[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: WorkoutTracking
# response:

```typescript
// file: src/WorkoutTracking/WorkoutTrackingConcept.test.ts

import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import WorkoutTrackingConcept from "./WorkoutTrackingConcept.ts";

// Helper to get a consistent start of the week for testing (Sunday at midnight)
function getTestWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday
  const diff = d.getDate() - day; // adjust date to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Set to midnight
  return d;
}

Deno.test("WorkoutTrackingConcept - Principle Fulfillment", async (t) => {
  const [db, client] = await testDb();
  const concept = new WorkoutTrackingConcept(db);

  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID; // For demonstrating separation of concerns
  const benchPress = "exercise:BenchPress" as ID;
  const squat = "exercise:Squat" as ID;
  const bicepCurl = "exercise:BicepCurl" as ID;

  console.log("--- Principle Fulfillment Test ---");
  console.log("Principle: each workout session records exercises with weights, sets, and reps, and tracks weekly training volume for muscle group balance");

  const today = new Date();
  const testWeekStart = getTestWeekStart(today);

  // Trace 1: Alice starts a session and records a bench press
  await t.step("Alice starts a session and records bench press", async () => {
    console.log("\nAction: Alice starts a workout session.");
    const { sessionId: session1Id } = await concept.startSession({ user: userA, date: today });
    assertEquals(typeof session1Id, "string", "startSession should return a sessionId string.");
    console.log(`Session 1 started for user ${userA} on ${today.toLocaleDateString()}. Session ID: ${session1Id}`);

    console.log("Action: Alice records Bench Press: 3 sets, 5 reps, 100kg.");
    await concept.recordExercise({ sessionId: session1Id, exercise: benchPress, weight: 100, sets: 3, reps: 5 });
    console.log("Bench Press recorded. Expected volume for Chest/Triceps/Shoulders to be updated.");

    const { weight: lastBenchPressWeight } = await concept._getLastWeight({ user: userA, exercise: benchPress });
    assertEquals(lastBenchPressWeight, 100, "getLastWeight should return 100kg for Bench Press.");
    console.log(`Query: Last recorded Bench Press weight for ${userA}: ${lastBenchPressWeight}kg (expected 100).`);

    const { weeklyVolumes: aliceWeeklyVolume1 } = await concept._getWeeklyVolume({ user: userA, weekStart: testWeekStart });
    console.log(`Query: Alice's weekly volume after Bench Press: ${JSON.stringify(aliceWeeklyVolume1)}`);
    // Expected volume: 3 * 5 * 100 = 1500 for Chest, Triceps, Shoulders
    assertEquals(aliceWeeklyVolume1.find(v => v.muscleGroup === "muscleGroup:Chest")?.volume, 1500);
    assertEquals(aliceWeeklyVolume1.find(v => v.muscleGroup === "muscleGroup:Triceps")?.volume, 1500);
    assertEquals(aliceWeeklyVolume1.find(v => v.muscleGroup === "muscleGroup:Shoulders")?.volume, 1500);
  });

  // Trace 2: Alice records a squat and bicep curl in the same session, further updating volume
  await t.step("Alice records Squat and Bicep Curl in the same session", async () => {
    // Re-use session1Id from previous step (assuming one session per day for simplicity)
    const { sessionId: session1Id } = await concept.startSession({ user: userA, date: today }); // This will generate a new session ID if current setup prevents re-using same ID logic

    console.log("Action: Alice records Squat: 5 sets, 5 reps, 120kg.");
    await concept.recordExercise({ sessionId: session1Id, exercise: squat, weight: 120, sets: 5, reps: 5 });
    console.log("Squat recorded. Expected volume for Quads/Glutes/Hamstrings to be updated.");

    console.log("Action: Alice records Bicep Curl: 3 sets, 10 reps, 20kg.");
    await concept.recordExercise({ sessionId: session1Id, exercise: bicepCurl, weight: 20, sets: 3, reps: 10 });
    console.log("Bicep Curl recorded. Expected volume for Biceps to be updated.");

    const { weight: lastSquatWeight } = await concept._getLastWeight({ user: userA, exercise: squat });
    assertEquals(lastSquatWeight, 120, "getLastWeight should return 120kg for Squat.");
    console.log(`Query: Last recorded Squat weight for ${userA}: ${lastSquatWeight}kg (expected 120).`);

    const { weeklyVolumes: aliceWeeklyVolume2 } = await concept._getWeeklyVolume({ user: userA, weekStart: testWeekStart });
    console.log(`Query: Alice's weekly volume after Squat and Bicep Curl: ${JSON.stringify(aliceWeeklyVolume2)}`);

    // Expected volume:
    // Bench Press related: 1500
    // Squat related: 5 * 5 * 120 = 3000
    // Bicep Curl related: 3 * 10 * 20 = 600
    assertEquals(aliceWeeklyVolume2.find(v => v.muscleGroup === "muscleGroup:Chest")?.volume, 1500, "Chest volume should remain 1500.");
    assertEquals(aliceWeeklyVolume2.find(v => v.muscleGroup === "muscleGroup:Quads")?.volume, 3000, "Quads volume should be 3000.");
    assertEquals(aliceWeeklyVolume2.find(v => v.muscleGroup === "muscleGroup:Biceps")?.volume, 600, "Biceps volume should be 600.");
  });

  // Trace 3: Check for balance - Alice might have lower volume in some muscle groups now
  await t.step("Alice checks for muscle group balance", async () => {
    console.log("\nAction: Alice checks for imbalanced muscle groups.");
    const { imbalancedMuscleGroups } = await concept._checkBalance({ user: userA, weekStart: testWeekStart });
    console.log(`Query: Imbalanced muscle groups for ${userA}: ${JSON.stringify(imbalancedMuscleGroups)}`);

    // Based on the hardcoded _getMuscleGroupsForExercise and the volumes calculated:
    // Chest: 1500
    // Triceps: 1500
    // Shoulders: 1500
    // Quads: 3000
    // Glutes: 3000
    // Hamstrings: 3000
    // Biceps: 600
    // Average volume: (1500*3 + 3000*3 + 600) / 7 = (4500 + 9000 + 600) / 7 = 14100 / 7 = 2014.28
    // Imbalance threshold (50% of avg): 1007.14
    // Biceps (600) should be imbalanced. Chest, Triceps, Shoulders (1500) are above threshold.
    // This demonstrates the core functionality of tracking and identifying imbalances.
    assertEquals(imbalancedMuscleGroups.includes("muscleGroup:Biceps" as ID), true, "Biceps should be an imbalanced muscle group.");
    assertEquals(imbalancedMuscleGroups.length, 1, "Only Biceps should be imbalanced.");
  });

  await client.close();
  console.log("--- Principle Fulfillment Test Complete ---");
});


Deno.test("WorkoutTrackingConcept - Action Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new WorkoutTrackingConcept(db);

  const user1 = "user:user1" as ID;
  const user2 = "user:user2" as ID;
  const exerciseA = "exercise:A" as ID;
  const exerciseB = "exercise:B" as ID;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next day

  console.log("\n--- Action Specific Tests ---");

  await t.step("startSession action", async () => {
    console.log("Testing startSession: creates new workout session and returns its ID.");
    const { sessionId } = await concept.startSession({ user: user1, date: now });
    assertEquals(typeof sessionId, "string", "Returns a string ID for the session.");
    assertEquals(sessionId.length > 0, true, "Session ID should not be empty.");

    // Verify effect: session exists in the database
    const sessionInDb = await concept["workoutSessions"].findOne({ _id: sessionId });
    assertEquals(sessionInDb?.user, user1, "Session user should match.");
    // Compare dates by timestamp or string representation to avoid precision issues
    assertEquals(sessionInDb?.date.toDateString(), now.toDateString(), "Session date should match.");
    console.log(`Confirmation: Session ${sessionId} for ${user1} on ${now.toDateString()} found in DB.`);
  });

  await t.step("recordExercise action - success", async () => {
    console.log("Testing recordExercise: adds exercise record to session and updates volume.");
    const { sessionId } = await concept.startSession({ user: user1, date: now });
    const result = await concept.recordExercise({
      sessionId,
      exercise: exerciseA,
      weight: 50,
      sets: 4,
      reps: 10,
      notes: "Feeling good",
    });
    assertEquals(Object.keys(result).length, 0, "Successful recordExercise returns empty object.");

    // Verify effect: exercise record exists
    const recordsInDb = await concept["exerciseRecords"].find({ sessionId }).toArray();
    assertEquals(recordsInDb.length, 1, "One exercise record should be in the DB for this session.");
    assertEquals(recordsInDb[0].exercise, exerciseA, "Recorded exercise should match.");
    assertEquals(recordsInDb[0].weight, 50, "Recorded weight should match.");
    assertEquals(recordsInDb[0].notes, "Feeling good", "Recorded notes should match.");
    console.log(`Confirmation: Exercise record for ${exerciseA} in session ${sessionId} found in DB.`);

    // Verify effect: weekly volume is updated (assuming exerciseA maps to some muscle groups)
    const weekStart = getTestWeekStart(now);
    const { weeklyVolumes } = await concept._getWeeklyVolume({ user: user1, weekStart });
    const expectedVolume = 4 * 10 * 50; // sets * reps * weight
    const muscleGroupVolumes = weeklyVolumes.filter(v => v.muscleGroup === "muscleGroup:Chest" as ID || v.muscleGroup === "muscleGroup:Triceps" as ID || v.muscleGroup === "muscleGroup:Shoulders" as ID);
    assertEquals(muscleGroupVolumes.every(v => v.volume === expectedVolume), true, `Volume for muscle groups related to ${exerciseA} should be ${expectedVolume}.`);
    console.log(`Confirmation: Weekly volume for ${user1} updated. E.g., Chest volume is ${weeklyVolumes.find(v => v.muscleGroup === "muscleGroup:Chest")?.volume}.`);
  });

  await t.step("recordExercise action - invalid sessionId (requires check)", async () => {
    console.log("Testing recordExercise with invalid sessionId: should return an error.");
    const invalidSessionId = "non-existent-session" as ID;
    const result = await concept.recordExercise({
      sessionId: invalidSessionId,
      exercise: exerciseB,
      weight: 70,
      sets: 3,
      reps: 8,
    });
    assertEquals(result, { error: `Workout session with ID ${invalidSessionId} not found.` }, "Should return error for invalid session ID.");
    console.log(`Confirmation: Attempt to record exercise with invalid session ID properly returned an error: ${JSON.stringify(result)}`);
  });

  await t.step("_getLastWeight query", async () => {
    console.log("Testing _getLastWeight: returns most recent weight.");
    const { sessionId: s1Id } = await concept.startSession({ user: user2, date: now });
    await concept.recordExercise({ sessionId: s1Id, exercise: exerciseB, weight: 60, sets: 3, reps: 5 });

    const { sessionId: s2Id } = await concept.startSession({ user: user2, date: tomorrow }); // Newer session
    await concept.recordExercise({ sessionId: s2Id, exercise: exerciseB, weight: 70, sets: 3, reps: 5 });
    await concept.recordExercise({ sessionId: s2Id, exercise: exerciseA, weight: 100, sets: 5, reps: 5 });

    const { weight: lastWeightB } = await concept._getLastWeight({ user: user2, exercise: exerciseB });
    assertEquals(lastWeightB, 70, "getLastWeight should return the most recent weight for exerciseB (70).");
    console.log(`Confirmation: Last weight for ${exerciseB} by ${user2} is ${lastWeightB}.`);

    const { weight: lastWeightA } = await concept._getLastWeight({ user: user2, exercise: exerciseA });
    assertEquals(lastWeightA, 100, "getLastWeight should return the most recent weight for exerciseA (100).");
    console.log(`Confirmation: Last weight for ${exerciseA} by ${user2} is ${lastWeightA}.`);

    const { weight: nonExistentWeight } = await concept._getLastWeight({ user: user2, exercise: "exercise:NonExistent" as ID });
    assertEquals(nonExistentWeight, null, "getLastWeight should return null for a non-existent exercise.");
    console.log(`Confirmation: Last weight for non-existent exercise returns ${nonExistentWeight}.`);

    const { weight: anotherUserWeight } = await concept._getLastWeight({ user: user1, exercise: exerciseB });
    assertEquals(anotherUserWeight, 60, "getLastWeight should return correct weight for a different user if any, not affected by user2's record.");
    console.log(`Confirmation: Last weight for ${exerciseB} by ${user1} is ${anotherUserWeight}.`);
  });

  await t.step("_getWorkoutHistory query", async () => {
    console.log("Testing _getWorkoutHistory: returns recent exercise record IDs.");
    const { sessionId: s1Id } = await concept.startSession({ user: user1, date: now });
    await concept.recordExercise({ sessionId: s1Id, exercise: exerciseA, weight: 10, sets: 1, reps: 1 });
    const recordId1 = (await concept["exerciseRecords"].findOne({ sessionId: s1Id, exercise: exerciseA }))?._id;

    const { sessionId: s2Id } = await concept.startSession({ user: user1, date: new Date(now.getTime() + 1000) }); // Slightly later
    await concept.recordExercise({ sessionId: s2Id, exercise: exerciseA, weight: 20, sets: 2, reps: 2 });
    const recordId2 = (await concept["exerciseRecords"].findOne({ sessionId: s2Id, exercise: exerciseA }))?._id;

    const { sessionId: s3Id } = await concept.startSession({ user: user1, date: new Date(now.getTime() + 2000) }); // Even later
    await concept.recordExercise({ sessionId: s3Id, exercise: exerciseA, weight: 30, sets: 3, reps: 3 });
    const recordId3 = (await concept["exerciseRecords"].findOne({ sessionId: s3Id, exercise: exerciseA }))?._id;

    const { recordIds: historyLimited2 } = await concept._getWorkoutHistory({ user: user1, exercise: exerciseA, limit: 2 });
    assertEquals(historyLimited2.length, 2, "Should return 2 records when limit is 2.");
    assertEquals(historyLimited2[0], recordId3, "Most recent record should be first.");
    assertEquals(historyLimited2[1], recordId2, "Second most recent record should be second.");
    console.log(`Confirmation: History limited to 2: ${JSON.stringify(historyLimited2)} (most recent first).`);

    const { recordIds: historyAll } = await concept._getWorkoutHistory({ user: user1, exercise: exerciseA, limit: 10 });
    assertEquals(historyAll.length, 3, "Should return all 3 records when limit is larger than available.");
    console.log(`Confirmation: All history: ${JSON.stringify(historyAll)}.`)
  });

  await t.step("updateVolume action - direct update", async () => {
    console.log("Testing updateVolume: updates weekly volume directly.");
    const weekStart = getTestWeekStart(now);
    const exerciseC = "exercise:Deadlift" as ID; // Maps to Back, Hamstrings, Glutes

    await concept.updateVolume({ user: user1, exercise: exerciseC, sets: 5, reps: 5, weight: 150, weekStart });
    // Volume: 5 * 5 * 150 = 3750
    const { weeklyVolumes: vol1 } = await concept._getWeeklyVolume({ user: user1, weekStart });
    assertEquals(vol1.find(v => v.muscleGroup === "muscleGroup:Back")?.volume, 3750, "Back volume should be 3750.");
    console.log(`Confirmation: Direct update for ${exerciseC} for ${user1} resulted in Back volume of 3750.`);

    await concept.updateVolume({ user: user1, exercise: exerciseC, sets: 2, reps: 5, weight: 150, weekStart });
    // Additional volume: 2 * 5 * 150 = 1500. Total: 3750 + 1500 = 5250
    const { weeklyVolumes: vol2 } = await concept._getWeeklyVolume({ user: user1, weekStart });
    assertEquals(vol2.find(v => v.muscleGroup === "muscleGroup:Back")?.volume, 5250, "Back volume should be 5250 after second update.");
    console.log(`Confirmation: Second direct update for ${exerciseC} for ${user1} resulted in Back volume of 5250.`);

    const nextWeek = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    await concept.updateVolume({ user: user1, exercise: exerciseC, sets: 1, reps: 1, weight: 10, weekStart: nextWeek });
    const { weeklyVolumes: volNextWeek } = await concept._getWeeklyVolume({ user: user1, weekStart: nextWeek });
    assertEquals(volNextWeek.find(v => v.muscleGroup === "muscleGroup:Back")?.volume, 10, "Volume for next week should be 10.");
    console.log(`Confirmation: Volume for next week correctly separated and initialized to 10.`);
  });

  await t.step("_checkBalance query", async () => {
    console.log("Testing _checkBalance: identifies imbalanced muscle groups.");
    const weekStart = getTestWeekStart(now);
    const user3 = "user:user3" as ID;
    const exerciseD = "exercise:BenchPress" as ID; // Chest, Triceps, Shoulders
    const exerciseE = "exercise:BicepCurl" as ID; // Biceps

    // Clear previous for user3 to avoid interference
    await concept["weeklyVolume"].deleteMany({ user: user3 });

    // Record volumes:
    // Chest, Triceps, Shoulders: 2 sets * 10 reps * 100kg = 2000
    await concept.updateVolume({ user: user3, exercise: exerciseD, sets: 2, reps: 10, weight: 100, weekStart });
    // Biceps: 1 set * 5 reps * 10kg = 50
    await concept.updateVolume({ user: user3, exercise: exerciseE, sets: 1, reps: 5, weight: 10, weekStart });

    const { imbalancedMuscleGroups } = await concept._checkBalance({ user: user3, weekStart });
    console.log(`Current volumes for ${user3} for the week: ${JSON.stringify(await concept._getWeeklyVolume({ user: user3, weekStart }))}`);
    console.log(`Imbalanced muscle groups for ${user3}: ${JSON.stringify(imbalancedMuscleGroups)}`);

    // Volumes: Chest=2000, Triceps=2000, Shoulders=2000, Biceps=50
    // Total = 6050. Count = 4. Average = 1512.5
    // Threshold (0.5 * avg) = 756.25
    // Biceps (50) is below threshold, others are above.
    assertEquals(imbalancedMuscleGroups.length, 1, "Should identify one imbalanced muscle group.");
    assertEquals(imbalancedMuscleGroups[0], "muscleGroup:Biceps" as ID, "Biceps should be the imbalanced muscle group.");

    const { imbalancedMuscleGroups: noImbalance } = await concept._checkBalance({ user: "user:NoData" as ID, weekStart });
    assertEquals(noImbalance.length, 0, "Should return empty list if no data for user/week.");
  });

  await t.step("_getWeeklyVolume query", async () => {
    console.log("Testing _getWeeklyVolume: returns all weekly volume data.");
    const weekStart = getTestWeekStart(now);
    const user4 = "user:user4" as ID;
    const exerciseF = "exercise:BenchPress" as ID;
    const exerciseG = "exercise:Squat" as ID;

    await concept["weeklyVolume"].deleteMany({ user: user4 }); // Clear for fresh test

    await concept.updateVolume({ user: user4, exercise: exerciseF, sets: 2, reps: 8, weight: 80, weekStart }); // Chest=1280, Triceps=1280, Shoulders=1280
    await concept.updateVolume({ user: user4, exercise: exerciseG, sets: 3, reps: 5, weight: 100, weekStart }); // Quads=1500, Glutes=1500, Hamstrings=1500

    const { weeklyVolumes } = await concept._getWeeklyVolume({ user: user4, weekStart });
    assertEquals(weeklyVolumes.length, 6, "Should return 6 muscle group entries."); // 3 from BenchPress, 3 from Squat
    assertEquals(weeklyVolumes.find(v => v.muscleGroup === "muscleGroup:Chest")?.volume, 1280);
    assertEquals(weeklyVolumes.find(v => v.muscleGroup === "muscleGroup:Quads")?.volume, 1500);
    console.log(`Confirmation: Retrieved weekly volumes for ${user4}: ${JSON.stringify(weeklyVolumes)}`);

    const { weeklyVolumes: emptyVolumes } = await concept._getWeeklyVolume({ user: user4, weekStart: tomorrow });
    assertEquals(emptyVolumes.length, 0, "Should return empty array for a week with no data.");
    console.log(`Confirmation: No volumes for ${user4} for tomorrow's week, returned empty array.`);
  });

  await client.close();
  console.log("--- Action Specific Tests Complete ---");
});
```
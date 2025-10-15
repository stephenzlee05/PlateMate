import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import WorkoutTrackingConcept from "./WorkoutTrackingConcept.ts";

Deno.test("WorkoutTracking Concept", async (t) => {
  const [db, client] = await testDb();
  const workoutTracking = new WorkoutTrackingConcept(db);

  const testUser = "user123" as any;
  const testExercise = "benchpress" as any;

  await t.step("Operational Principle: Complete workout tracking flow", async () => {
    console.log("\n=== OPERATIONAL PRINCIPLE TEST ===");
    console.log("Testing the common expected usage: start session, record exercises, get history");
    
    // Step 1: Start a workout session
    console.log(`\n1. Starting session for user: ${testUser}, date: 2024-01-15`);
    const sessionResult = await workoutTracking.startSession({
      user: testUser,
      date: "2024-01-15"
    });
    
    assertExists(sessionResult);
    if ("sessionId" in sessionResult) {
      console.log(`   ✓ Session created with ID: ${sessionResult.sessionId}`);
      
      // Step 2: Record exercises in the session
      console.log(`\n2. Recording bench press exercise: 135lbs, 3 sets x 10 reps`);
      const exerciseResult = await workoutTracking.recordExercise({
        sessionId: sessionResult.sessionId,
        exercise: testExercise,
        weight: 135,
        sets: 3,
        reps: 10,
        notes: "Felt strong today"
      });
      
      if ("error" in exerciseResult) {
        throw new Error("Exercise recording failed: " + exerciseResult.error);
      }
      console.log(`   ✓ Exercise recorded successfully`);
      
      // Step 3: Get last weight for progression tracking
      console.log(`\n3. Getting last weight for exercise: ${testExercise}`);
      const lastWeightResult = await workoutTracking.getLastWeight({
        user: testUser,
        exercise: testExercise
      });
      
      if ("weight" in lastWeightResult) {
        console.log(`   ✓ Last weight retrieved: ${lastWeightResult.weight}lbs`);
        assertEquals(lastWeightResult.weight, 135);
      } else {
        throw new Error("GetLastWeight failed: " + lastWeightResult.error);
      }
      
      // Step 4: Get workout history
      console.log(`\n4. Getting workout history for exercise: ${testExercise}`);
      const historyResult = await workoutTracking.getWorkoutHistory({
        user: testUser,
        exercise: testExercise,
        limit: 5
      });
      
      if ("records" in historyResult) {
        console.log(`   ✓ History retrieved: ${historyResult.records.length} records`);
        assertEquals(historyResult.records.length, 1);
        assertEquals(historyResult.records[0].weight, 135);
      } else {
        throw new Error("GetWorkoutHistory failed: " + historyResult.error);
      }
      
      console.log("\n✓ Operational principle test completed successfully");
    } else {
      throw new Error("Session creation failed: " + sessionResult.error);
    }
  });

  await t.step("Interesting Scenario 1: Multiple sessions with progression", async () => {
    console.log("\n=== SCENARIO 1: MULTIPLE SESSIONS WITH PROGRESSION ===");
    console.log("Testing progression tracking across multiple workout sessions");
    
    // Create multiple sessions over time with increasing weights
    const sessions = [];
    const dates = ["2024-01-10", "2024-01-12", "2024-01-15", "2024-01-17"];
    const weights = [125, 130, 135, 140];
    
    for (let i = 0; i < dates.length; i++) {
      console.log(`\nCreating session ${i + 1}: ${dates[i]}, weight: ${weights[i]}lbs`);
      
      const sessionResult = await workoutTracking.startSession({
        user: testUser,
        date: dates[i]
      });
      
      if ("sessionId" in sessionResult) {
        sessions.push(sessionResult.sessionId);
        
        await workoutTracking.recordExercise({
          sessionId: sessionResult.sessionId,
          exercise: testExercise,
          weight: weights[i],
          sets: 3,
          reps: 10,
          notes: `Session ${i + 1}`
        });
        
        console.log(`   ✓ Recorded ${weights[i]}lbs in session ${sessionResult.sessionId}`);
      } else {
        throw new Error("Session creation failed: " + sessionResult.error);
      }
    }
    
    // Verify progression tracking
    console.log(`\nChecking last weight after ${sessions.length} sessions`);
    const lastWeightResult = await workoutTracking.getLastWeight({
      user: testUser,
      exercise: testExercise
    });
    
    if ("weight" in lastWeightResult) {
      console.log(`   ✓ Last weight: ${lastWeightResult.weight}lbs (should be 140)`);
      assertEquals(lastWeightResult.weight, 140);
    } else {
      throw new Error("GetLastWeight failed: " + lastWeightResult.error);
    }
    
    // Verify history shows progression
    console.log(`\nChecking workout history for progression`);
    const historyResult = await workoutTracking.getWorkoutHistory({
      user: testUser,
      exercise: testExercise,
      limit: 10
    });
    
    if ("records" in historyResult) {
      console.log(`   ✓ History shows ${historyResult.records.length} records`);
      assertEquals(historyResult.records.length, 5); // 4 new + 1 from operational principle
      
      // Should be sorted by date descending (most recent first)
      const expectedWeights = [140, 135, 135, 130, 125]; // Including the 135 from operational principle
      const actualWeights = historyResult.records.map(r => r.weight);
      console.log(`   ✓ Weight progression: ${actualWeights.join(' -> ')}lbs`);
      assertEquals(actualWeights, expectedWeights);
    } else {
      throw new Error("GetWorkoutHistory failed: " + historyResult.error);
    }
  });

  await t.step("Interesting Scenario 2: Error handling and validation", async () => {
    console.log("\n=== SCENARIO 2: ERROR HANDLING AND VALIDATION ===");
    console.log("Testing various error conditions and edge cases");
    
    // Test invalid session creation
    console.log("\n1. Testing invalid session creation");
    const invalidSessionResult = await workoutTracking.startSession({
      user: "" as any,
      date: "2024-01-20"
    });
    
    if ("error" in invalidSessionResult) {
      console.log(`   ✓ Correctly rejected empty user: "${invalidSessionResult.error}"`);
      assertEquals(invalidSessionResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with empty user");
    }
    
    // Test invalid date format
    const invalidDateResult = await workoutTracking.startSession({
      user: testUser,
      date: "not-a-date"
    });
    
    if ("error" in invalidDateResult) {
      console.log(`   ✓ Correctly rejected invalid date: "${invalidDateResult.error}"`);
      assertEquals(invalidDateResult.error.includes("Invalid date format"), true);
    } else {
      throw new Error("Should have failed with invalid date");
    }
    
    // Create a valid session for exercise testing
    const validSessionResult = await workoutTracking.startSession({
      user: testUser,
      date: "2024-01-20"
    });
    
    if ("sessionId" in validSessionResult) {
      console.log(`\n2. Created valid session: ${validSessionResult.sessionId}`);
      
      // Test invalid exercise recording
      console.log("\n3. Testing invalid exercise recording");
      
      // Negative weight
      const negativeWeightResult = await workoutTracking.recordExercise({
        sessionId: validSessionResult.sessionId,
        exercise: testExercise,
        weight: -10,
        sets: 3,
        reps: 10
      });
      
      if ("error" in negativeWeightResult) {
        console.log(`   ✓ Correctly rejected negative weight: "${negativeWeightResult.error}"`);
        assertEquals(negativeWeightResult.error.includes("Weight cannot be negative"), true);
      } else {
        throw new Error("Should have failed with negative weight");
      }
      
      // Zero sets
      const zeroSetsResult = await workoutTracking.recordExercise({
        sessionId: validSessionResult.sessionId,
        exercise: testExercise,
        weight: 135,
        sets: 0,
        reps: 10
      });
      
      if ("error" in zeroSetsResult) {
        console.log(`   ✓ Correctly rejected zero sets: "${zeroSetsResult.error}"`);
        assertEquals(zeroSetsResult.error.includes("Sets must be greater than 0"), true);
      } else {
        throw new Error("Should have failed with zero sets");
      }
      
      // Record a valid exercise
      const validExerciseResult = await workoutTracking.recordExercise({
        sessionId: validSessionResult.sessionId,
        exercise: testExercise,
        weight: 145,
        sets: 4,
        reps: 8,
        notes: "Heavy day"
      });
      
      if ("error" in validExerciseResult) {
        throw new Error("Valid exercise recording failed: " + validExerciseResult.error);
      }
      console.log(`   ✓ Successfully recorded valid exercise: 145lbs, 4x8`);
      
      // Test non-existent session
      console.log("\n4. Testing non-existent session");
      const nonexistentSessionResult = await workoutTracking.recordExercise({
        sessionId: "nonexistent" as any,
        exercise: testExercise,
        weight: 135,
        sets: 3,
        reps: 10
      });
      
      if ("error" in nonexistentSessionResult) {
        console.log(`   ✓ Correctly rejected non-existent session: "${nonexistentSessionResult.error}"`);
        assertEquals(nonexistentSessionResult.error.includes("not found"), true);
      } else {
        throw new Error("Should have failed for non-existent session");
      }
    } else {
      throw new Error("Valid session creation failed: " + validSessionResult.error);
    }
  });

  await t.step("Interesting Scenario 3: Empty history and new user", async () => {
    console.log("\n=== SCENARIO 3: EMPTY HISTORY AND NEW USER ===");
    console.log("Testing behavior with new users and exercises that have no history");
    
    const newUser = "newuser456" as any;
    const newExercise = "deadlift" as any;
    
    // Test getting last weight for user with no history
    console.log(`\n1. Getting last weight for new user: ${newUser}, exercise: ${newExercise}`);
    const emptyHistoryResult = await workoutTracking.getLastWeight({
      user: newUser,
      exercise: newExercise
    });
    
    if ("weight" in emptyHistoryResult) {
      console.log(`   ✓ Last weight for new user: ${emptyHistoryResult.weight} (should be null)`);
      assertEquals(emptyHistoryResult.weight, null);
    } else {
      throw new Error("GetLastWeight failed: " + emptyHistoryResult.error);
    }
    
    // Test getting workout history for user with no history
    console.log(`\n2. Getting workout history for new user`);
    const emptyWorkoutHistoryResult = await workoutTracking.getWorkoutHistory({
      user: newUser,
      exercise: newExercise,
      limit: 10
    });
    
    if ("records" in emptyWorkoutHistoryResult) {
      console.log(`   ✓ Workout history for new user: ${emptyWorkoutHistoryResult.records.length} records`);
      assertEquals(emptyWorkoutHistoryResult.records.length, 0);
    } else {
      throw new Error("GetWorkoutHistory failed: " + emptyWorkoutHistoryResult.error);
    }
    
    // Create first session for new user
    console.log(`\n3. Creating first session for new user`);
    const firstSessionResult = await workoutTracking.startSession({
      user: newUser,
      date: "2024-01-25"
    });
    
    if ("sessionId" in firstSessionResult) {
      console.log(`   ✓ First session created: ${firstSessionResult.sessionId}`);
      
      // Record first exercise
      await workoutTracking.recordExercise({
        sessionId: firstSessionResult.sessionId,
        exercise: newExercise,
        weight: 225,
        sets: 1,
        reps: 5,
        notes: "First deadlift session"
      });
      
      console.log(`   ✓ First exercise recorded: 225lbs, 1x5`);
      
      // Now check history again
      const firstHistoryResult = await workoutTracking.getWorkoutHistory({
        user: newUser,
        exercise: newExercise,
        limit: 10
      });
      
      if ("records" in firstHistoryResult) {
        console.log(`   ✓ After first session: ${firstHistoryResult.records.length} record`);
        assertEquals(firstHistoryResult.records.length, 1);
        assertEquals(firstHistoryResult.records[0].weight, 225);
      } else {
        throw new Error("GetWorkoutHistory failed: " + firstHistoryResult.error);
      }
    } else {
      throw new Error("First session creation failed: " + firstSessionResult.error);
    }
  });

  await t.step("Interesting Scenario 4: Repeated actions with same parameters", async () => {
    console.log("\n=== SCENARIO 4: REPEATED ACTIONS WITH SAME PARAMETERS ===");
    console.log("Testing behavior when same actions are repeated multiple times");
    
    // Create multiple sessions on the same date (edge case)
    console.log(`\n1. Creating multiple sessions on same date: 2024-01-30`);
    const session1 = await workoutTracking.startSession({
      user: testUser,
      date: "2024-01-30"
    });
    
    const session2 = await workoutTracking.startSession({
      user: testUser,
      date: "2024-01-30"
    });
    
    // Record same exercise in both sessions
    const exercise1 = "squat" as any;
    
    if ("sessionId" in session1 && "sessionId" in session2) {
      console.log(`   ✓ Created two sessions on same date: ${session1.sessionId}, ${session2.sessionId}`);
      
      await workoutTracking.recordExercise({
        sessionId: session1.sessionId,
        exercise: exercise1,
        weight: 185,
        sets: 3,
        reps: 10
      });
      
      await workoutTracking.recordExercise({
        sessionId: session2.sessionId,
        exercise: exercise1,
        weight: 185,
        sets: 3,
        reps: 10
      });
      
      console.log(`   ✓ Recorded same exercise (squat, 185lbs) in both sessions`);
      
      // Check history - should show both records
      const historyResult = await workoutTracking.getWorkoutHistory({
        user: testUser,
        exercise: exercise1,
        limit: 10
      });
      
      if ("records" in historyResult) {
        console.log(`   ✓ History shows ${historyResult.records.length} squat records`);
        assertEquals(historyResult.records.length, 2);
        
        // Both should have same weight but different session IDs
        historyResult.records.forEach((record, index) => {
          assertEquals(record.weight, 185);
          console.log(`     Record ${index + 1}: ${record.weight}lbs, session: ${record.sessionId}`);
        });
      } else {
        throw new Error("GetWorkoutHistory failed: " + historyResult.error);
      }
    } else {
      throw new Error("Multiple session creation failed");
    }
    
    // Test repeated getLastWeight calls
    console.log(`\n2. Testing repeated getLastWeight calls`);
    const lastWeight1 = await workoutTracking.getLastWeight({
      user: testUser,
      exercise: exercise1
    });
    
    const lastWeight2 = await workoutTracking.getLastWeight({
      user: testUser,
      exercise: exercise1
    });
    
    if ("weight" in lastWeight1 && "weight" in lastWeight2) {
      console.log(`   ✓ Repeated calls return consistent results: ${lastWeight1.weight}lbs`);
      assertEquals(lastWeight1.weight, lastWeight2.weight);
      assertEquals(lastWeight1.weight, 185);
    } else {
      throw new Error("Repeated getLastWeight calls failed");
    }
  });

  await t.step("Interesting Scenario 5: Limit parameter edge cases", async () => {
    console.log("\n=== SCENARIO 5: LIMIT PARAMETER EDGE CASES ===");
    console.log("Testing various limit values and edge cases for workout history");
    
    // Test with limit = 1
    console.log(`\n1. Testing history with limit = 1`);
    const limit1Result = await workoutTracking.getWorkoutHistory({
      user: testUser,
      exercise: testExercise,
      limit: 1
    });
    
    if ("records" in limit1Result) {
      console.log(`   ✓ Limit 1 returned ${limit1Result.records.length} record`);
      assertEquals(limit1Result.records.length, 1);
      assertEquals(limit1Result.records[0].weight, 145); // Should be the most recent
    } else {
      throw new Error("GetWorkoutHistory with limit 1 failed: " + limit1Result.error);
    }
    
    // Test with limit = 0 (should fail)
    console.log(`\n2. Testing history with limit = 0 (should fail)`);
    const limit0Result = await workoutTracking.getWorkoutHistory({
      user: testUser,
      exercise: testExercise,
      limit: 0
    });
    
    if ("error" in limit0Result) {
      console.log(`   ✓ Correctly rejected limit = 0: "${limit0Result.error}"`);
      assertEquals(limit0Result.error.includes("Limit must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with limit = 0");
    }
    
    // Test with very large limit
    console.log(`\n3. Testing history with large limit = 100`);
    const largeLimitResult = await workoutTracking.getWorkoutHistory({
      user: testUser,
      exercise: testExercise,
      limit: 100
    });
    
    if ("records" in largeLimitResult) {
      console.log(`   ✓ Large limit returned ${largeLimitResult.records.length} records`);
      // Should return all available records, not exceed actual count
      assertEquals(largeLimitResult.records.length >= 6, true); // At least 6 from previous tests
    } else {
      throw new Error("GetWorkoutHistory with large limit failed: " + largeLimitResult.error);
    }
    
    // Test with negative limit (should fail)
    console.log(`\n4. Testing history with negative limit = -5 (should fail)`);
    const negativeLimitResult = await workoutTracking.getWorkoutHistory({
      user: testUser,
      exercise: testExercise,
      limit: -5
    });
    
    if ("error" in negativeLimitResult) {
      console.log(`   ✓ Correctly rejected negative limit: "${negativeLimitResult.error}"`);
      assertEquals(negativeLimitResult.error.includes("Limit must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with negative limit");
    }
  });

  await client.close();
});

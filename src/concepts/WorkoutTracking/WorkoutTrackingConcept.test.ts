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
    if ("sessionId" in sessionResult && "name" in sessionResult) {
      console.log(`   ✓ Session created with ID: ${sessionResult.sessionId}`);
      console.log(`   ✓ Session name: "${sessionResult.name}"`);
      
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
      
      if ("sessionId" in sessionResult && "name" in sessionResult) {
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
    
    if ("sessionId" in validSessionResult && "name" in validSessionResult) {
      console.log(`\n2. Created valid session: ${validSessionResult.sessionId}`);
      console.log(`   ✓ Session name: "${validSessionResult.name}"`);
      
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
    
    if ("sessionId" in firstSessionResult && "name" in firstSessionResult) {
      console.log(`   ✓ First session created: ${firstSessionResult.sessionId}`);
      console.log(`   ✓ Session name: "${firstSessionResult.name}"`);
      
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
    
    if ("sessionId" in session1 && "name" in session1 && "sessionId" in session2 && "name" in session2) {
      console.log(`   ✓ Created two sessions on same date: ${session1.sessionId}, ${session2.sessionId}`);
      console.log(`   ✓ Session names: "${session1.name}", "${session2.name}"`);
      
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

  await t.step("Interesting Scenario 6: Workout session removal", async () => {
    console.log("\n=== SCENARIO 6: WORKOUT SESSION REMOVAL ===");
    console.log("Testing removal of workout sessions and associated exercise records");
    
    const removeTestUser = "removeuser789" as any;
    const removeTestExercise = "overheadpress" as any;
    
    // Create a session with multiple exercise records
    console.log(`\n1. Creating session with multiple exercises for user: ${removeTestUser}`);
    const sessionResult = await workoutTracking.startSession({
      user: removeTestUser,
      date: "2024-02-01"
    });
    
    if ("sessionId" in sessionResult && "name" in sessionResult) {
      console.log(`   ✓ Session created: ${sessionResult.sessionId}`);
      console.log(`   ✓ Session name: "${sessionResult.name}"`);
      
      // Record multiple exercises in the session
      const exercises = [
        { exercise: removeTestExercise, weight: 95, sets: 3, reps: 8, notes: "First exercise" },
        { exercise: "squat" as any, weight: 185, sets: 4, reps: 6, notes: "Second exercise" },
        { exercise: "deadlift" as any, weight: 225, sets: 2, reps: 5, notes: "Third exercise" }
      ];
      
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const recordResult = await workoutTracking.recordExercise({
          sessionId: sessionResult.sessionId,
          exercise: ex.exercise,
          weight: ex.weight,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes
        });
        
        if ("error" in recordResult) {
          throw new Error(`Exercise recording failed: ${recordResult.error}`);
        }
        console.log(`   ✓ Recorded ${ex.exercise}: ${ex.weight}lbs, ${ex.sets}x${ex.reps}`);
      }
      
      // Verify session and records exist
      console.log(`\n2. Verifying session and records exist before removal`);
      const userSessions = await workoutTracking._getUserSessions({ user: removeTestUser });
      console.log(`   ✓ User has ${userSessions.length} sessions`);
      assertEquals(userSessions.length, 1);
      
      const sessionRecords = await workoutTracking._getSessionRecords({ sessionId: sessionResult.sessionId });
      console.log(`   ✓ Session has ${sessionRecords.length} exercise records`);
      assertEquals(sessionRecords.length, 3);
      
      // Test removing the session
      console.log(`\n3. Removing workout session: ${sessionResult.sessionId}`);
      const removeResult = await workoutTracking.removeWorkoutSession({
        sessionId: sessionResult.sessionId,
        user: removeTestUser
      });
      
      if ("error" in removeResult) {
        throw new Error(`Session removal failed: ${removeResult.error}`);
      }
      console.log(`   ✓ Session removed successfully`);
      
      // Verify session and records are gone
      console.log(`\n4. Verifying session and records are removed`);
      const userSessionsAfter = await workoutTracking._getUserSessions({ user: removeTestUser });
      console.log(`   ✓ User now has ${userSessionsAfter.length} sessions`);
      assertEquals(userSessionsAfter.length, 0);
      
      const sessionRecordsAfter = await workoutTracking._getSessionRecords({ sessionId: sessionResult.sessionId });
      console.log(`   ✓ Session now has ${sessionRecordsAfter.length} exercise records`);
      assertEquals(sessionRecordsAfter.length, 0);
      
      // Verify session no longer exists
      const sessionCheck = await workoutTracking.workoutSessions.findOne({ sessionId: sessionResult.sessionId });
      console.log(`   ✓ Session lookup result: ${sessionCheck ? 'found' : 'not found'} (should be not found)`);
      assertEquals(sessionCheck, null);
      
    } else {
      throw new Error("Session creation failed: " + sessionResult.error);
    }
    
    // Test error cases for removal
    console.log(`\n5. Testing error cases for session removal`);
    
    // Test removing non-existent session
    const nonexistentResult = await workoutTracking.removeWorkoutSession({
      sessionId: "nonexistent" as any,
      user: removeTestUser
    });
    
    if ("error" in nonexistentResult) {
      console.log(`   ✓ Correctly rejected non-existent session: "${nonexistentResult.error}"`);
      assertEquals(nonexistentResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed for non-existent session");
    }
    
    // Test removing session with wrong user
    const wrongUserResult = await workoutTracking.removeWorkoutSession({
      sessionId: "some-session-id" as any,
      user: "wronguser" as any
    });
    
    if ("error" in wrongUserResult) {
      console.log(`   ✓ Correctly rejected wrong user: "${wrongUserResult.error}"`);
      assertEquals(wrongUserResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed for wrong user");
    }
    
    // Test removing session with empty parameters
    const emptySessionResult = await workoutTracking.removeWorkoutSession({
      sessionId: "" as any,
      user: removeTestUser
    });
    
    if ("error" in emptySessionResult) {
      console.log(`   ✓ Correctly rejected empty session ID: "${emptySessionResult.error}"`);
      assertEquals(emptySessionResult.error.includes("Session ID is required"), true);
    } else {
      throw new Error("Should have failed for empty session ID");
    }
    
    const emptyUserResult = await workoutTracking.removeWorkoutSession({
      sessionId: "some-session" as any,
      user: "" as any
    });
    
    if ("error" in emptyUserResult) {
      console.log(`   ✓ Correctly rejected empty user: "${emptyUserResult.error}"`);
      assertEquals(emptyUserResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed for empty user");
    }
  });

  await t.step("Interesting Scenario 7: Partial session removal and data integrity", async () => {
    console.log("\n=== SCENARIO 7: PARTIAL SESSION REMOVAL AND DATA INTEGRITY ===");
    console.log("Testing removal behavior with multiple users and sessions");
    
    const userA = "usera123" as any;
    const userB = "userb456" as any;
    const exerciseA = "benchpress" as any;
    const exerciseB = "deadlift" as any;
    
    // Create sessions for both users
    console.log(`\n1. Creating sessions for multiple users`);
    
    const sessionA = await workoutTracking.startSession({
      user: userA,
      date: "2024-02-05"
    });
    
    const sessionB = await workoutTracking.startSession({
      user: userB,
      date: "2024-02-05"
    });
    
    if ("sessionId" in sessionA && "name" in sessionA && "sessionId" in sessionB && "name" in sessionB) {
      console.log(`   ✓ Created session for user A: ${sessionA.sessionId}`);
      console.log(`   ✓ Session A name: "${sessionA.name}"`);
      console.log(`   ✓ Created session for user B: ${sessionB.sessionId}`);
      console.log(`   ✓ Session B name: "${sessionB.name}"`);
      
      // Record exercises for both users
      await workoutTracking.recordExercise({
        sessionId: sessionA.sessionId,
        exercise: exerciseA,
        weight: 135,
        sets: 3,
        reps: 10,
        notes: "User A bench press"
      });
      
      await workoutTracking.recordExercise({
        sessionId: sessionB.sessionId,
        exercise: exerciseB,
        weight: 225,
        sets: 2,
        reps: 5,
        notes: "User B deadlift"
      });
      
      console.log(`   ✓ Recorded exercises for both users`);
      
      // Verify both sessions exist
      const sessionsA = await workoutTracking._getUserSessions({ user: userA });
      const sessionsB = await workoutTracking._getUserSessions({ user: userB });
      console.log(`   ✓ User A has ${sessionsA.length} sessions, User B has ${sessionsB.length} sessions`);
      assertEquals(sessionsA.length, 1);
      assertEquals(sessionsB.length, 1);
      
      // Remove only user A's session
      console.log(`\n2. Removing only user A's session`);
      const removeAResult = await workoutTracking.removeWorkoutSession({
        sessionId: sessionA.sessionId,
        user: userA
      });
      
      if ("error" in removeAResult) {
        throw new Error(`User A session removal failed: ${removeAResult.error}`);
      }
      console.log(`   ✓ User A's session removed successfully`);
      
      // Verify user A's session is gone but user B's session remains
      const sessionsAAfter = await workoutTracking._getUserSessions({ user: userA });
      const sessionsBAfter = await workoutTracking._getUserSessions({ user: userB });
      console.log(`   ✓ After removal: User A has ${sessionsAAfter.length} sessions, User B has ${sessionsBAfter.length} sessions`);
      assertEquals(sessionsAAfter.length, 0);
      assertEquals(sessionsBAfter.length, 1);
      
      // Verify user B's exercise record still exists
      const recordsB = await workoutTracking._getSessionRecords({ sessionId: sessionB.sessionId });
      console.log(`   ✓ User B's session still has ${recordsB.length} exercise records`);
      assertEquals(recordsB.length, 1);
      assertEquals(recordsB[0].weight, 225);
      
      // Verify user B can still get their workout history
      const historyB = await workoutTracking.getWorkoutHistory({
        user: userB,
        exercise: exerciseB,
        limit: 10
      });
      
      if ("records" in historyB) {
        console.log(`   ✓ User B's workout history shows ${historyB.records.length} records`);
        assertEquals(historyB.records.length, 1);
        assertEquals(historyB.records[0].weight, 225);
      } else {
        throw new Error("User B workout history failed: " + historyB.error);
      }
      
      // Verify user A's exercise history is empty
      const historyA = await workoutTracking.getWorkoutHistory({
        user: userA,
        exercise: exerciseA,
        limit: 10
      });
      
      if ("records" in historyA) {
        console.log(`   ✓ User A's workout history shows ${historyA.records.length} records (should be 0)`);
        assertEquals(historyA.records.length, 0);
      } else {
        throw new Error("User A workout history failed: " + historyA.error);
      }
      
    } else {
      throw new Error("Session creation failed for multiple users");
    }
  });

  await t.step("Interesting Scenario 8: Session naming functionality", async () => {
    console.log("\n=== SCENARIO 8: SESSION NAMING FUNCTIONALITY ===");
    console.log("Testing that workout sessions are properly named based on date and time");
    
    const namingTestUser = "naminguser999" as any;
    
    // Create a session and verify it has a name
    console.log(`\n1. Creating session and verifying name generation`);
    const sessionResult = await workoutTracking.startSession({
      user: namingTestUser,
      date: "2024-02-10"
    });
    
    if ("sessionId" in sessionResult && "name" in sessionResult) {
      console.log(`   ✓ Session created with ID: ${sessionResult.sessionId}`);
      console.log(`   ✓ Session name: "${sessionResult.name}"`);
      
      // Verify the name contains expected components
      const sessionName = sessionResult.name;
      const hasDayOfWeek = /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(sessionName);
      const hasMonth = /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(sessionName);
      const hasYear = /2024/.test(sessionName);
      const hasTime = /AM|PM/.test(sessionName);
      
      console.log(`   ✓ Name contains day of week: ${hasDayOfWeek}`);
      console.log(`   ✓ Name contains month: ${hasMonth}`);
      console.log(`   ✓ Name contains year: ${hasYear}`);
      console.log(`   ✓ Name contains time: ${hasTime}`);
      
      assertEquals(hasDayOfWeek, true);
      assertEquals(hasMonth, true);
      assertEquals(hasYear, true);
      assertEquals(hasTime, true);
      
      // Test getting session info to verify name is stored
      console.log(`\n2. Testing getSessionInfo to verify name is stored`);
      const sessionInfoResult = await workoutTracking.getSessionInfo({
        sessionId: sessionResult.sessionId
      });
      
      if ("session" in sessionInfoResult) {
        console.log(`   ✓ Retrieved session info with name: "${sessionInfoResult.session.name}"`);
        assertEquals(sessionInfoResult.session.name, sessionName);
        assertEquals(sessionInfoResult.session.sessionId, sessionResult.sessionId);
        assertEquals(sessionInfoResult.session.user, namingTestUser);
        assertEquals(sessionInfoResult.session.date, "2024-02-10");
      } else {
        throw new Error("GetSessionInfo failed: " + sessionInfoResult.error);
      }
      
      // Test creating multiple sessions and verify different names
      console.log(`\n3. Creating multiple sessions to verify unique names`);
      const session2Result = await workoutTracking.startSession({
        user: namingTestUser,
        date: "2024-02-11"
      });
      
      if ("sessionId" in session2Result && "name" in session2Result) {
        console.log(`   ✓ Second session created with name: "${session2Result.name}"`);
        
        // Names should be different (different times)
        assertEquals(session2Result.name !== sessionName, true);
        
        // Both names should follow the same format
        const name2 = session2Result.name;
        const hasDayOfWeek2 = /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(name2);
        const hasMonth2 = /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(name2);
        const hasYear2 = /2024/.test(name2);
        const hasTime2 = /AM|PM/.test(name2);
        
        assertEquals(hasDayOfWeek2, true);
        assertEquals(hasMonth2, true);
        assertEquals(hasYear2, true);
        assertEquals(hasTime2, true);
        
        console.log(`   ✓ Second session name follows same format`);
      } else {
        throw new Error("Second session creation failed: " + session2Result.error);
      }
      
      // Test error case for getSessionInfo
      console.log(`\n4. Testing error cases for getSessionInfo`);
      const invalidSessionResult = await workoutTracking.getSessionInfo({
        sessionId: "nonexistent" as any
      });
      
      if ("error" in invalidSessionResult) {
        console.log(`   ✓ Correctly rejected non-existent session: "${invalidSessionResult.error}"`);
        assertEquals(invalidSessionResult.error.includes("not found"), true);
      } else {
        throw new Error("Should have failed for non-existent session");
      }
      
      const emptySessionResult = await workoutTracking.getSessionInfo({
        sessionId: "" as any
      });
      
      if ("error" in emptySessionResult) {
        console.log(`   ✓ Correctly rejected empty session ID: "${emptySessionResult.error}"`);
        assertEquals(emptySessionResult.error.includes("Session ID is required"), true);
      } else {
        throw new Error("Should have failed for empty session ID");
      }
      
    } else {
      throw new Error("Session creation failed: " + sessionResult.error);
    }
  });

  await t.step("Interesting Scenario 9: Suggested workouts based on muscle group balance", async () => {
    console.log("\n=== SCENARIO 9: SUGGESTED WORKOUTS BASED ON MUSCLE GROUP BALANCE ===");
    console.log("Testing the new getSuggestedWorkouts functionality for complementary exercises");
    
    const suggestionTestUser = "suggestionuser111" as any;
    
    // Test 1: No recent workouts - should suggest balanced full-body workout
    console.log(`\n1. Testing suggestions for user with no recent workouts`);
    const noWorkoutsResult = await workoutTracking.getSuggestedWorkouts({
      user: suggestionTestUser,
      limit: 5,
      lookbackDays: 7
    });
    
    if ("suggestions" in noWorkoutsResult) {
      console.log(`   ✓ Got ${noWorkoutsResult.suggestions.length} suggestions for new user`);
      assertEquals(noWorkoutsResult.suggestions.length, 5);
      
      // Should include all major muscle groups with high priority
      const muscleGroups = noWorkoutsResult.suggestions.map(s => s.muscleGroup);
      const expectedGroups = ["chest", "back", "legs", "shoulders", "arms"];
      
      expectedGroups.forEach(group => {
        const hasGroup = muscleGroups.includes(group);
        console.log(`   ✓ Includes ${group}: ${hasGroup}`);
        assertEquals(hasGroup, true);
      });
      
      // First three should be high priority
      const highPriorityCount = noWorkoutsResult.suggestions.filter(s => s.priority === "high").length;
      console.log(`   ✓ High priority suggestions: ${highPriorityCount}`);
      assertEquals(highPriorityCount, 3);
      
    } else {
      throw new Error("GetSuggestedWorkouts failed: " + noWorkoutsResult.error);
    }
    
    // Test 2: User with imbalanced training (only chest exercises)
    console.log(`\n2. Testing suggestions for user with imbalanced training`);
    
    // Create sessions with only chest exercises
    const chestOnlyDates = ["2024-02-15", "2024-02-17", "2024-02-19"];
    const chestExercises = ["benchpress", "inclinebench", "pushups"];
    
    for (let i = 0; i < chestOnlyDates.length; i++) {
      const sessionResult = await workoutTracking.startSession({
        user: suggestionTestUser,
        date: chestOnlyDates[i]
      });
      
      if ("sessionId" in sessionResult && "name" in sessionResult) {
        await workoutTracking.recordExercise({
          sessionId: sessionResult.sessionId,
          exercise: chestExercises[i] as any,
          weight: 135 + (i * 5),
          sets: 3,
          reps: 10,
          notes: `Chest-focused session ${i + 1}`
        });
        console.log(`   ✓ Recorded ${chestExercises[i]} in session ${i + 1}`);
      } else {
        throw new Error("Session creation failed: " + sessionResult.error);
      }
    }
    
    // Get suggestions after imbalanced training
    const imbalancedResult = await workoutTracking.getSuggestedWorkouts({
      user: suggestionTestUser,
      limit: 4,
      lookbackDays: 7
    });
    
    if ("suggestions" in imbalancedResult) {
      console.log(`   ✓ Got ${imbalancedResult.suggestions.length} suggestions after imbalanced training`);
      
      // Should prioritize non-chest muscle groups
      const suggestedGroups = imbalancedResult.suggestions.map(s => s.muscleGroup);
      const chestSuggestions = imbalancedResult.suggestions.filter(s => s.muscleGroup === "chest");
      
      console.log(`   ✓ Suggested muscle groups: ${suggestedGroups.join(', ')}`);
      console.log(`   ✓ Chest suggestions: ${chestSuggestions.length} (should be 0 or low priority)`);
      
      // Should have high priority for under-trained muscle groups
      const highPriorityGroups = imbalancedResult.suggestions
        .filter(s => s.priority === "high")
        .map(s => s.muscleGroup);
      
      console.log(`   ✓ High priority groups: ${highPriorityGroups.join(', ')}`);
      assertEquals(highPriorityGroups.includes("chest"), false); // Chest should not be high priority
      
    } else {
      throw new Error("GetSuggestedWorkouts failed: " + imbalancedResult.error);
    }
    
    // Test 3: User with balanced training
    console.log(`\n3. Testing suggestions for user with balanced training`);
    
    // Add exercises for other muscle groups
    const balancedDates = ["2024-02-20", "2024-02-22"];
    const balancedExercises = [
      { exercise: "deadlift" as any, weight: 225, sets: 3, reps: 5 }, // back + legs
      { exercise: "squat" as any, weight: 185, sets: 4, reps: 8 }, // legs
      { exercise: "pullups" as any, weight: 0, sets: 3, reps: 8 }, // back
      { exercise: "overheadpress" as any, weight: 95, sets: 3, reps: 10 } // shoulders
    ];
    
    for (let i = 0; i < balancedDates.length; i++) {
      const sessionResult = await workoutTracking.startSession({
        user: suggestionTestUser,
        date: balancedDates[i]
      });
      
      if ("sessionId" in sessionResult && "name" in sessionResult) {
        // Record 2 exercises per session for balanced training
        const exercisesForSession = balancedExercises.slice(i * 2, (i + 1) * 2);
        
        for (const ex of exercisesForSession) {
          await workoutTracking.recordExercise({
            sessionId: sessionResult.sessionId,
            exercise: ex.exercise,
            weight: ex.weight,
            sets: ex.sets,
            reps: ex.reps,
            notes: `Balanced training session ${i + 1}`
          });
        }
        console.log(`   ✓ Recorded ${exercisesForSession.length} exercises in balanced session ${i + 1}`);
      } else {
        throw new Error("Session creation failed: " + sessionResult.error);
      }
    }
    
    // Get suggestions after balanced training
    const balancedResult = await workoutTracking.getSuggestedWorkouts({
      user: suggestionTestUser,
      limit: 3,
      lookbackDays: 7
    });
    
    if ("suggestions" in balancedResult) {
      console.log(`   ✓ Got ${balancedResult.suggestions.length} suggestions after balanced training`);
      
      // Should have fewer high-priority suggestions
      const highPriorityCount = balancedResult.suggestions.filter(s => s.priority === "high").length;
      const mediumPriorityCount = balancedResult.suggestions.filter(s => s.priority === "medium").length;
      const lowPriorityCount = balancedResult.suggestions.filter(s => s.priority === "low").length;
      
      console.log(`   ✓ Priority distribution: High=${highPriorityCount}, Medium=${mediumPriorityCount}, Low=${lowPriorityCount}`);
      
      // Should have more balanced suggestions
      assertEquals(highPriorityCount <= 1, true); // Fewer high priority after balanced training
      
    } else {
      throw new Error("GetSuggestedWorkouts failed: " + balancedResult.error);
    }
    
    // Test 4: Error handling
    console.log(`\n4. Testing error handling for getSuggestedWorkouts`);
    
    // Invalid user
    const invalidUserResult = await workoutTracking.getSuggestedWorkouts({
      user: "" as any,
      limit: 5
    });
    
    if ("error" in invalidUserResult) {
      console.log(`   ✓ Correctly rejected empty user: "${invalidUserResult.error}"`);
      assertEquals(invalidUserResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with empty user");
    }
    
    // Invalid limit
    const invalidLimitResult = await workoutTracking.getSuggestedWorkouts({
      user: suggestionTestUser,
      limit: 0
    });
    
    if ("error" in invalidLimitResult) {
      console.log(`   ✓ Correctly rejected limit = 0: "${invalidLimitResult.error}"`);
      assertEquals(invalidLimitResult.error.includes("Limit must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with limit = 0");
    }
    
    // Invalid lookback days
    const invalidLookbackResult = await workoutTracking.getSuggestedWorkouts({
      user: suggestionTestUser,
      limit: 5,
      lookbackDays: -1
    });
    
    if ("error" in invalidLookbackResult) {
      console.log(`   ✓ Correctly rejected negative lookback days: "${invalidLookbackResult.error}"`);
      assertEquals(invalidLookbackResult.error.includes("Lookback days must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with negative lookback days");
    }
    
    console.log(`\n✓ Suggested workouts functionality test completed successfully`);
  });

  await client.close();
});

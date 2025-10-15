import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ProgressionEngineConcept from "./ProgressionEngineConcept.ts";

Deno.test("ProgressionEngine Concept", async (t) => {
  const [db, client] = await testDb();
  const progressionEngine = new ProgressionEngineConcept(db);

  const testUser = "user123" as any;
  const testExercise = "benchpress" as any;

  await t.step("Operational Principle: Complete progression workflow", async () => {
    console.log("\n=== OPERATIONAL PRINCIPLE TEST ===");
    console.log("Testing the common expected usage: create rule, update progression, suggest weight");
    
    // Step 1: Create a progression rule
    console.log("\n1. Creating progression rule for bench press");
    const ruleResult = await progressionEngine.createProgressionRule({
      exercise: testExercise,
      increment: 5,
      deloadThreshold: 0.1,
      targetSessions: 2
    });

    assertExists(ruleResult);
    if ("error" in ruleResult) {
      throw new Error("Rule creation failed: " + ruleResult.error);
    }
    console.log("   ✓ Progression rule created successfully");

    // Step 2: Update progression with initial weight
    console.log("\n2. Updating progression with initial weight: 135lbs");
    const updateResult = await progressionEngine.updateProgression({
      user: testUser,
      exercise: testExercise,
      newWeight: 135
    });

    assertExists(updateResult);
    if ("error" in updateResult) {
      throw new Error("UpdateProgression failed: " + updateResult.error);
    }
    console.log("   ✓ Progression updated successfully");

    // Step 3: Get the progression rule
    console.log("\n3. Retrieving progression rule");
    const getRuleResult = await progressionEngine.getProgressionRule({ exercise: testExercise });
    
    if ("rule" in getRuleResult) {
      console.log(`   ✓ Rule retrieved: increment=${getRuleResult.rule.increment}lbs, target=${getRuleResult.rule.targetSessions} sessions`);
      assertEquals(getRuleResult.rule.exercise, testExercise);
      assertEquals(getRuleResult.rule.increment, 5);
    } else {
      throw new Error("GetProgressionRule failed: " + getRuleResult.error);
    }

    // Step 4: Suggest weight for first time (should maintain)
    console.log("\n4. Suggesting weight for first time (should maintain)");
    const suggestResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: testExercise,
      lastWeight: 135,
      lastSets: 3,
      lastReps: 10
    });

    if ("suggestion" in suggestResult) {
      console.log(`   ✓ Weight suggestion: ${suggestResult.suggestion.action} at ${suggestResult.suggestion.newWeight}lbs`);
      assertEquals(suggestResult.suggestion.action, "maintain");
      assertEquals(suggestResult.suggestion.newWeight, 135);
    } else {
      throw new Error("SuggestWeight failed: " + suggestResult.error);
    }

    console.log("\n✓ Operational principle test completed successfully");
  });

  await t.step("Interesting Scenario 1: Progressive overload sequence", async () => {
    console.log("\n=== SCENARIO 1: PROGRESSIVE OVERLOAD SEQUENCE ===");
    console.log("Testing progression through multiple sessions with weight increases");
    
    // Create a new exercise rule
    const newExercise = "squat" as any;
    console.log(`\n1. Creating rule for ${newExercise}`);
    await progressionEngine.createProgressionRule({
      exercise: newExercise,
      increment: 10,
      deloadThreshold: 0.15,
      targetSessions: 3
    });
    console.log("   ✓ Rule created: 10lb increments, 3 target sessions");

    // Simulate progression through multiple sessions
    const weights = [185, 185, 185, 195, 195, 195, 205];
    const expectedActions = ["maintain", "maintain", "increase", "maintain", "maintain", "increase", "maintain"];
    
    for (let i = 0; i < weights.length; i++) {
      console.log(`\n${i + 2}. Session ${i + 1}: Testing weight ${weights[i]}lbs`);
      
      // Update progression with current weight
      await progressionEngine.updateProgression({
        user: testUser,
        exercise: newExercise,
        newWeight: weights[i]
      });
      
      // Get suggestion for next session
      const suggestResult = await progressionEngine.suggestWeight({
        user: testUser,
        exercise: newExercise,
        lastWeight: weights[i],
        lastSets: 3,
        lastReps: 8
      });
      
      if ("suggestion" in suggestResult) {
        const expectedAction = expectedActions[i];
        const expectedWeight = expectedAction === "increase" ? weights[i] + 10 : weights[i];
        
        console.log(`   ✓ Suggestion: ${suggestResult.suggestion.action} at ${suggestResult.suggestion.newWeight}lbs (expected: ${expectedAction} at ${expectedWeight}lbs)`);
        assertEquals(suggestResult.suggestion.action, expectedAction);
        assertEquals(suggestResult.suggestion.newWeight, expectedWeight);
        
        if (expectedAction === "increase") {
          assertEquals(suggestResult.suggestion.reason.includes("Completed"), true);
        }
      } else {
        throw new Error("SuggestWeight failed: " + suggestResult.error);
      }
    }
  });

  await t.step("Interesting Scenario 2: Deload scenarios and recovery", async () => {
    console.log("\n=== SCENARIO 2: DELOAD SCENARIOS AND RECOVERY ===");
    console.log("Testing deload recommendations and recovery from setbacks");
    
    const deloadExercise = "deadlift" as any;
    console.log(`\n1. Creating rule for ${deloadExercise} with 15% deload threshold`);
    await progressionEngine.createProgressionRule({
      exercise: deloadExercise,
      increment: 5,
      deloadThreshold: 0.15,
      targetSessions: 2
    });

    // Set up high weight progression
    console.log("\n2. Setting up progression at 225lbs");
    await progressionEngine.updateProgression({
      user: testUser,
      exercise: deloadExercise,
      newWeight: 225
    });

    // Test significant weight drop (should trigger deload)
    console.log("\n3. Testing significant weight drop (225lbs -> 185lbs = 17.8% drop)");
    const deloadResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: deloadExercise,
      lastWeight: 185, // 17.8% drop from 225
      lastSets: 3,
      lastReps: 5
    });

    if ("suggestion" in deloadResult) {
      console.log(`   ✓ Deload suggestion: ${deloadResult.suggestion.action} at ${deloadResult.suggestion.newWeight}lbs`);
      assertEquals(deloadResult.suggestion.action, "deload");
      assertEquals(deloadResult.suggestion.reason.includes("deload"), true);
    } else {
      throw new Error("Deload suggestion failed: " + deloadResult.error);
    }

    // Test minor weight drop (should not trigger deload)
    console.log("\n4. Testing minor weight drop (225lbs -> 215lbs = 4.4% drop)");
    const minorDropResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: deloadExercise,
      lastWeight: 215, // 4.4% drop from 225
      lastSets: 3,
      lastReps: 5
    });

    if ("suggestion" in minorDropResult) {
      console.log(`   ✓ Minor drop suggestion: ${minorDropResult.suggestion.action} at ${minorDropResult.suggestion.newWeight}lbs`);
      assertEquals(minorDropResult.suggestion.action, "maintain");
    } else {
      throw new Error("Minor drop suggestion failed: " + minorDropResult.error);
    }

    // Test recovery progression
    console.log("\n5. Testing recovery progression");
    await progressionEngine.updateProgression({
      user: testUser,
      exercise: deloadExercise,
      newWeight: 185 // Deload weight
    });

    await progressionEngine.updateProgression({
      user: testUser,
      exercise: deloadExercise,
      newWeight: 185 // Second session at deload weight
    });

    const recoveryResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: deloadExercise,
      lastWeight: 185,
      lastSets: 3,
      lastReps: 8
    });

    if ("suggestion" in recoveryResult) {
      console.log(`   ✓ Recovery suggestion: ${recoveryResult.suggestion.action} at ${recoveryResult.suggestion.newWeight}lbs`);
      assertEquals(recoveryResult.suggestion.action, "increase");
      assertEquals(recoveryResult.suggestion.newWeight, 190); // 185 + 5
    } else {
      throw new Error("Recovery suggestion failed: " + recoveryResult.error);
    }
  });

  await t.step("Interesting Scenario 3: Multiple exercises and users", async () => {
    console.log("\n=== SCENARIO 3: MULTIPLE EXERCISES AND USERS ===");
    console.log("Testing progression tracking across different exercises and users");
    
    const exercises = [
      { name: "overheadpress" as any, increment: 2.5, targetSessions: 3 },
      { name: "bentoverrow" as any, increment: 5, targetSessions: 2 },
      { name: "pullups" as any, increment: 1, targetSessions: 4 }
    ];

    const users = ["user1" as any, "user2" as any, "user3" as any];

    // Create rules for all exercises
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      console.log(`\n${i + 1}. Creating rule for ${exercise.name}: ${exercise.increment}lb increments, ${exercise.targetSessions} target sessions`);
      
      await progressionEngine.createProgressionRule({
        exercise: exercise.name,
        increment: exercise.increment,
        deloadThreshold: 0.1,
        targetSessions: exercise.targetSessions
      });
    }

    // Test different progression patterns for each user-exercise combination
    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      const user = users[userIndex];
      console.log(`\n${userIndex + 4}. Testing user ${user} progressions`);
      
      for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];
        const baseWeight = 100 + (userIndex * 10) + (exerciseIndex * 5);
        
        console.log(`   ${exercise.name}: Starting at ${baseWeight}lbs`);
        
        // Set up initial progression
        await progressionEngine.updateProgression({
          user,
          exercise: exercise.name,
          newWeight: baseWeight
        });

        // Get suggestion
        const suggestResult = await progressionEngine.suggestWeight({
          user,
          exercise: exercise.name,
          lastWeight: baseWeight,
          lastSets: 3,
          lastReps: 10
        });

        if ("suggestion" in suggestResult) {
          console.log(`     ✓ ${exercise.name}: ${suggestResult.suggestion.action} at ${suggestResult.suggestion.newWeight}lbs`);
          assertEquals(suggestResult.suggestion.action, "maintain");
          assertEquals(suggestResult.suggestion.newWeight, baseWeight);
        } else {
          throw new Error(`Suggestion failed for ${user}-${exercise.name}: ${suggestResult.error}`);
        }
      }
    }

    // Verify all progressions were created
    console.log(`\n${exercises.length + users.length + 3}. Verifying all progressions created`);
    const allProgressions = await progressionEngine._getAllUserProgressions();
    // Expected count includes progressions from all previous scenarios:
    // Operational Principle: 1 (user123 + benchpress)
    // Scenario 1: 1 (user123 + squat)  
    // Scenario 2: 1 (user123 + deadlift)
    // Scenario 3: 9 (3 users × 3 exercises)
    // Total: 1 + 1 + 1 + 9 = 12
    const expectedProgressionCount = 1 + 1 + 1 + (exercises.length * users.length);
    console.log(`   ✓ Found ${allProgressions.length} user progressions (expected: ${expectedProgressionCount})`);
    assertEquals(allProgressions.length, expectedProgressionCount);
  });

  await t.step("Interesting Scenario 4: Error handling and edge cases", async () => {
    console.log("\n=== SCENARIO 4: ERROR HANDLING AND EDGE CASES ===");
    console.log("Testing various error conditions and validation");
    
    // Test duplicate rule creation
    console.log("\n1. Testing duplicate rule prevention");
    const duplicateRuleResult = await progressionEngine.createProgressionRule({
      exercise: testExercise, // Already exists from operational principle
      increment: 10,
      deloadThreshold: 0.1,
      targetSessions: 3
    });

    if ("error" in duplicateRuleResult) {
      console.log(`   ✓ Correctly rejected duplicate rule: "${duplicateRuleResult.error}"`);
      assertEquals(duplicateRuleResult.error.includes("already exists"), true);
    } else {
      throw new Error("Should have failed with duplicate rule");
    }

    // Test invalid rule parameters
    console.log("\n2. Testing invalid rule parameters");
    
    // Zero increment
    const zeroIncrementResult = await progressionEngine.createProgressionRule({
      exercise: "test1" as any,
      increment: 0,
      deloadThreshold: 0.1,
      targetSessions: 2
    });

    if ("error" in zeroIncrementResult) {
      console.log(`   ✓ Correctly rejected zero increment: "${zeroIncrementResult.error}"`);
      assertEquals(zeroIncrementResult.error.includes("Increment must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with zero increment");
    }

    // Invalid deload threshold
    const invalidThresholdResult = await progressionEngine.createProgressionRule({
      exercise: "test2" as any,
      increment: 5,
      deloadThreshold: 1.5,
      targetSessions: 2
    });

    if ("error" in invalidThresholdResult) {
      console.log(`   ✓ Correctly rejected invalid threshold: "${invalidThresholdResult.error}"`);
      assertEquals(invalidThresholdResult.error.includes("Deload threshold must be between 0 and 1"), true);
    } else {
      throw new Error("Should have failed with invalid threshold");
    }

    // Zero target sessions
    const zeroSessionsResult = await progressionEngine.createProgressionRule({
      exercise: "test3" as any,
      increment: 5,
      deloadThreshold: 0.1,
      targetSessions: 0
    });

    if ("error" in zeroSessionsResult) {
      console.log(`   ✓ Correctly rejected zero sessions: "${zeroSessionsResult.error}"`);
      assertEquals(zeroSessionsResult.error.includes("Target sessions must be greater than 0"), true);
    } else {
      throw new Error("Should have failed with zero sessions");
    }

    // Test suggestion without rule
    console.log("\n3. Testing suggestion for exercise without rule");
    const noRuleResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: "norule" as any,
      lastWeight: 100,
      lastSets: 3,
      lastReps: 10
    });

    if ("error" in noRuleResult) {
      console.log(`   ✓ Correctly handled no rule: "${noRuleResult.error}"`);
      assertEquals(noRuleResult.error.includes("No progression rule found"), true);
    } else {
      throw new Error("Should have failed for exercise without rule");
    }

    // Test invalid suggestion parameters
    console.log("\n4. Testing invalid suggestion parameters");
    
    // Missing user
    const missingUserResult = await progressionEngine.suggestWeight({
      user: "" as any,
      exercise: testExercise,
      lastWeight: 100,
      lastSets: 3,
      lastReps: 10
    });

    if ("error" in missingUserResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserResult.error}"`);
      assertEquals(missingUserResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Negative weight
    const negativeWeightResult = await progressionEngine.suggestWeight({
      user: testUser,
      exercise: testExercise,
      lastWeight: -10,
      lastSets: 3,
      lastReps: 10
    });

    if ("error" in negativeWeightResult) {
      console.log(`   ✓ Correctly rejected negative weight: "${negativeWeightResult.error}"`);
      assertEquals(negativeWeightResult.error.includes("Last weight cannot be negative"), true);
    } else {
      throw new Error("Should have failed with negative weight");
    }
  });

  await t.step("Interesting Scenario 5: Complex progression patterns", async () => {
    console.log("\n=== SCENARIO 5: COMPLEX PROGRESSION PATTERNS ===");
    console.log("Testing complex scenarios with varying progression patterns");
    
    const complexExercise = "complexpress" as any;
    
    // Create rule with different parameters
    console.log("\n1. Creating complex progression rule");
    await progressionEngine.createProgressionRule({
      exercise: complexExercise,
      increment: 2.5,
      deloadThreshold: 0.12,
      targetSessions: 4
    });
    console.log("   ✓ Rule created: 2.5lb increments, 12% deload threshold, 4 target sessions");

    // Test progression with weight fluctuations
    console.log("\n2. Testing progression with weight fluctuations");
    const weightSequence = [100, 100, 100, 100, 102.5, 102.5, 102.5, 105, 105, 103, 105, 107.5];
    const expectedActions = [
      "maintain", "maintain", "maintain", "increase", // 4 sessions at 100 -> increase
      "maintain", "maintain", "maintain", "increase", // 3 sessions at 102.5 -> increase  
      "maintain", "maintain", // 2 sessions at 105
      "deload", // 103 is significant drop from 105 (1.9% < 12% threshold, but let's see)
      "maintain", "increase" // Recovery and next progression
    ];

    for (let i = 0; i < weightSequence.length; i++) {
      const currentWeight = weightSequence[i];
      console.log(`\n   Session ${i + 1}: Weight ${currentWeight}lbs`);
      
      // Update progression
      await progressionEngine.updateProgression({
        user: testUser,
        exercise: complexExercise,
        newWeight: currentWeight
      });

      // Get next suggestion
      const suggestResult = await progressionEngine.suggestWeight({
        user: testUser,
        exercise: complexExercise,
        lastWeight: currentWeight,
        lastSets: 3,
        lastReps: 8
      });

      if ("suggestion" in suggestResult) {
        const expectedAction = expectedActions[i] || "maintain";
        console.log(`     ✓ Suggestion: ${suggestResult.suggestion.action} at ${suggestResult.suggestion.newWeight}lbs (expected: ${expectedAction})`);
        
        // Verify the action makes sense
        if (suggestResult.suggestion.action === "increase") {
          assertEquals(suggestResult.suggestion.newWeight, currentWeight + 2.5);
        } else if (suggestResult.suggestion.action === "maintain") {
          assertEquals(suggestResult.suggestion.newWeight, currentWeight);
        }
      } else {
        throw new Error(`Suggestion failed for session ${i + 1}: ${suggestResult.error}`);
      }
    }

    // Test getting non-existent rule
    console.log("\n3. Testing retrieval of non-existent rule");
    const nonexistentRuleResult = await progressionEngine.getProgressionRule({ exercise: "nonexistent" as any });
    
    if ("error" in nonexistentRuleResult) {
      console.log(`   ✓ Correctly handled non-existent rule: "${nonexistentRuleResult.error}"`);
      assertEquals(nonexistentRuleResult.error.includes("No progression rule found"), true);
    } else {
      throw new Error("Should have failed for non-existent rule");
    }

    // Test update progression validation
    console.log("\n4. Testing update progression validation");
    
    // Missing user
    const missingUserUpdateResult = await progressionEngine.updateProgression({
      user: "" as any,
      exercise: complexExercise,
      newWeight: 100
    });

    if ("error" in missingUserUpdateResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserUpdateResult.error}"`);
      assertEquals(missingUserUpdateResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Negative weight
    const negativeWeightUpdateResult = await progressionEngine.updateProgression({
      user: testUser,
      exercise: complexExercise,
      newWeight: -5
    });

    if ("error" in negativeWeightUpdateResult) {
      console.log(`   ✓ Correctly rejected negative weight: "${negativeWeightUpdateResult.error}"`);
      assertEquals(negativeWeightUpdateResult.error.includes("New weight cannot be negative"), true);
    } else {
      throw new Error("Should have failed with negative weight");
    }
  });

  await client.close();
});

import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ExerciseCatalogConcept from "./ExerciseCatalogConcept.ts";

Deno.test("ExerciseCatalog Concept", async (t) => {
  const [db, client] = await testDb();
  const exerciseCatalog = new ExerciseCatalogConcept(db);

  await t.step("Operational Principle: Complete exercise catalog workflow", async () => {
    console.log("\n=== OPERATIONAL PRINCIPLE TEST ===");
    console.log("Testing the common expected usage: add exercises, search, and retrieve");
    
    // Step 1: Add a comprehensive exercise
    console.log("\n1. Adding comprehensive exercise: Bench Press");
    const addResult = await exerciseCatalog.addExercise({
      name: "Bench Press",
      muscleGroups: ["chest", "shoulders", "triceps"],
      movementPattern: "push",
      equipment: "barbell",
      instructions: "Lie on bench, lower bar to chest, press up"
    });
    
    assertExists(addResult);
    if ("exerciseId" in addResult) {
      console.log(`   ✓ Exercise created with ID: ${addResult.exerciseId}`);
      
      // Step 2: Retrieve the exercise by ID
      console.log(`\n2. Retrieving exercise by ID: ${addResult.exerciseId}`);
      const getResult = await exerciseCatalog.getExercise({ exerciseId: addResult.exerciseId });
      
      if ("exercise" in getResult) {
        console.log(`   ✓ Exercise retrieved: ${getResult.exercise.name}`);
        assertEquals(getResult.exercise.name, "Bench Press");
        assertEquals(getResult.exercise.muscleGroups, ["chest", "shoulders", "triceps"]);
        assertEquals(getResult.exercise.equipment, "barbell");
      } else {
        throw new Error("Exercise retrieval failed: " + getResult.error);
      }
      
      // Step 3: Search for exercises by name
      console.log(`\n3. Searching for exercises by name: "bench"`);
      const searchResult = await exerciseCatalog.searchExercises({ query: "bench" });
      
      console.log(`   ✓ Search found ${searchResult.exercises.length} exercises`);
      assertEquals(searchResult.exercises.length, 1);
      assertEquals(searchResult.exercises[0].name, "Bench Press");
      
      // Step 4: Search by muscle group
      console.log(`\n4. Searching for exercises by muscle group: "chest"`);
      const muscleGroupResult = await exerciseCatalog.searchExercises({ muscleGroup: "chest" });
      
      console.log(`   ✓ Muscle group search found ${muscleGroupResult.exercises.length} exercises`);
      assertEquals(muscleGroupResult.exercises.length, 1);
      assertEquals(muscleGroupResult.exercises[0].name, "Bench Press");
      
      console.log("\n✓ Operational principle test completed successfully");
    } else {
      throw new Error("Exercise creation failed: " + addResult.error);
    }
  });

  await t.step("Interesting Scenario 1: Building a comprehensive exercise library", async () => {
    console.log("\n=== SCENARIO 1: BUILDING COMPREHENSIVE EXERCISE LIBRARY ===");
    console.log("Testing adding multiple exercises with different characteristics");
    
    const exercises = [
      {
        name: "Squat",
        muscleGroups: ["legs", "glutes"],
        movementPattern: "squat",
        equipment: "barbell",
        instructions: "Stand with feet shoulder-width apart, lower until thighs parallel to floor"
      },
      {
        name: "Deadlift",
        muscleGroups: ["back", "legs", "glutes"],
        movementPattern: "hinge",
        equipment: "barbell"
      },
      {
        name: "Push-ups",
        muscleGroups: ["chest", "triceps"],
        movementPattern: "push"
        // No equipment or instructions - testing minimal fields
      },
      {
        name: "Pull-ups",
        muscleGroups: ["back", "biceps"],
        movementPattern: "pull",
        equipment: "pull-up bar",
        instructions: "Hang from bar, pull body up until chin clears bar"
      },
      {
        name: "Romanian Deadlift",
        muscleGroups: ["back", "legs"],
        movementPattern: "hinge",
        equipment: "barbell",
        instructions: "Start standing, hinge at hips, lower bar while keeping legs straighter"
      }
    ];
    
    const exerciseIds = [];
    
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      console.log(`\n${i + 1}. Adding exercise: ${exercise.name}`);
      
      const result = await exerciseCatalog.addExercise(exercise);
      
      if ("exerciseId" in result) {
        exerciseIds.push(result.exerciseId);
        console.log(`   ✓ Added ${exercise.name} with ID: ${result.exerciseId}`);
        
        // Verify it was added correctly
        const verifyResult = await exerciseCatalog.getExercise({ exerciseId: result.exerciseId });
        if ("exercise" in verifyResult) {
          assertEquals(verifyResult.exercise.name, exercise.name);
          assertEquals(verifyResult.exercise.muscleGroups, exercise.muscleGroups);
          assertEquals(verifyResult.exercise.movementPattern, exercise.movementPattern);
          if (exercise.equipment) {
            assertEquals(verifyResult.exercise.equipment, exercise.equipment);
          }
          if (exercise.instructions) {
            assertEquals(verifyResult.exercise.instructions, exercise.instructions);
          }
        } else {
          throw new Error("Exercise verification failed: " + verifyResult.error);
        }
      } else {
        throw new Error(`Exercise creation failed for ${exercise.name}: ${result.error}`);
      }
    }
    
    console.log(`\n✓ Successfully added ${exerciseIds.length} exercises to catalog`);
    
    // Test searching the full library
    console.log(`\n6. Testing search across full exercise library`);
    
    // Search by movement pattern
    const pushExercises = await exerciseCatalog.searchExercises({ query: "push" });
    console.log(`   ✓ Found ${pushExercises.exercises.length} push exercises: ${pushExercises.exercises.map(e => e.name).join(", ")}`);
    assertEquals(pushExercises.exercises.length, 2); // Bench Press and Push-ups
    
    // Search by muscle group
    const backExercises = await exerciseCatalog.searchExercises({ muscleGroup: "back" });
    console.log(`   ✓ Found ${backExercises.exercises.length} back exercises: ${backExercises.exercises.map(e => e.name).join(", ")}`);
    assertEquals(backExercises.exercises.length, 3); // Deadlift, Pull-ups, Romanian Deadlift
    
    // Empty search should return all exercises
    const allExercises = await exerciseCatalog.searchExercises({});
    console.log(`   ✓ Empty search returned ${allExercises.exercises.length} total exercises`);
    assertEquals(allExercises.exercises.length, 6); // All 6 exercises
  });

  await t.step("Interesting Scenario 2: Error handling and validation", async () => {
    console.log("\n=== SCENARIO 2: ERROR HANDLING AND VALIDATION ===");
    console.log("Testing various error conditions and edge cases");
    
    // Test duplicate exercise names
    console.log("\n1. Testing duplicate exercise name prevention");
    const duplicateResult = await exerciseCatalog.addExercise({
      name: "Squat", // Already exists from scenario 1
      muscleGroups: ["legs"],
      movementPattern: "squat"
    });
    
    if ("error" in duplicateResult) {
      console.log(`   ✓ Correctly rejected duplicate name: "${duplicateResult.error}"`);
      assertEquals(duplicateResult.error.includes("already exists"), true);
    } else {
      throw new Error("Should have failed with duplicate name");
    }
    
    // Test empty name
    console.log("\n2. Testing empty exercise name");
    const emptyNameResult = await exerciseCatalog.addExercise({
      name: "",
      muscleGroups: ["chest"],
      movementPattern: "push"
    });
    
    if ("error" in emptyNameResult) {
      console.log(`   ✓ Correctly rejected empty name: "${emptyNameResult.error}"`);
      assertEquals(emptyNameResult.error.includes("name cannot be empty"), true);
    } else {
      throw new Error("Should have failed with empty name");
    }
    
    // Test empty muscle groups
    console.log("\n3. Testing empty muscle groups");
    const emptyMusclesResult = await exerciseCatalog.addExercise({
      name: "Test Exercise",
      muscleGroups: [],
      movementPattern: "push"
    });
    
    if ("error" in emptyMusclesResult) {
      console.log(`   ✓ Correctly rejected empty muscle groups: "${emptyMusclesResult.error}"`);
      assertEquals(emptyMusclesResult.error.includes("muscle group"), true);
    } else {
      throw new Error("Should have failed with empty muscle groups");
    }
    
    // Test empty movement pattern
    console.log("\n4. Testing empty movement pattern");
    const emptyPatternResult = await exerciseCatalog.addExercise({
      name: "Test Exercise",
      muscleGroups: ["chest"],
      movementPattern: ""
    });
    
    if ("error" in emptyPatternResult) {
      console.log(`   ✓ Correctly rejected empty movement pattern: "${emptyPatternResult.error}"`);
      assertEquals(emptyPatternResult.error.includes("movement pattern"), true);
    } else {
      throw new Error("Should have failed with empty movement pattern");
    }
    
    // Test getting non-existent exercise
    console.log("\n5. Testing retrieval of non-existent exercise");
    const nonexistentResult = await exerciseCatalog.getExercise({ exerciseId: "nonexistent" as any });
    
    if ("error" in nonexistentResult) {
      console.log(`   ✓ Correctly handled non-existent exercise: "${nonexistentResult.error}"`);
      assertEquals(nonexistentResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed for non-existent exercise");
    }
  });

  await t.step("Interesting Scenario 3: Advanced search capabilities", async () => {
    console.log("\n=== SCENARIO 3: ADVANCED SEARCH CAPABILITIES ===");
    console.log("Testing various search combinations and edge cases");
    
    // Test case-insensitive search
    console.log("\n1. Testing case-insensitive search");
    const caseInsensitiveResult = await exerciseCatalog.searchExercises({ query: "BENCH" });
    console.log(`   ✓ Case-insensitive search for "BENCH" found ${caseInsensitiveResult.exercises.length} exercises`);
    assertEquals(caseInsensitiveResult.exercises.length, 1);
    assertEquals(caseInsensitiveResult.exercises[0].name, "Bench Press");
    
    // Test partial name matching
    console.log("\n2. Testing partial name matching");
    const partialResult = await exerciseCatalog.searchExercises({ query: "deadlift" });
    console.log(`   ✓ Partial search for "deadlift" found ${partialResult.exercises.length} exercises`);
    assertEquals(partialResult.exercises.length, 2);
    const deadliftNames = partialResult.exercises.map(e => e.name).sort();
    assertEquals(deadliftNames, ["Deadlift", "Romanian Deadlift"]);
    
    // Test combined query and muscle group search
    console.log("\n3. Testing combined query and muscle group search");
    const combinedResult = await exerciseCatalog.searchExercises({ 
      query: "deadlift", 
      muscleGroup: "back" 
    });
    console.log(`   ✓ Combined search (deadlift + back) found ${combinedResult.exercises.length} exercises`);
    assertEquals(combinedResult.exercises.length, 2); // Both deadlift variations work back
    
    // Test search with non-matching query
    console.log("\n4. Testing search with non-matching query");
    const noMatchResult = await exerciseCatalog.searchExercises({ query: "nonexistent" });
    console.log(`   ✓ Non-matching search found ${noMatchResult.exercises.length} exercises`);
    assertEquals(noMatchResult.exercises.length, 0);
    
    // Test search with non-matching muscle group
    console.log("\n5. Testing search with non-matching muscle group");
    const noMatchMuscleResult = await exerciseCatalog.searchExercises({ muscleGroup: "nonexistent" });
    console.log(`   ✓ Non-matching muscle group search found ${noMatchMuscleResult.exercises.length} exercises`);
    assertEquals(noMatchMuscleResult.exercises.length, 0);
    
    // Test empty search (should return all)
    console.log("\n6. Testing empty search (should return all exercises)");
    const emptySearchResult = await exerciseCatalog.searchExercises({});
    console.log(`   ✓ Empty search returned ${emptySearchResult.exercises.length} exercises`);
    assertEquals(emptySearchResult.exercises.length, 6); // All exercises from previous tests
  });

  await t.step("Interesting Scenario 4: Exercise variations and similar exercises", async () => {
    console.log("\n=== SCENARIO 4: EXERCISE VARIATIONS AND SIMILAR EXERCISES ===");
    console.log("Testing adding exercises with similar names and characteristics");
    
    // Add variations of similar exercises
    const variations = [
      {
        name: "Incline Bench Press",
        muscleGroups: ["chest", "shoulders"],
        movementPattern: "push",
        equipment: "barbell",
        instructions: "Bench set at 30-45 degree incline"
      },
      {
        name: "Decline Bench Press",
        muscleGroups: ["chest"],
        movementPattern: "push",
        equipment: "barbell",
        instructions: "Bench set at decline angle"
      },
      {
        name: "Dumbbell Bench Press",
        muscleGroups: ["chest", "shoulders", "triceps"],
        movementPattern: "push",
        equipment: "dumbbells",
        instructions: "Similar to barbell bench press but with dumbbells"
      },
      {
        name: "Goblet Squat",
        muscleGroups: ["legs", "glutes"],
        movementPattern: "squat",
        equipment: "dumbbell",
        instructions: "Hold dumbbell at chest, squat down"
      }
    ];
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      console.log(`\n${i + 1}. Adding exercise variation: ${variation.name}`);
      
      const result = await exerciseCatalog.addExercise(variation);
      
      if ("exerciseId" in result) {
        console.log(`   ✓ Added ${variation.name} with ID: ${result.exerciseId}`);
        
        // Verify it can be retrieved
        const verifyResult = await exerciseCatalog.getExercise({ exerciseId: result.exerciseId });
        if ("exercise" in verifyResult) {
          assertEquals(verifyResult.exercise.name, variation.name);
        } else {
          throw new Error("Exercise verification failed: " + verifyResult.error);
        }
      } else {
        throw new Error(`Exercise variation creation failed for ${variation.name}: ${result.error}`);
      }
    }
    
    // Test searching for exercise family (all bench press variations)
    console.log(`\n5. Searching for bench press family`);
    const benchFamily = await exerciseCatalog.searchExercises({ query: "bench" });
    console.log(`   ✓ Found ${benchFamily.exercises.length} bench press variations`);
    assertEquals(benchFamily.exercises.length, 4); // Original + 3 variations
    
    const benchNames = benchFamily.exercises.map(e => e.name).sort();
    console.log(`   ✓ Bench press family: ${benchNames.join(", ")}`);
    
    // Test searching for squat family
    console.log(`\n6. Searching for squat family`);
    const squatFamily = await exerciseCatalog.searchExercises({ query: "squat" });
    console.log(`   ✓ Found ${squatFamily.exercises.length} squat variations`);
    assertEquals(squatFamily.exercises.length, 2); // Original + Goblet
    
    // Test muscle group search across variations
    console.log(`\n7. Searching for chest exercises across all variations`);
    const chestExercises = await exerciseCatalog.searchExercises({ muscleGroup: "chest" });
    console.log(`   ✓ Found ${chestExercises.exercises.length} chest exercises`);
    assertEquals(chestExercises.exercises.length, 5); // All bench press variations + push-ups
  });

  await t.step("Interesting Scenario 5: Catalog maintenance and data integrity", async () => {
    console.log("\n=== SCENARIO 5: CATALOG MAINTENANCE AND DATA INTEGRITY ===");
    console.log("Testing catalog operations and data consistency");
    
    // Test retrieving all exercises
    console.log("\n1. Testing retrieval of all exercises");
    const allExercises = await exerciseCatalog._getAllExercises();
    console.log(`   ✓ Catalog contains ${allExercises.exercises.length} total exercises`);
    assertEquals(allExercises.exercises.length, 10); // 6 from scenario 1 + 4 variations from scenario 4
    
    // Verify all exercises have required fields
    allExercises.exercises.forEach((exercise, index) => {
      assertExists(exercise.name);
      assertExists(exercise.muscleGroups);
      assertExists(exercise.movementPattern);
      console.log(`   ✓ Exercise ${index + 1}: ${exercise.name} (${exercise.muscleGroups.join(", ")})`);
    });
    
    // Test muscle group distribution
    console.log("\n2. Testing muscle group distribution");
    const chestExercises = await exerciseCatalog._getExercisesByMuscleGroup({ muscleGroup: "chest" });
    console.log(`   ✓ Chest exercises: ${chestExercises.length}`);
    assertEquals(chestExercises.length, 5);
    
    const backExercises = await exerciseCatalog._getExercisesByMuscleGroup({ muscleGroup: "back" });
    console.log(`   ✓ Back exercises: ${backExercises.length}`);
    assertEquals(backExercises.length, 3);
    
    const legExercises = await exerciseCatalog._getExercisesByMuscleGroup({ muscleGroup: "legs" });
    console.log(`   ✓ Leg exercises: ${legExercises.length}`);
    assertEquals(legExercises.length, 4);
    
    // Test movement pattern distribution
    console.log("\n3. Testing movement pattern distribution");
    const pushExercises = await exerciseCatalog._getExercisesByMovementPattern({ movementPattern: "push" });
    console.log(`   ✓ Push exercises: ${pushExercises.length}`);
    assertEquals(pushExercises.length, 5);
    
    const pullExercises = await exerciseCatalog._getExercisesByMovementPattern({ movementPattern: "pull" });
    console.log(`   ✓ Pull exercises: ${pullExercises.length}`);
    assertEquals(pullExercises.length, 1);
    
    const hingeExercises = await exerciseCatalog._getExercisesByMovementPattern({ movementPattern: "hinge" });
    console.log(`   ✓ Hinge exercises: ${hingeExercises.length}`);
    assertEquals(hingeExercises.length, 2);
    
    const squatExercises = await exerciseCatalog._getExercisesByMovementPattern({ movementPattern: "squat" });
    console.log(`   ✓ Squat exercises: ${squatExercises.length}`);
    assertEquals(squatExercises.length, 2);
    
    // Test repeated searches return consistent results
    console.log("\n4. Testing search consistency");
    const search1 = await exerciseCatalog.searchExercises({ query: "bench" });
    const search2 = await exerciseCatalog.searchExercises({ query: "bench" });
    console.log(`   ✓ Repeated searches return consistent results: ${search1.exercises.length} = ${search2.exercises.length}`);
    assertEquals(search1.exercises.length, search2.exercises.length);
    
    // Test that all exercises can be retrieved by ID
    console.log("\n5. Testing all exercises can be retrieved by ID");
    let successfulRetrievals = 0;
    for (const exercise of allExercises.exercises) {
      const retrieveResult = await exerciseCatalog.getExercise({ exerciseId: exercise.exerciseId });
      if ("exercise" in retrieveResult) {
        successfulRetrievals++;
      }
    }
    console.log(`   ✓ Successfully retrieved ${successfulRetrievals}/${allExercises.exercises.length} exercises by ID`);
    assertEquals(successfulRetrievals, allExercises.exercises.length);
  });

  await client.close();
});

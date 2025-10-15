import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import RoutinePlannerConcept from "./RoutinePlannerConcept.ts";

Deno.test("RoutinePlanner Concept", async (t) => {
  const [db, client] = await testDb();
  const routinePlanner = new RoutinePlannerConcept(db);

  const testUser = "user123" as any;
  const testExercise1 = "benchpress" as any;
  const testExercise2 = "squat" as any;
  const testDate = "2024-01-15";

  await t.step("Operational Principle: Complete routine planning workflow", async () => {
    console.log("\n=== OPERATIONAL PRINCIPLE TEST ===");
    console.log("Testing the common expected usage: create template, set default, get suggested workout");
    
    // Step 1: Create a workout template
    console.log("\n1. Creating workout template: Push Day");
    const templateResult = await routinePlanner.createTemplate({
      user: testUser,
      name: "Push Day",
      exercises: [testExercise1, testExercise2]
    });

    assertExists(templateResult);
    if ("templateId" in templateResult) {
      console.log(`   ✓ Template created with ID: ${templateResult.templateId}`);
      
      // Step 2: Set template as default for user
      console.log("\n2. Setting template as default for user");
      const defaultResult = await routinePlanner.setDefaultTemplate({
        user: testUser,
        templateId: templateResult.templateId
      });

      assertExists(defaultResult);
      if ("error" in defaultResult) {
        throw new Error("SetDefaultTemplate failed: " + defaultResult.error);
      }
      console.log("   ✓ Template set as default successfully");
      
      // Step 3: Get suggested workout
      console.log("\n3. Getting suggested workout for user");
      const suggestResult = await routinePlanner.getSuggestedWorkout({
        user: testUser,
        date: testDate
      });

      if ("template" in suggestResult) {
        assertExists(suggestResult.template);
        console.log(`   ✓ Suggested workout: ${suggestResult.template.name}`);
        assertEquals(suggestResult.template.name, "Push Day");
        assertEquals(suggestResult.template.exercises, [testExercise1, testExercise2]);
      } else {
        throw new Error("GetSuggestedWorkout failed: " + suggestResult.error);
      }
      
      // Step 4: Update volume for tracking
      console.log("\n4. Updating weekly volume for tracking");
      const volumeResult = await routinePlanner.updateVolume({
        user: testUser,
        exercise: testExercise1,
        sets: 3,
        reps: 10,
        weight: 135,
        weekStart: "2024-01-15"
      });

      if ("error" in volumeResult) {
        throw new Error("UpdateVolume failed: " + volumeResult.error);
      }
      console.log("   ✓ Volume updated successfully");
      
      console.log("\n✓ Operational principle test completed successfully");
    } else {
      throw new Error("Template creation failed: " + templateResult.error);
    }
  });

  await t.step("Interesting Scenario 1: Multiple templates and template management", async () => {
    console.log("\n=== SCENARIO 1: MULTIPLE TEMPLATES AND TEMPLATE MANAGEMENT ===");
    console.log("Testing creation and management of multiple workout templates");
    
    // Clear existing data for clean test
    console.log("\n0. Clearing existing data for clean test");
    await routinePlanner.workoutTemplates.deleteMany({});
    await routinePlanner.userTemplates.deleteMany({});
    await routinePlanner.weeklyVolume.deleteMany({});
    console.log("   ✓ Cleared existing templates and data");
    
    const templates = [
      {
        name: "Pull Day",
        exercises: ["pullups" as any, "bentoverrow" as any, "bicepcurl" as any]
      },
      {
        name: "Leg Day", 
        exercises: ["squat" as any, "deadlift" as any, "lunges" as any]
      },
      {
        name: "Full Body",
        exercises: ["benchpress" as any, "squat" as any, "pullups" as any]
      },
      {
        name: "Upper Body",
        exercises: ["benchpress" as any, "pullups" as any, "overheadpress" as any, "bentoverrow" as any]
      }
    ];

    const createdTemplates = [];

    // Create multiple templates
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      console.log(`\n${i + 1}. Creating template: ${template.name}`);
      
      const result = await routinePlanner.createTemplate({
        user: testUser,
        name: template.name,
        exercises: template.exercises
      });

      if ("templateId" in result) {
        createdTemplates.push({ id: result.templateId, ...template });
        console.log(`   ✓ Created ${template.name} with ID: ${result.templateId}`);
        console.log(`     Exercises: ${template.exercises.join(", ")}`);
      } else {
        throw new Error(`Template creation failed for ${template.name}: ${result.error}`);
      }
    }

    // Set different templates as default
    console.log(`\n${templates.length + 1}. Setting Full Body as default template`);
    const fullBodyTemplate = createdTemplates.find(t => t.name === "Full Body");
    if (fullBodyTemplate) {
      const defaultResult = await routinePlanner.setDefaultTemplate({
        user: testUser,
        templateId: fullBodyTemplate.id
      });

      if ("error" in defaultResult) {
        throw new Error("SetDefaultTemplate failed: " + defaultResult.error);
      }
      console.log("   ✓ Full Body template set as default");

      // Verify default template is returned
      const suggestResult = await routinePlanner.getSuggestedWorkout({
        user: testUser,
        date: "2024-01-16"
      });

      if ("template" in suggestResult) {
        assertExists(suggestResult.template);
        console.log(`   ✓ Suggested workout: ${suggestResult.template.name}`);
        assertEquals(suggestResult.template.name, "Full Body");
      } else {
        throw new Error("GetSuggestedWorkout failed: " + suggestResult.error);
      }
    }

    // Test retrieving all templates
    console.log(`\n${templates.length + 2}. Retrieving all templates`);
    const allTemplates = await routinePlanner._getAllTemplates();
    console.log(`   ✓ Found ${allTemplates.length} total templates`);
    assertEquals(allTemplates.length, templates.length); // Only the templates we just created
    
    const templateNames = allTemplates.map(t => t.name).sort();
    console.log(`   ✓ Template names: ${templateNames.join(", ")}`);

    // Test retrieving user-specific templates
    const userTemplates = await routinePlanner._getUserTemplates({ user: testUser });
    console.log(`   ✓ User has ${userTemplates.length} templates`);
    assertEquals(userTemplates.length, allTemplates.length);
  });

  await t.step("Interesting Scenario 2: Volume tracking and muscle group balance", async () => {
    console.log("\n=== SCENARIO 2: VOLUME TRACKING AND MUSCLE GROUP BALANCE ===");
    console.log("Testing volume accumulation and balance checking across muscle groups");
    
    const volumeUser = "volumeuser" as any;
    const weekStart = "2024-01-15";
    
    // Create volume records for different muscle groups
    console.log("\n1. Creating volume records for different muscle groups");
    const volumeRecords = [
      { exercise: "benchpress" as any, sets: 4, reps: 8, weight: 135 }, // chest
      { exercise: "inclinebench" as any, sets: 3, reps: 10, weight: 115 }, // chest
      { exercise: "squat" as any, sets: 5, reps: 5, weight: 185 }, // legs
      { exercise: "deadlift" as any, sets: 3, reps: 8, weight: 225 }, // back + legs
      { exercise: "pullups" as any, sets: 4, reps: 8, weight: 0 }, // back (bodyweight)
    ];

    for (let i = 0; i < volumeRecords.length; i++) {
      const record = volumeRecords[i];
      console.log(`   ${i + 1}. Recording ${record.exercise}: ${record.sets}x${record.reps} @ ${record.weight}lbs`);
      
      const result = await routinePlanner.updateVolume({
        user: volumeUser,
        exercise: record.exercise,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
        weekStart
      });

      if ("error" in result) {
        throw new Error(`UpdateVolume failed for ${record.exercise}: ${result.error}`);
      }
    }

    // Check weekly volume
    console.log("\n2. Checking weekly volume accumulation");
    const weeklyVolume = await routinePlanner._getWeeklyVolume({ user: volumeUser, weekStart });
    console.log(`   ✓ Found volume records for ${weeklyVolume.length} muscle groups`);
    
    weeklyVolume.forEach(record => {
      console.log(`     ${record.muscleGroup}: ${record.volume} total volume`);
    });

    // Test balance checking
    console.log("\n3. Checking muscle group balance");
    const balanceResult = await routinePlanner.checkBalance({
      user: volumeUser,
      weekStart
    });

    if ("imbalance" in balanceResult) {
      console.log(`   ✓ Balance check found ${balanceResult.imbalance.length} imbalanced muscle groups`);
      if (balanceResult.imbalance.length > 0) {
        console.log(`     Imbalanced groups: ${balanceResult.imbalance.join(", ")}`);
      } else {
        console.log("     All muscle groups are balanced");
      }
    } else {
      throw new Error("CheckBalance failed: " + balanceResult.error);
    }

    // Create intentionally imbalanced scenario
    console.log("\n4. Creating intentionally imbalanced scenario");
    const imbalancedUser = "imbalanceduser" as any;
    
    // Add high chest volume
    await routinePlanner.weeklyVolume.insertOne({
      user: imbalancedUser,
      muscleGroup: "chest",
      weekStart,
      volume: 10000 // Very high volume
    });

    // Add low back volume
    await routinePlanner.weeklyVolume.insertOne({
      user: imbalancedUser,
      muscleGroup: "back",
      weekStart,
      volume: 500 // Very low volume
    });

    const imbalanceResult = await routinePlanner.checkBalance({
      user: imbalancedUser,
      weekStart
    });

    if ("imbalance" in imbalanceResult) {
      console.log(`   ✓ Imbalance check found ${imbalanceResult.imbalance.length} imbalanced groups`);
      assertEquals(imbalanceResult.imbalance.length, 1);
      assertEquals(imbalanceResult.imbalance[0], "back");
    } else {
      throw new Error("Imbalance check failed: " + imbalanceResult.error);
    }
  });

  await t.step("Interesting Scenario 3: Error handling and validation", async () => {
    console.log("\n=== SCENARIO 3: ERROR HANDLING AND VALIDATION ===");
    console.log("Testing various error conditions and edge cases");
    
    // Test template creation validation
    console.log("\n1. Testing template creation validation");
    
    // Missing user
    const missingUserResult = await routinePlanner.createTemplate({
      user: "" as any,
      name: "Test Template",
      exercises: [testExercise1]
    });

    if ("error" in missingUserResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserResult.error}"`);
      assertEquals(missingUserResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Empty template name
    const emptyNameResult = await routinePlanner.createTemplate({
      user: testUser,
      name: "",
      exercises: [testExercise1]
    });

    if ("error" in emptyNameResult) {
      console.log(`   ✓ Correctly rejected empty name: "${emptyNameResult.error}"`);
      assertEquals(emptyNameResult.error.includes("Template name cannot be empty"), true);
    } else {
      throw new Error("Should have failed with empty name");
    }

    // Empty exercises array
    const emptyExercisesResult = await routinePlanner.createTemplate({
      user: testUser,
      name: "Empty Template",
      exercises: []
    });

    if ("error" in emptyExercisesResult) {
      console.log(`   ✓ Correctly rejected empty exercises: "${emptyExercisesResult.error}"`);
      assertEquals(emptyExercisesResult.error.includes("At least one exercise must be specified"), true);
    } else {
      throw new Error("Should have failed with empty exercises");
    }

    // Test setDefaultTemplate validation
    console.log("\n2. Testing setDefaultTemplate validation");
    
    // Missing user
    const missingUserDefaultResult = await routinePlanner.setDefaultTemplate({
      user: "" as any,
      templateId: "template123" as any
    });

    if ("error" in missingUserDefaultResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserDefaultResult.error}"`);
      assertEquals(missingUserDefaultResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Non-existent template
    const nonexistentTemplateResult = await routinePlanner.setDefaultTemplate({
      user: testUser,
      templateId: "nonexistent" as any
    });

    if ("error" in nonexistentTemplateResult) {
      console.log(`   ✓ Correctly rejected non-existent template: "${nonexistentTemplateResult.error}"`);
      assertEquals(nonexistentTemplateResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed with non-existent template");
    }

    // Test getSuggestedWorkout validation
    console.log("\n3. Testing getSuggestedWorkout validation");
    
    // Missing user
    const missingUserSuggestResult = await routinePlanner.getSuggestedWorkout({
      user: "" as any,
      date: "2024-01-15"
    });

    if ("error" in missingUserSuggestResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserSuggestResult.error}"`);
      assertEquals(missingUserSuggestResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Invalid date
    const invalidDateResult = await routinePlanner.getSuggestedWorkout({
      user: testUser,
      date: "not-a-date"
    });

    if ("error" in invalidDateResult) {
      console.log(`   ✓ Correctly rejected invalid date: "${invalidDateResult.error}"`);
      assertEquals(invalidDateResult.error.includes("Invalid date format"), true);
    } else {
      throw new Error("Should have failed with invalid date");
    }

    // Test updateVolume validation
    console.log("\n4. Testing updateVolume validation");
    
    // Missing user
    const missingUserVolumeResult = await routinePlanner.updateVolume({
      user: "" as any,
      exercise: testExercise1,
      sets: 3,
      reps: 10,
      weight: 135,
      weekStart: "2024-01-15"
    });

    if ("error" in missingUserVolumeResult) {
      console.log(`   ✓ Correctly rejected missing user: "${missingUserVolumeResult.error}"`);
      assertEquals(missingUserVolumeResult.error.includes("User is required"), true);
    } else {
      throw new Error("Should have failed with missing user");
    }

    // Zero sets
    const zeroSetsResult = await routinePlanner.updateVolume({
      user: testUser,
      exercise: testExercise1,
      sets: 0,
      reps: 10,
      weight: 135,
      weekStart: "2024-01-15"
    });

    if ("error" in zeroSetsResult) {
      console.log(`   ✓ Correctly rejected zero sets: "${zeroSetsResult.error}"`);
      assertEquals(zeroSetsResult.error.includes("positive values"), true);
    } else {
      throw new Error("Should have failed with zero sets");
    }
  });

  await t.step("Interesting Scenario 4: User with no templates", async () => {
    console.log("\n=== SCENARIO 4: USER WITH NO TEMPLATES ===");
    console.log("Testing behavior for users who haven't created any templates");
    
    const newUser = "newuser789" as any;
    
    // Test getting suggested workout for user with no templates
    console.log("\n1. Getting suggested workout for user with no templates");
    const noTemplatesResult = await routinePlanner.getSuggestedWorkout({
      user: newUser,
      date: "2024-01-15"
    });

    if ("template" in noTemplatesResult) {
      console.log(`   ✓ No templates result: ${noTemplatesResult.template}`);
      assertEquals(noTemplatesResult.template, null);
    } else {
      throw new Error("GetSuggestedWorkout failed: " + noTemplatesResult.error);
    }

    // Test setting default template for user with no templates
    console.log("\n2. Testing setDefaultTemplate with non-existent template");
    const noDefaultResult = await routinePlanner.setDefaultTemplate({
      user: newUser,
      templateId: "nonexistent" as any
    });

    if ("error" in noDefaultResult) {
      console.log(`   ✓ Correctly rejected non-existent template: "${noDefaultResult.error}"`);
      assertEquals(noDefaultResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed with non-existent template");
    }

    // Test volume tracking for new user
    console.log("\n3. Testing volume tracking for new user");
    const newUserVolumeResult = await routinePlanner.updateVolume({
      user: newUser,
      exercise: testExercise1,
      sets: 3,
      reps: 10,
      weight: 135,
      weekStart: "2024-01-15"
    });

    if ("error" in newUserVolumeResult) {
      throw new Error("UpdateVolume failed for new user: " + newUserVolumeResult.error);
    }
    console.log("   ✓ Volume tracking works for new user");

    // Check balance for new user (should be balanced)
    console.log("\n4. Checking balance for new user");
    const newUserBalanceResult = await routinePlanner.checkBalance({
      user: newUser,
      weekStart: "2024-01-15"
    });

    if ("imbalance" in newUserBalanceResult) {
      console.log(`   ✓ New user balance: ${newUserBalanceResult.imbalance.length} imbalanced groups`);
      assertEquals(newUserBalanceResult.imbalance.length, 0); // Should be balanced
    } else {
      throw new Error("CheckBalance failed for new user: " + newUserBalanceResult.error);
    }

    // Test getting user templates for user with no templates
    console.log("\n5. Getting user templates for user with no templates");
    const newUserTemplates = await routinePlanner._getUserTemplates({ user: newUser });
    console.log(`   ✓ New user has ${newUserTemplates.length} templates`);
    assertEquals(newUserTemplates.length, 0);
  });

  await t.step("Interesting Scenario 5: Multiple weeks and volume tracking", async () => {
    console.log("\n=== SCENARIO 5: MULTIPLE WEEKS AND VOLUME TRACKING ===");
    console.log("Testing volume tracking across multiple weeks and time periods");
    
    const multiWeekUser = "multiweekuser" as any;
    const weeks = [
      "2024-01-15", // Week 1
      "2024-01-22", // Week 2  
      "2024-01-29", // Week 3
    ];

    const weeklyExercises = [
      ["benchpress" as any, "squat" as any], // Week 1
      ["benchpress" as any, "deadlift" as any], // Week 2
      ["inclinebench" as any, "squat" as any, "pullups" as any], // Week 3
    ];

    // Track volume across multiple weeks
    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const weekStart = weeks[weekIndex];
      const exercises = weeklyExercises[weekIndex];
      
      console.log(`\n${weekIndex + 1}. Recording volume for week starting ${weekStart}`);
      
      for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];
        const weight = 100 + (weekIndex * 5) + (exerciseIndex * 10);
        const sets = 3 + exerciseIndex;
        const reps = 8 + exerciseIndex;
        
        console.log(`   ${exercise}: ${sets}x${reps} @ ${weight}lbs`);
        
        const result = await routinePlanner.updateVolume({
          user: multiWeekUser,
          exercise,
          sets,
          reps,
          weight,
          weekStart
        });

        if ("error" in result) {
          throw new Error(`UpdateVolume failed for ${exercise} in week ${weekStart}: ${result.error}`);
        }
      }

      // Check volume for this week
      const weekVolume = await routinePlanner._getWeeklyVolume({ user: multiWeekUser, weekStart });
      console.log(`   ✓ Week ${weekIndex + 1} volume: ${weekVolume.length} muscle groups tracked`);
      
      weekVolume.forEach(record => {
        console.log(`     ${record.muscleGroup}: ${record.volume} total volume`);
      });
    }

    // Test balance checking across different weeks
    console.log("\n4. Testing balance checking across different weeks");
    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const weekStart = weeks[weekIndex];
      
      const balanceResult = await routinePlanner.checkBalance({
        user: multiWeekUser,
        weekStart
      });

      if ("imbalance" in balanceResult) {
        console.log(`   Week ${weekIndex + 1} (${weekStart}): ${balanceResult.imbalance.length} imbalanced groups`);
        if (balanceResult.imbalance.length > 0) {
          console.log(`     Imbalanced: ${balanceResult.imbalance.join(", ")}`);
        }
      } else {
        throw new Error(`CheckBalance failed for week ${weekStart}: ${balanceResult.error}`);
      }
    }

    // Test volume accumulation for same muscle group across weeks
    console.log("\n5. Testing volume patterns across weeks");
    const chestVolumeWeek1 = await routinePlanner._getWeeklyVolume({ user: multiWeekUser, weekStart: weeks[0] });
    const chestVolumeWeek2 = await routinePlanner._getWeeklyVolume({ user: multiWeekUser, weekStart: weeks[1] });
    const chestVolumeWeek3 = await routinePlanner._getWeeklyVolume({ user: multiWeekUser, weekStart: weeks[2] });

    console.log(`   ✓ Chest volume tracking:`);
    console.log(`     Week 1: ${chestVolumeWeek1.find(v => v.muscleGroup === "chest")?.volume || 0}`);
    console.log(`     Week 2: ${chestVolumeWeek2.find(v => v.muscleGroup === "chest")?.volume || 0}`);
    console.log(`     Week 3: ${chestVolumeWeek3.find(v => v.muscleGroup === "chest")?.volume || 0}`);
  });

  await client.close();
});

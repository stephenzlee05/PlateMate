import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserManagementConcept from "./UserManagementConcept.ts";

Deno.test("UserManagement Concept", async (t) => {
  const [db, client] = await testDb();
  const userMgmt = new UserManagementConcept(db);

  await t.step("Operational Principle: Complete user management workflow", async () => {
    console.log("\n=== OPERATIONAL PRINCIPLE TEST ===");
    console.log("Testing the common expected usage: create user, get user, update preferences");
    
    // Step 1: Create a new user
    console.log("\n1. Creating new user: testuser");
    const createResult = await userMgmt.createUser({
      username: "testuser",
      email: "test@example.com"
    });

    assertExists(createResult);
    if ("userId" in createResult) {
      console.log(`   ✓ User created with ID: ${createResult.userId}`);
      
      // Step 2: Get the user
      console.log("\n2. Retrieving user by ID");
      const userResult = await userMgmt.getUser({ userId: createResult.userId });
      
      if ("user" in userResult) {
        console.log(`   ✓ User retrieved: ${userResult.user.username} (${userResult.user.email})`);
        assertEquals(userResult.user.username, "testuser");
        assertEquals(userResult.user.email, "test@example.com");
        console.log(`     Default preferences: ${userResult.user.preferences.units}, ${userResult.user.preferences.defaultIncrement}lb increment`);
      } else {
        throw new Error("User retrieval failed: " + userResult.error);
      }
      
      // Step 3: Update user preferences
      console.log("\n3. Updating user preferences");
      const updateResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: {
          defaultIncrement: 10,
          units: "kg",
          notifications: false
        }
      });

      if ("error" in updateResult) {
        throw new Error("Update failed: " + updateResult.error);
      }
      console.log("   ✓ Preferences updated successfully");
      
      // Step 4: Verify updated preferences
      console.log("\n4. Verifying updated preferences");
      const updatedUserResult = await userMgmt.getUser({ userId: createResult.userId });
      
      if ("user" in updatedUserResult) {
        console.log(`   ✓ Updated preferences: ${updatedUserResult.user.preferences.units}, ${updatedUserResult.user.preferences.defaultIncrement} increment`);
        assertEquals(updatedUserResult.user.preferences.defaultIncrement, 10);
        assertEquals(updatedUserResult.user.preferences.units, "kg");
        assertEquals(updatedUserResult.user.preferences.notifications, false);
      } else {
        throw new Error("User retrieval after update failed: " + updatedUserResult.error);
      }
      
      console.log("\n✓ Operational principle test completed successfully");
    } else {
      throw new Error("User creation failed: " + createResult.error);
    }
  });

  await t.step("Interesting Scenario 1: Multiple users and uniqueness constraints", async () => {
    console.log("\n=== SCENARIO 1: MULTIPLE USERS AND UNIQUENESS CONSTRAINTS ===");
    console.log("Testing user creation with various username and email combinations");
    
    // Clear existing users for clean test
    console.log("\n0. Clearing existing users for clean test");
    await userMgmt.users.deleteMany({});
    await userMgmt.userPreferences.deleteMany({});
    console.log("   ✓ Cleared existing users and preferences");
    
    const users = [
      { username: "alice", email: "alice@example.com" },
      { username: "bob", email: "bob@example.com" },
      { username: "charlie", email: "charlie@example.com" },
      { username: "diana", email: "diana@example.com" },
      { username: "eve", email: "eve@example.com" }
    ];

    const createdUsers = [];

    // Create multiple users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n${i + 1}. Creating user: ${user.username}`);
      
      const result = await userMgmt.createUser({
        username: user.username,
        email: user.email
      });

      if ("userId" in result) {
        createdUsers.push({ id: result.userId, ...user });
        console.log(`   ✓ Created ${user.username} with ID: ${result.userId}`);
        
        // Verify user was created correctly
        const verifyResult = await userMgmt.getUser({ userId: result.userId });
        if ("user" in verifyResult) {
          assertEquals(verifyResult.user.username, user.username);
          assertEquals(verifyResult.user.email, user.email);
          assertEquals(verifyResult.user.preferences.defaultIncrement, 5);
          assertEquals(verifyResult.user.preferences.units, "lbs");
          assertEquals(verifyResult.user.preferences.notifications, true);
        } else {
          throw new Error("User verification failed: " + verifyResult.error);
        }
      } else {
        throw new Error(`User creation failed for ${user.username}: ${result.error}`);
      }
    }

    console.log(`\n✓ Successfully created ${createdUsers.length} users`);

    // Test duplicate username prevention
    console.log(`\n${users.length + 1}. Testing duplicate username prevention`);
    const duplicateUsernameResult = await userMgmt.createUser({
      username: "alice", // Already exists
      email: "alice2@example.com"
    });

    if ("error" in duplicateUsernameResult) {
      console.log(`   ✓ Correctly rejected duplicate username: "${duplicateUsernameResult.error}"`);
      assertEquals(duplicateUsernameResult.error.includes("Username"), true);
    } else {
      throw new Error("Should have failed with duplicate username");
    }

    // Test duplicate email prevention
    console.log(`\n${users.length + 2}. Testing duplicate email prevention`);
    const duplicateEmailResult = await userMgmt.createUser({
      username: "alice2",
      email: "alice@example.com" // Already exists
    });

    if ("error" in duplicateEmailResult) {
      console.log(`   ✓ Correctly rejected duplicate email: "${duplicateEmailResult.error}"`);
      assertEquals(duplicateEmailResult.error.includes("Email"), true);
    } else {
      throw new Error("Should have failed with duplicate email");
    }

    // Test retrieving all users
    console.log(`\n${users.length + 3}. Retrieving all users`);
    const allUsers = await userMgmt._getAllUsers();
    console.log(`   ✓ Found ${allUsers.length} total users`);
    assertEquals(allUsers.length, createdUsers.length);
    
    const usernames = allUsers.map(u => u.username).sort();
    const expectedUsernames = createdUsers.map(u => u.username).sort();
    console.log(`   ✓ User names: ${usernames.join(", ")}`);
    assertEquals(usernames, expectedUsernames);
  });

  await t.step("Interesting Scenario 2: Preference updates and partial updates", async () => {
    console.log("\n=== SCENARIO 2: PREFERENCE UPDATES AND PARTIAL UPDATES ===");
    console.log("Testing various preference update scenarios");
    
    // Create a user for preference testing
    console.log("\n1. Creating user for preference testing");
    const createResult = await userMgmt.createUser({
      username: "prefsuser",
      email: "prefs@example.com"
    });

    if ("userId" in createResult) {
      console.log(`   ✓ Created user: ${createResult.userId}`);
      
      // Test full preference update
      console.log("\n2. Testing full preference update");
      const fullUpdateResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: {
          defaultIncrement: 15,
          units: "kg",
          notifications: false
        }
      });

      if ("error" in fullUpdateResult) {
        throw new Error("Full update failed: " + fullUpdateResult.error);
      }
      console.log("   ✓ Full preferences updated");

      // Verify full update
      const fullUpdateUser = await userMgmt.getUser({ userId: createResult.userId });
      if ("user" in fullUpdateUser) {
        console.log(`   ✓ Verified full update: ${fullUpdateUser.user.preferences.units}, ${fullUpdateUser.user.preferences.defaultIncrement} increment, notifications: ${fullUpdateUser.user.preferences.notifications}`);
        assertEquals(fullUpdateUser.user.preferences.defaultIncrement, 15);
        assertEquals(fullUpdateUser.user.preferences.units, "kg");
        assertEquals(fullUpdateUser.user.preferences.notifications, false);
      } else {
        throw new Error("User retrieval after full update failed: " + fullUpdateUser.error);
      }

      // Test partial update (only increment)
      console.log("\n3. Testing partial update (only increment)");
      const partialUpdateResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: { defaultIncrement: 20 }
      });

      if ("error" in partialUpdateResult) {
        throw new Error("Partial update failed: " + partialUpdateResult.error);
      }
      console.log("   ✓ Partial preferences updated");

      // Verify partial update
      const partialUpdateUser = await userMgmt.getUser({ userId: createResult.userId });
      if ("user" in partialUpdateUser) {
        console.log(`   ✓ Verified partial update: ${partialUpdateUser.user.preferences.units}, ${partialUpdateUser.user.preferences.defaultIncrement} increment, notifications: ${partialUpdateUser.user.preferences.notifications}`);
        assertEquals(partialUpdateUser.user.preferences.defaultIncrement, 20); // Should be updated
        assertEquals(partialUpdateUser.user.preferences.units, "kg"); // Should remain unchanged
        assertEquals(partialUpdateUser.user.preferences.notifications, false); // Should remain unchanged
      } else {
        throw new Error("User retrieval after partial update failed: " + partialUpdateUser.error);
      }

      // Test another partial update (only units)
      console.log("\n4. Testing partial update (only units)");
      const unitsUpdateResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: { units: "lbs" }
      });

      if ("error" in unitsUpdateResult) {
        throw new Error("Units update failed: " + unitsUpdateResult.error);
      }
      console.log("   ✓ Units preference updated");

      // Verify units update
      const unitsUpdateUser = await userMgmt.getUser({ userId: createResult.userId });
      if ("user" in unitsUpdateUser) {
        console.log(`   ✓ Verified units update: ${unitsUpdateUser.user.preferences.units}, ${unitsUpdateUser.user.preferences.defaultIncrement} increment, notifications: ${unitsUpdateUser.user.preferences.notifications}`);
        assertEquals(unitsUpdateUser.user.preferences.defaultIncrement, 20); // Should remain unchanged
        assertEquals(unitsUpdateUser.user.preferences.units, "lbs"); // Should be updated
        assertEquals(unitsUpdateUser.user.preferences.notifications, false); // Should remain unchanged
      } else {
        throw new Error("User retrieval after units update failed: " + unitsUpdateUser.error);
      }

      // Test notifications update
      console.log("\n5. Testing notifications update");
      const notificationsUpdateResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: { notifications: true }
      });

      if ("error" in notificationsUpdateResult) {
        throw new Error("Notifications update failed: " + notificationsUpdateResult.error);
      }
      console.log("   ✓ Notifications preference updated");

      // Verify notifications update
      const notificationsUpdateUser = await userMgmt.getUser({ userId: createResult.userId });
      if ("user" in notificationsUpdateUser) {
        console.log(`   ✓ Verified notifications update: ${notificationsUpdateUser.user.preferences.units}, ${notificationsUpdateUser.user.preferences.defaultIncrement} increment, notifications: ${notificationsUpdateUser.user.preferences.notifications}`);
        assertEquals(notificationsUpdateUser.user.preferences.defaultIncrement, 20); // Should remain unchanged
        assertEquals(notificationsUpdateUser.user.preferences.units, "lbs"); // Should remain unchanged
        assertEquals(notificationsUpdateUser.user.preferences.notifications, true); // Should be updated
      } else {
        throw new Error("User retrieval after notifications update failed: " + notificationsUpdateUser.error);
      }
    } else {
      throw new Error("User creation failed for preference test: " + createResult.error);
    }
  });

  await t.step("Interesting Scenario 3: Error handling and validation", async () => {
    console.log("\n=== SCENARIO 3: ERROR HANDLING AND VALIDATION ===");
    console.log("Testing various error conditions and edge cases");
    
    // Test updating preferences for non-existent user
    console.log("\n1. Testing update preferences for non-existent user");
    const nonexistentUserResult = await userMgmt.updatePreferences({
      userId: "nonexistent" as any,
      preferences: { defaultIncrement: 10 }
    });

    if ("error" in nonexistentUserResult) {
      console.log(`   ✓ Correctly rejected non-existent user: "${nonexistentUserResult.error}"`);
      assertEquals(nonexistentUserResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed for non-existent user");
    }

    // Test getting non-existent user
    console.log("\n2. Testing get non-existent user");
    const nonexistentGetResult = await userMgmt.getUser({ userId: "nonexistent" as any });

    if ("error" in nonexistentGetResult) {
      console.log(`   ✓ Correctly handled non-existent user: "${nonexistentGetResult.error}"`);
      assertEquals(nonexistentGetResult.error.includes("not found"), true);
    } else {
      throw new Error("Should have failed for non-existent user");
    }

    // Test getting user preferences for non-existent user
    console.log("\n3. Testing get preferences for non-existent user");
    const nonexistentPrefsResult = await userMgmt._getUserPreferences({ userId: "nonexistent" as any });

    if ("error" in nonexistentPrefsResult) {
      console.log(`   ✓ Correctly handled non-existent user preferences: "${nonexistentPrefsResult.error}"`);
    } else {
      console.log(`   ✓ Non-existent user preferences: ${nonexistentPrefsResult.length} records`);
      assertEquals(nonexistentPrefsResult.length, 0);
    }

    // Test empty preference updates
    console.log("\n4. Testing empty preference updates");
    const createResult = await userMgmt.createUser({
      username: "emptyuser",
      email: "empty@example.com"
    });

    if ("userId" in createResult) {
      // Test updating with empty preferences object
      const emptyPrefsResult = await userMgmt.updatePreferences({
        userId: createResult.userId,
        preferences: {}
      });

      if ("error" in emptyPrefsResult) {
        console.log(`   ✓ Correctly handled empty preferences: "${emptyPrefsResult.error}"`);
      } else {
        console.log("   ✓ Empty preferences update handled gracefully");
        
        // Verify preferences remain unchanged
      const userResult = await userMgmt.getUser({ userId: createResult.userId });
      if ("user" in userResult) {
          assertEquals(userResult.user.preferences.defaultIncrement, 5); // Should remain default
          assertEquals(userResult.user.preferences.units, "lbs"); // Should remain default
          assertEquals(userResult.user.preferences.notifications, true); // Should remain default
        }
      }
    } else {
      throw new Error("User creation failed for empty preferences test: " + createResult.error);
    }
  });

  await t.step("Interesting Scenario 4: User preferences and data consistency", async () => {
    console.log("\n=== SCENARIO 4: USER PREFERENCES AND DATA CONSISTENCY ===");
    console.log("Testing preference data consistency and retrieval patterns");
    
    // Create multiple users with different preferences
    console.log("\n1. Creating users with different preference patterns");
    const usersWithPrefs = [
      { username: "kguser", email: "kg@example.com", prefs: { units: "kg", defaultIncrement: 2.5, notifications: true } },
      { username: "lbsuser", email: "lbs@example.com", prefs: { units: "lbs", defaultIncrement: 5, notifications: false } },
      { username: "heavyuser", email: "heavy@example.com", prefs: { units: "lbs", defaultIncrement: 10, notifications: true } },
      { username: "lightuser", email: "light@example.com", prefs: { units: "kg", defaultIncrement: 1.25, notifications: false } }
    ];

    const createdUsers = [];

    for (let i = 0; i < usersWithPrefs.length; i++) {
      const user = usersWithPrefs[i];
      console.log(`   ${i + 1}. Creating ${user.username} with ${user.prefs.units} units`);
      
      const createResult = await userMgmt.createUser({
        username: user.username,
        email: user.email
      });

      if ("userId" in createResult) {
        // Update preferences
        const updateResult = await userMgmt.updatePreferences({
          userId: createResult.userId,
          preferences: user.prefs
        });

        if ("error" in updateResult) {
          throw new Error(`Preferences update failed for ${user.username}: ${updateResult.error}`);
        }

        createdUsers.push({ id: createResult.userId, ...user });
        console.log(`     ✓ Created with ${user.prefs.units}, ${user.prefs.defaultIncrement} increment`);
      } else {
        throw new Error(`User creation failed for ${user.username}: ${createResult.error}`);
      }
    }

    // Test preference retrieval consistency
    console.log("\n2. Testing preference retrieval consistency");
    for (const user of createdUsers) {
      console.log(`   Testing ${user.username} preferences`);
      
      // Get user and verify preferences
      const userResult = await userMgmt.getUser({ userId: user.id });
      if ("user" in userResult) {
        assertEquals(userResult.user.preferences.units, user.prefs.units);
        assertEquals(userResult.user.preferences.defaultIncrement, user.prefs.defaultIncrement);
        assertEquals(userResult.user.preferences.notifications, user.prefs.notifications);
        console.log(`     ✓ Preferences match: ${userResult.user.preferences.units}, ${userResult.user.preferences.defaultIncrement}`);
      } else {
        throw new Error(`User retrieval failed for ${user.username}: ${userResult.error}`);
      }

      // Get preferences directly
      const prefsResult = await userMgmt._getUserPreferences({ userId: user.id });
      assertEquals(prefsResult.length, 1);
      assertEquals(prefsResult[0].units, user.prefs.units);
      assertEquals(prefsResult[0].defaultIncrement, user.prefs.defaultIncrement);
      assertEquals(prefsResult[0].notifications, user.prefs.notifications);
      console.log(`     ✓ Direct preferences match: ${prefsResult[0].units}, ${prefsResult[0].defaultIncrement}`);
    }

    // Test repeated preference updates
    console.log("\n3. Testing repeated preference updates");
    const testUser = createdUsers[0];
    
    // Update preferences multiple times
    const updates = [
      { defaultIncrement: 7.5 },
      { units: "kg" },
      { notifications: false },
      { defaultIncrement: 3.75, units: "lbs", notifications: true }
    ];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      console.log(`   Update ${i + 1}: ${JSON.stringify(update)}`);
      
      const updateResult = await userMgmt.updatePreferences({
        userId: testUser.id,
        preferences: update
      });

      if ("error" in updateResult) {
        throw new Error(`Repeated update ${i + 1} failed: ${updateResult.error}`);
      }

      // Verify update
      const userResult = await userMgmt.getUser({ userId: testUser.id });
      if ("user" in userResult) {
        console.log(`     ✓ Updated to: ${userResult.user.preferences.units}, ${userResult.user.preferences.defaultIncrement}, notifications: ${userResult.user.preferences.notifications}`);
    } else {
        throw new Error(`User retrieval failed after update ${i + 1}: ${userResult.error}`);
      }
    }
  });

  await t.step("Interesting Scenario 5: User management operations", async () => {
    console.log("\n=== SCENARIO 5: USER MANAGEMENT OPERATIONS ===");
    console.log("Testing various user management operations and edge cases");
    
    // Clear existing users for clean test
    console.log("\n1. Clearing existing users for clean test");
    await userMgmt.users.deleteMany({});
    console.log("   ✓ Cleared existing users");

    // Create test users
    console.log("\n2. Creating test users");
    const testUsers = [
      { username: "admin", email: "admin@example.com" },
      { username: "trainer", email: "trainer@example.com" },
      { username: "beginner", email: "beginner@example.com" },
      { username: "advanced", email: "advanced@example.com" }
    ];

    const createdTestUsers = [];

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`   ${i + 1}. Creating ${user.username}`);
      
      const createResult = await userMgmt.createUser({
        username: user.username,
        email: user.email
      });

      if ("userId" in createResult) {
        createdTestUsers.push({ id: createResult.userId, ...user });
        console.log(`     ✓ Created with ID: ${createResult.userId}`);
      } else {
        throw new Error(`User creation failed for ${user.username}: ${createResult.error}`);
      }
    }

    // Test retrieving all users
    console.log("\n3. Testing retrieval of all users");
    const allUsers = await userMgmt._getAllUsers();
    console.log(`   ✓ Retrieved ${allUsers.length} users`);
    assertEquals(allUsers.length, testUsers.length);
    
    const usernames = allUsers.map(u => u.username).sort();
    const expectedUsernames = testUsers.map(u => u.username).sort();
    console.log(`   ✓ User names: ${usernames.join(", ")}`);
    assertEquals(usernames, expectedUsernames);

    // Test getting specific users
    console.log("\n4. Testing retrieval of specific users");
    for (const user of createdTestUsers) {
      console.log(`   Getting ${user.username}`);
      
      const userResult = await userMgmt.getUser({ userId: user.id });
      if ("user" in userResult) {
        assertEquals(userResult.user.username, user.username);
        assertEquals(userResult.user.email, user.email);
        console.log(`     ✓ Retrieved: ${userResult.user.username} (${userResult.user.email})`);
      } else {
        throw new Error(`User retrieval failed for ${user.username}: ${userResult.error}`);
      }
    }

    // Test preference patterns
    console.log("\n5. Testing different preference patterns");
    const preferencePatterns = [
      { user: createdTestUsers[0], prefs: { defaultIncrement: 5, units: "lbs", notifications: true } }, // admin - default
      { user: createdTestUsers[1], prefs: { defaultIncrement: 10, units: "lbs", notifications: false } }, // trainer - heavy
      { user: createdTestUsers[2], prefs: { defaultIncrement: 2.5, units: "kg", notifications: true } }, // beginner - light
      { user: createdTestUsers[3], prefs: { defaultIncrement: 7.5, units: "kg", notifications: false } } // advanced - medium
    ];

    for (let i = 0; i < preferencePatterns.length; i++) {
      const pattern = preferencePatterns[i];
      console.log(`   ${i + 1}. Setting preferences for ${pattern.user.username}`);
      
      const updateResult = await userMgmt.updatePreferences({
        userId: pattern.user.id,
        preferences: pattern.prefs
      });

      if ("error" in updateResult) {
        throw new Error(`Preferences update failed for ${pattern.user.username}: ${updateResult.error}`);
      }

      // Verify preferences
      const userResult = await userMgmt.getUser({ userId: pattern.user.id });
      if ("user" in userResult) {
        assertEquals(userResult.user.preferences.defaultIncrement, pattern.prefs.defaultIncrement);
        assertEquals(userResult.user.preferences.units, pattern.prefs.units);
        assertEquals(userResult.user.preferences.notifications, pattern.prefs.notifications);
        console.log(`     ✓ Set to: ${pattern.prefs.units}, ${pattern.prefs.defaultIncrement} increment, notifications: ${pattern.prefs.notifications}`);
      } else {
        throw new Error(`User retrieval failed for ${pattern.user.username}: ${userResult.error}`);
      }
    }

    // Test preference queries
    console.log("\n6. Testing preference queries");
    for (const pattern of preferencePatterns) {
      const prefsResult = await userMgmt._getUserPreferences({ userId: pattern.user.id });
      assertEquals(prefsResult.length, 1);
      assertEquals(prefsResult[0].defaultIncrement, pattern.prefs.defaultIncrement);
      assertEquals(prefsResult[0].units, pattern.prefs.units);
      assertEquals(prefsResult[0].notifications, pattern.prefs.notifications);
      console.log(`   ✓ ${pattern.user.username} preferences: ${prefsResult[0].units}, ${prefsResult[0].defaultIncrement}`);
    }
  });

  await client.close();
});

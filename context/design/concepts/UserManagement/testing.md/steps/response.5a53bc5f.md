---
timestamp: 'Sun Oct 12 2025 20:09:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_200907.d7db0157.md]]'
content_id: 5a53bc5f64f361f5c60b6cc734410b1a4a7013c6ba46d35af1d149ab3114745d
---

# response:

```typescript
// file: src/UserManagement/UserManagementConcept.test.ts
import { assertEquals, assertExists, assertNotEquals, assertNull } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserManagementConcept from "./UserManagementConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserManagementConcept - Principle and Actions", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserManagementConcept(db);

  try {
    // --- Principle Trace: each user has unique identity and customizable settings ---
    await t.step("Principle Trace: User creation, verification, and preference update", async () => {
      console.log("\n--- Starting Principle Trace ---");

      // 1. Create a new user
      console.log("Action: createUser('alice', 'alice@example.com')");
      const createUserResult = await concept.createUser({
        username: "alice",
        email: "alice@example.com",
      });
      assertExists(createUserResult);
      assertNotEquals((createUserResult as { error: string }).error, "Username already exists", "Should not have error on first user creation");
      assertNotEquals((createUserResult as { error: string }).error, "Email already exists", "Should not have error on first user creation");
      const { userId: aliceId } = createUserResult as { userId: ID };
      assertExists(aliceId);
      console.log(`Effect: User 'alice' created with ID: ${aliceId}`);

      // 2. Verify user basic info
      console.log(`Action: getUser(${aliceId})`);
      const aliceInfo = await concept.getUser({ userId: aliceId });
      assertExists(aliceInfo);
      assertEquals(aliceInfo.username, "alice");
      assertEquals(aliceInfo.email, "alice@example.com");
      console.log(`Effect: Retrieved user info: ${JSON.stringify(aliceInfo)}`);

      // 3. Get user preferences ID
      console.log(`Action: getUserPreferencesId(${aliceId})`);
      const alicePrefsIdResult = await concept.getUserPreferencesId({ userId: aliceId });
      assertExists(alicePrefsIdResult);
      const { preferencesId: alicePrefsId } = alicePrefsIdResult;
      assertExists(alicePrefsId);
      console.log(`Effect: Retrieved preferences ID for 'alice': ${alicePrefsId}`);

      // 4. Get default preferences
      console.log(`Action: getPreferences(${alicePrefsId}) (default values)`);
      const defaultPrefs = await concept.getPreferences({ preferencesId: alicePrefsId });
      assertExists(defaultPrefs);
      assertEquals(defaultPrefs.defaultIncrement, 1);
      assertEquals(defaultPrefs.units, "metric");
      assertEquals(defaultPrefs.notifications, true);
      console.log(`Effect: Retrieved default preferences: ${JSON.stringify(defaultPrefs)}`);

      // 5. Update user preferences
      console.log(`Action: updatePreferences(${alicePrefsId}, { defaultIncrement: 5, units: 'imperial', notifications: false })`);
      const updateResult = await concept.updatePreferences({
        preferencesId: alicePrefsId,
        preferences: {
          defaultIncrement: 5,
          units: "imperial",
          notifications: false,
        },
      });
      assertExists(updateResult);
      assertEquals(Object.keys(updateResult).length, 0, "Update should return empty object on success");
      console.log(`Effect: Preferences updated for ${alicePrefsId}`);

      // 6. Verify updated preferences
      console.log(`Action: getPreferences(${alicePrefsId}) (updated values)`);
      const updatedPrefs = await concept.getPreferences({ preferencesId: alicePrefsId });
      assertExists(updatedPrefs);
      assertEquals(updatedPrefs.defaultIncrement, 5);
      assertEquals(updatedPrefs.units, "imperial");
      assertEquals(updatedPrefs.notifications, false);
      console.log(`Effect: Retrieved updated preferences: ${JSON.stringify(updatedPrefs)}`);

      console.log("--- Principle Trace Complete ---");
    });

    // --- Action-specific tests ---

    await t.step("createUser: successful creation", async () => {
      console.log("\nTest: createUser - successful creation");
      const result = await concept.createUser({ username: "bob", email: "bob@example.com" });
      assertExists(result);
      assertEquals(Object.keys(result).length, 1); // Should return only userId
      assertExists((result as { userId: ID }).userId);
      console.log(`User 'bob' created with ID: ${(result as { userId: ID }).userId}`);
    });

    await t.step("createUser: requires unique username", async () => {
      console.log("\nTest: createUser - requires unique username");
      await concept.createUser({ username: "charlie", email: "charlie@example.com" }); // First creation
      console.log("User 'charlie' created.");
      const result = await concept.createUser({ username: "charlie", email: "charlie2@example.com" }); // Second with same username
      assertExists(result);
      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Username already exists");
      console.log(`Attempted to create user with duplicate username, got error: ${(result as { error: string }).error}`);
    });

    await t.step("createUser: requires unique email", async () => {
      console.log("\nTest: createUser - requires unique email");
      await concept.createUser({ username: "diana", email: "diana@example.com" }); // First creation
      console.log("User 'diana' created.");
      const result = await concept.createUser({ username: "diana2", email: "diana@example.com" }); // Second with same email
      assertExists(result);
      assertExists((result as { error: string }).error);
      assertEquals((result as { error: string }).error, "Email already exists");
      console.log(`Attempted to create user with duplicate email, got error: ${(result as { error: string }).error}`);
    });

    await t.step("getUser: existing user", async () => {
      console.log("\nTest: getUser - existing user");
      const createUserResult = await concept.createUser({ username: "eve", email: "eve@example.com" });
      const { userId: eveId } = createUserResult as { userId: ID };
      console.log(`User 'eve' created with ID: ${eveId}`);
      const user = await concept.getUser({ userId: eveId });
      assertExists(user);
      assertEquals(user.username, "eve");
      assertEquals(user.email, "eve@example.com");
      console.log(`Retrieved user 'eve': ${JSON.stringify(user)}`);
    });

    await t.step("getUser: non-existent user", async () => {
      console.log("\nTest: getUser - non-existent user");
      const nonExistentId = "nonexistent_id" as ID;
      const user = await concept.getUser({ userId: nonExistentId });
      assertNull(user);
      console.log(`Attempted to retrieve non-existent user (${nonExistentId}), result: ${user}`);
    });

    await t.step("getUserPreferencesId: existing user", async () => {
      console.log("\nTest: getUserPreferencesId - existing user");
      const createUserResult = await concept.createUser({ username: "frank", email: "frank@example.com" });
      const { userId: frankId } = createUserResult as { userId: ID };
      console.log(`User 'frank' created with ID: ${frankId}`);
      const prefsIdResult = await concept.getUserPreferencesId({ userId: frankId });
      assertExists(prefsIdResult);
      assertExists(prefsIdResult.preferencesId);
      console.log(`Retrieved preferences ID for 'frank': ${prefsIdResult.preferencesId}`);
    });

    await t.step("getUserPreferencesId: non-existent user", async () => {
      console.log("\nTest: getUserPreferencesId - non-existent user");
      const nonExistentId = "nonexistent_id_2" as ID;
      const prefsIdResult = await concept.getUserPreferencesId({ userId: nonExistentId });
      assertNull(prefsIdResult);
      console.log(`Attempted to retrieve preferences ID for non-existent user (${nonExistentId}), result: ${prefsIdResult}`);
    });

    await t.step("createDefaultPreferences: for existing user", async () => {
      console.log("\nTest: createDefaultPreferences - for existing user (creates *additional* preferences)");
      const createUserResult = await concept.createUser({ username: "grace", email: "grace@example.com" });
      const { userId: graceId } = createUserResult as { userId: ID };
      console.log(`User 'grace' created with ID: ${graceId}`);
      const newPrefsResult = await concept.createDefaultPreferences({ userId: graceId });
      assertExists(newPrefsResult);
      assertExists((newPrefsResult as { preferencesId: ID }).preferencesId);
      console.log(`New default preferences created for 'grace': ${(newPrefsResult as { preferencesId: ID }).preferencesId}`);

      // Verify it's a new preferences ID, different from the one linked during createUser
      const originalPrefsIdResult = await concept.getUserPreferencesId({ userId: graceId });
      assertExists(originalPrefsIdResult);
      assertNotEquals(originalPrefsIdResult.preferencesId, (newPrefsResult as { preferencesId: ID }).preferencesId, "Should be a new, separate preferences object");
    });

    await t.step("createDefaultPreferences: for non-existent user", async () => {
      console.log("\nTest: createDefaultPreferences - for non-existent user");
      const nonExistentId = "nonexistent_id_3" as ID;
      const newPrefsResult = await concept.createDefaultPreferences({ userId: nonExistentId });
      assertExists(newPrefsResult);
      assertExists((newPrefsResult as { error: string }).error);
      assertEquals((newPrefsResult as { error: string }).error, "User does not exist");
      console.log(`Attempted to create default preferences for non-existent user, got error: ${(newPrefsResult as { error: string }).error}`);
    });

    await t.step("updatePreferences: existing preferences", async () => {
      console.log("\nTest: updatePreferences - existing preferences");
      const createUserResult = await concept.createUser({ username: "heidi", email: "heidi@example.com" });
      const { userId: heidiId } = createUserResult as { userId: ID };
      const prefsIdResult = await concept.getUserPreferencesId({ userId: heidiId });
      const { preferencesId: heidiPrefsId } = prefsIdResult!;
      console.log(`User 'heidi' created with preferences ID: ${heidiPrefsId}`);

      const updateResult = await concept.updatePreferences({
        preferencesId: heidiPrefsId,
        preferences: { defaultIncrement: 10, notifications: false },
      });
      assertExists(updateResult);
      assertEquals(Object.keys(updateResult).length, 0);
      console.log("Preferences updated for 'heidi'.");

      const updatedPrefs = await concept.getPreferences({ preferencesId: heidiPrefsId });
      assertExists(updatedPrefs);
      assertEquals(updatedPrefs.defaultIncrement, 10);
      assertEquals(updatedPrefs.units, "metric"); // units should remain unchanged if not specified
      assertEquals(updatedPrefs.notifications, false);
      console.log(`Verified updated preferences for 'heidi': ${JSON.stringify(updatedPrefs)}`);
    });

    await t.step("updatePreferences: non-existent preferences", async () => {
      console.log("\nTest: updatePreferences - non-existent preferences");
      const nonExistentPrefsId = "nonexistent_prefs_id" as ID;
      const updateResult = await concept.updatePreferences({
        preferencesId: nonExistentPrefsId,
        preferences: { defaultIncrement: 99 },
      });
      assertExists(updateResult);
      assertExists((updateResult as { error: string }).error);
      assertEquals((updateResult as { error: string }).error, "User preferences not found");
      console.log(`Attempted to update non-existent preferences, got error: ${(updateResult as { error: string }).error}`);
    });

    await t.step("getPreferences: existing preferences", async () => {
      console.log("\nTest: getPreferences - existing preferences");
      const createUserResult = await concept.createUser({ username: "ivan", email: "ivan@example.com" });
      const { userId: ivanId } = createUserResult as { userId: ID };
      const prefsIdResult = await concept.getUserPreferencesId({ userId: ivanId });
      const { preferencesId: ivanPrefsId } = prefsIdResult!;
      console.log(`User 'ivan' created with preferences ID: ${ivanPrefsId}`);

      const prefs = await concept.getPreferences({ preferencesId: ivanPrefsId });
      assertExists(prefs);
      assertEquals(prefs.defaultIncrement, 1);
      assertEquals(prefs.units, "metric");
      assertEquals(prefs.notifications, true);
      console.log(`Retrieved preferences for 'ivan': ${JSON.stringify(prefs)}`);
    });

    await t.step("getPreferences: non-existent preferences", async () => {
      console.log("\nTest: getPreferences - non-existent preferences");
      const nonExistentPrefsId = "another_nonexistent_prefs_id" as ID;
      const prefs = await concept.getPreferences({ preferencesId: nonExistentPrefsId });
      assertNull(prefs);
      console.log(`Attempted to retrieve non-existent preferences (${nonExistentPrefsId}), result: ${prefs}`);
    });

    await t.step("getPreferencesByUser: existing user", async () => {
      console.log("\nTest: getPreferencesByUser - existing user (same as getUserPreferencesId)");
      const createUserResult = await concept.createUser({ username: "julia", email: "julia@example.com" });
      const { userId: juliaId } = createUserResult as { userId: ID };
      console.log(`User 'julia' created with ID: ${juliaId}`);
      const prefsIdResult = await concept.getPreferencesByUser({ userId: juliaId });
      assertExists(prefsIdResult);
      assertExists(prefsIdResult.preferencesId);
      console.log(`Retrieved preferences ID for 'julia' via getPreferencesByUser: ${prefsIdResult.preferencesId}`);
    });

    await t.step("getPreferencesByUser: non-existent user", async () => {
      console.log("\nTest: getPreferencesByUser - non-existent user (same as getUserPreferencesId)");
      const nonExistentId = "nonexistent_id_4" as ID;
      const prefsIdResult = await concept.getPreferencesByUser({ userId: nonExistentId });
      assertNull(prefsIdResult);
      console.log(`Attempted to retrieve preferences ID for non-existent user (${nonExistentId}) via getPreferencesByUser, result: ${prefsIdResult}`);
    });
  } finally {
    await client.close();
  }
});
```

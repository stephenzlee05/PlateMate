[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: ExerciseCatalog
# response:

# file: src/concepts/ExerciseCatalog/ExerciseCatalogConcept.test.ts

```typescript
import { assertEquals, assertExists, assertInstanceOf } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ExerciseCatalogConcept from "./ExerciseCatalogConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("ExerciseCatalogConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new ExerciseCatalogConcept(db);

  // --- Utility for consistent test IDs ---
  const userA = "user:Alice" as ID; // Example external user ID, though not directly used by this concept

  // --- Action: addCategory ---
  await t.step("addCategory: should successfully add a new category", async () => {
    console.log("Test: addCategory - success");
    const result = await concept.addCategory({ name: "Cardio" });
    assertExists((result as { category: ID }).category, "Should return the new category ID");
    const categoryID = (result as { category: ID }).category;

    const categories = await concept._getCategories();
    assertEquals(categories.length, 1, "Should have one category in the catalog");
    assertEquals(categories[0].name, "Cardio", "Category name should match");
    assertEquals(categories[0].categoryID, categoryID, "Category ID should match");
    console.log(`  Added category: ${categoryID} - Cardio`);
  });

  await t.step("addCategory: should return an error if category name already exists", async () => {
    console.log("Test: addCategory - duplicate name error");
    await concept.addCategory({ name: "Strength" }); // First time
    const result = await concept.addCategory({ name: "Strength" }); // Second time
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, "Category with name 'Strength' already exists.", "Error message should indicate duplicate name");
    console.log(`  Attempted to add duplicate category: Strength. Received error: ${(result as { error: string }).error}`);
  });

  // --- Action: addExercise ---
  let cardioCategoryID: ID;
  let strengthCategoryID: ID;

  await t.step("addExercise: setup categories for exercise tests", async () => {
    const cardioResult = await concept.addCategory({ name: "Cardio_Ex" });
    cardioCategoryID = (cardioResult as { category: ID }).category;
    const strengthResult = await concept.addCategory({ name: "Strength_Ex" });
    strengthCategoryID = (strengthResult as { category: ID }).category;
    console.log(`  Setup categories: Cardio_Ex (${cardioCategoryID}), Strength_Ex (${strengthCategoryID})`);
  });

  let pushupsID: ID;
  await t.step("addExercise: should successfully add a new exercise", async () => {
    console.log("Test: addExercise - success");
    const result = await concept.addExercise({
      name: "Push-ups",
      description: "Bodyweight exercise for chest and triceps.",
      category: strengthCategoryID,
      tags: ["bodyweight", "chest", "triceps"],
    });
    assertExists((result as { exercise: ID }).exercise, "Should return the new exercise ID");
    pushupsID = (result as { exercise: ID }).exercise;

    const exercises = await concept._listExercises();
    assertEquals(exercises.length, 3, "Should have 3 exercises in the catalog now"); // Including existing from principle test if any
    const foundExercise = exercises.find(e => e.exerciseID === pushupsID);
    assertExists(foundExercise, "The added exercise should be in the list");
    assertEquals(foundExercise?.name, "Push-ups");
    console.log(`  Added exercise: ${pushupsID} - Push-ups`);
  });

  await t.step("addExercise: should return an error if exercise name already exists", async () => {
    console.log("Test: addExercise - duplicate name error");
    const result = await concept.addExercise({
      name: "Push-ups",
      description: "Another description.",
      category: strengthCategoryID,
      tags: [],
    });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, "Exercise with name 'Push-ups' already exists.", "Error message should indicate duplicate name");
    console.log(`  Attempted to add duplicate exercise: Push-ups. Received error: ${(result as { error: string }).error}`);
  });

  await t.step("addExercise: should return an error if category does not exist", async () => {
    console.log("Test: addExercise - non-existent category error");
    const nonExistentCategory = "nonexistent:category" as ID;
    const result = await concept.addExercise({
      name: "New Exercise",
      description: "Some description.",
      category: nonExistentCategory,
      tags: [],
    });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, `Category with ID '${nonExistentCategory}' does not exist.`, "Error message should indicate non-existent category");
    console.log(`  Attempted to add exercise with non-existent category. Received error: ${(result as { error: string }).error}`);
  });

  // --- Action: updateExercise ---
  let burpeeID: ID;
  await t.step("updateExercise: setup exercise for update tests", async () => {
    const result = await concept.addExercise({
      name: "Burpees",
      description: "Full body cardio exercise.",
      category: cardioCategoryID,
      tags: ["cardio", "full body"],
    });
    burpeeID = (result as { exercise: ID }).exercise;
    console.log(`  Setup exercise: ${burpeeID} - Burpees`);
  });

  await t.step("updateExercise: should successfully update exercise name", async () => {
    console.log("Test: updateExercise - update name");
    const result = await concept.updateExercise({ exercise: burpeeID, name: "Burpee Jumps" });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const updatedExercise = await concept._getExercise({ exercise: burpeeID });
    assertEquals(updatedExercise[0]?.name, "Burpee Jumps", "Exercise name should be updated");
    console.log(`  Updated exercise ${burpeeID} name to: Burpee Jumps`);
  });

  await t.step("updateExercise: should successfully update description and tags", async () => {
    console.log("Test: updateExercise - update description and tags");
    const result = await concept.updateExercise({
      exercise: burpeeID,
      description: "High-intensity full body exercise.",
      tags: ["cardio", "full body", "hiit"],
    });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const updatedExercise = await concept._getExercise({ exercise: burpeeID });
    assertEquals(updatedExercise[0]?.description, "High-intensity full body exercise.", "Exercise description should be updated");
    assertEquals(updatedExercise[0]?.tags, ["cardio", "full body", "hiit"], "Exercise tags should be updated");
    console.log(`  Updated exercise ${burpeeID} description and tags`);
  });

  await t.step("updateExercise: should successfully update category", async () => {
    console.log("Test: updateExercise - update category");
    const newCategoryResult = await concept.addCategory({ name: "HIIT" });
    const hiitCategoryID = (newCategoryResult as { category: ID }).category;

    const result = await concept.updateExercise({ exercise: burpeeID, category: hiitCategoryID });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const updatedExercise = await concept._getExercise({ exercise: burpeeID });
    assertEquals(updatedExercise[0]?.category, hiitCategoryID, "Exercise category should be updated");
    console.log(`  Updated exercise ${burpeeID} category to: ${hiitCategoryID}`);
  });

  await t.step("updateExercise: should return an error if exercise does not exist", async () => {
    console.log("Test: updateExercise - non-existent exercise error");
    const nonExistentExercise = "nonexistent:exercise" as ID;
    const result = await concept.updateExercise({ exercise: nonExistentExercise, name: "Ghost Exercise" });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, `Exercise with ID '${nonExistentExercise}' not found.`, "Error message should indicate non-existent exercise");
    console.log(`  Attempted to update non-existent exercise. Received error: ${(result as { error: string }).error}`);
  });

  await t.step("updateExercise: should return an error if new category does not exist", async () => {
    console.log("Test: updateExercise - non-existent new category error");
    const nonExistentCategory = "nonexistent:category" as ID;
    const result = await concept.updateExercise({ exercise: burpeeID, category: nonExistentCategory });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, `Category with ID '${nonExistentCategory}' does not exist.`, "Error message should indicate non-existent category");
    console.log(`  Attempted to update exercise category to non-existent. Received error: ${(result as { error: string }).error}`);
  });

  await t.step("updateExercise: should return an error if new name already exists for another exercise", async () => {
    console.log("Test: updateExercise - duplicate name conflict");
    // We have "Push-ups" and "Burpee Jumps"
    const result = await concept.updateExercise({ exercise: burpeeID, name: "Push-ups" });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, "Another exercise with name 'Push-ups' already exists.", "Error message should indicate duplicate name conflict");
    console.log(`  Attempted to update exercise ${burpeeID} name to 'Push-ups', which already exists. Received error: ${(result as { error: string }).error}`);
  });

  // --- Action: removeExercise ---
  await t.step("removeExercise: should successfully remove an exercise", async () => {
    console.log("Test: removeExercise - success");
    const result = await concept.removeExercise({ exercise: pushupsID });
    assertEquals(Object.keys(result).length, 0, "Should return an empty object on success");

    const exercises = await concept._listExercises();
    const foundExercise = exercises.find(e => e.exerciseID === pushupsID);
    assertEquals(foundExercise, undefined, "The removed exercise should not be in the list");
    console.log(`  Removed exercise: ${pushupsID}`);
  });

  await t.step("removeExercise: should return an error if exercise does not exist", async () => {
    console.log("Test: removeExercise - non-existent exercise error");
    const nonExistentExercise = "nonexistent:exercise" as ID;
    const result = await concept.removeExercise({ exercise: nonExistentExercise });
    assertExists((result as { error: string }).error, "Should return an error object");
    assertEquals((result as { error: string }).error, `Exercise with ID '${nonExistentExercise}' not found.`, "Error message should indicate non-existent exercise");
    console.log(`  Attempted to remove non-existent exercise. Received error: ${(result as { error: string }).error}`);
  });

  // --- Query: _getExercise ---
  await t.step("_getExercise: should retrieve details for an existing exercise", async () => {
    console.log("Test: _getExercise - success");
    const fetchedExercise = await concept._getExercise({ exercise: burpeeID });
    assertEquals(fetchedExercise.length, 1, "Should return one exercise");
    assertEquals(fetchedExercise[0]?.exerciseID, burpeeID);
    assertEquals(fetchedExercise[0]?.name, "Burpee Jumps"); // Name after update
    console.log(`  Fetched exercise ${burpeeID}: ${fetchedExercise[0]?.name}`);
  });

  await t.step("_getExercise: should return an empty array for a non-existent exercise", async () => {
    console.log("Test: _getExercise - not found");
    const nonExistentExercise = "nonexistent:exercise" as ID;
    const fetchedExercise = await concept._getExercise({ exercise: nonExistentExercise });
    assertEquals(fetchedExercise.length, 0, "Should return an empty array");
    console.log(`  Attempted to fetch non-existent exercise ${nonExistentExercise}. Result: empty array`);
  });

  // --- Query: _listExercises ---
  await t.step("_listExercises: should return all exercises", async () => {
    console.log("Test: _listExercises - all exercises");
    const exercises = await concept._listExercises();
    // Two from setup (Cardio_Ex, Strength_Ex), one from update (Burpee Jumps), one from principle (Jumping Jacks)
    // Note: the `addCategory` and `addExercise` tests added Cardio_Ex, Strength_Ex, Push-ups, and Burpees.
    // Push-ups were removed. So we should have Burpee Jumps (originally Burpees), and the two from the principle below.
    assertEquals(exercises.length, 1 + 2, "Should return all remaining exercises"); // Burpee Jumps + principle exercises
    const burpee = exercises.find(e => e.exerciseID === burpeeID);
    assertExists(burpee);
    assertEquals(burpee.name, "Burpee Jumps");
    console.log(`  Listed ${exercises.length} exercises.`);
  });

  // --- Query: _getCategories ---
  await t.step("_getCategories: should return all categories", async () => {
    console.log("Test: _getCategories - all categories");
    const categories = await concept._getCategories();
    // Expected categories: Cardio, Strength, Cardio_Ex, Strength_Ex, HIIT
    assertEquals(categories.length, 5, "Should return all categories");
    const cardioCategory = categories.find(c => c.name === "Cardio");
    assertExists(cardioCategory, "Cardio category should exist");
    console.log(`  Listed ${categories.length} categories.`);
  });

  // --- Principle Trace ---
  await t.step("Principle Trace: demonstrates adding and searching exercises", async () => {
    console.log("\n--- Principle Trace Start ---");
    console.log("Principle: after an administrator adds a new exercise with a name, description, and category, users can browse the catalog and find this exercise by its name or by filtering on its category.");

    // Action 1: Add a new category
    const yogaResult = await concept.addCategory({ name: "Yoga" });
    const yogaCategoryID = (yogaResult as { category: ID }).category;
    console.log(`  1. Added category 'Yoga' with ID: ${yogaCategoryID}`);

    // Action 2: Add a new exercise
    const jumpingJacksResult = await concept.addExercise({
      name: "Jumping Jacks",
      description: "Basic warm-up exercise.",
      category: yogaCategoryID, // Using the new category
      tags: ["warm-up", "cardio", "full body"],
    });
    const jumpingJacksID = (jumpingJacksResult as { exercise: ID }).exercise;
    console.log(`  2. Added exercise 'Jumping Jacks' with ID: ${jumpingJacksID} to category ${yogaCategoryID}`);

    // Verification 1: Users can find this exercise by its name
    console.log("  3. Searching for 'Jumping Jacks' by name...");
    const searchByNameResult = await concept._searchExercises({ query: "Jumping Jacks" });
    assertEquals(searchByNameResult.length, 1, "Should find one exercise by full name");
    assertEquals(searchByNameResult[0]?.name, "Jumping Jacks", "Found exercise name should match");
    assertEquals(searchByNameResult[0]?.exerciseID, jumpingJacksID, "Found exercise ID should match");
    console.log(`     Found by name: ${searchByNameResult[0]?.name}`);

    console.log("  4. Searching for 'Jumping' (substring) by name/description...");
    const searchBySubstringNameResult = await concept._searchExercises({ query: "Jumping" });
    assertEquals(searchBySubstringNameResult.length, 1, "Should find one exercise by substring name");
    assertEquals(searchBySubstringNameResult[0]?.name, "Jumping Jacks", "Found exercise name should match");
    console.log(`     Found by substring: ${searchBySubstringNameResult[0]?.name}`);

    // Verification 2: Users can find this exercise by filtering on its category
    console.log(`  5. Searching for exercises in category 'Yoga' (${yogaCategoryID})...`);
    const searchByCategoryResult = await concept._searchExercises({ query: "", category: yogaCategoryID });
    assertEquals(searchByCategoryResult.length, 1, "Should find one exercise by category");
    assertEquals(searchByCategoryResult[0]?.name, "Jumping Jacks", "Found exercise name should match");
    assertEquals(searchByCategoryResult[0]?.exerciseID, jumpingJacksID, "Found exercise ID should match");
    console.log(`     Found by category: ${searchByCategoryResult[0]?.name}`);

    // Verification 3: Combined search (e.g., "warm-up" in description/name, filtered by category and tag)
    const plankResult = await concept.addExercise({
      name: "Plank",
      description: "Core strengthening exercise, often used in warm-ups.",
      category: yogaCategoryID,
      tags: ["core", "warm-up"],
    });
    const plankID = (plankResult as { exercise: ID }).exercise;
    console.log(`  6. Added 'Plank' (${plankID}) to Yoga category with tags [core, warm-up]`);

    console.log(`  7. Searching for 'warm-up' in Yoga category with 'core' tag...`);
    const combinedSearchResult = await concept._searchExercises({ query: "warm-up", category: yogaCategoryID, tags: ["core"] });
    assertEquals(combinedSearchResult.length, 1, "Should find one exercise (Plank)");
    assertEquals(combinedSearchResult[0]?.name, "Plank", "Found exercise name should be Plank");
    console.log(`     Found by combined search: ${combinedSearchResult[0]?.name}`);


    console.log("Principle Trace: Successfully demonstrated adding and finding exercises by name and category.");
    console.log("--- Principle Trace End ---\n");
  });

  // --- Query: _searchExercises (detailed tests) ---
  await t.step("_searchExercises: should find exercises by query in name or description (case-insensitive)", async () => {
    console.log("Test: _searchExercises - query string");
    const result = await concept._searchExercises({ query: "jacks" }); // Case-insensitive
    assertEquals(result.length, 1, "Should find one exercise");
    assertEquals(result[0]?.name, "Jumping Jacks", "Should match 'Jumping Jacks'");

    const result2 = await concept._searchExercises({ query: "warm-up" }); // Matches description
    assertEquals(result2.length, 2, "Should find two exercises ('Jumping Jacks' description, 'Plank' description)");
    assertEquals(result2.some(e => e.name === "Jumping Jacks"), true);
    assertEquals(result2.some(e => e.name === "Plank"), true);
    console.log(`  Searched for 'jacks': found ${result[0]?.name}`);
    console.log(`  Searched for 'warm-up': found ${result2.map(e => e.name).join(', ')}`);
  });

  await t.step("_searchExercises: should filter by category", async () => {
    console.log("Test: _searchExercises - filter by category");
    const categories = await concept._getCategories();
    const yogaCat = categories.find(c => c.name === "Yoga");
    assertExists(yogaCat);

    const result = await concept._searchExercises({ query: "", category: yogaCat.categoryID });
    assertEquals(result.length, 2, "Should find two exercises in Yoga category (Jumping Jacks, Plank)");
    assertEquals(result.some(e => e.name === "Jumping Jacks"), true);
    assertEquals(result.some(e => e.name === "Plank"), true);
    console.log(`  Searched by Yoga category: found ${result.map(e => e.name).join(', ')}`);
  });

  await t.step("_searchExercises: should filter by tags", async () => {
    console.log("Test: _searchExercises - filter by tags");
    const result = await concept._searchExercises({ query: "", tags: ["hiit"] });
    assertEquals(result.length, 1, "Should find one exercise with 'hiit' tag (Burpee Jumps)");
    assertEquals(result[0]?.name, "Burpee Jumps");
    console.log(`  Searched by 'hiit' tag: found ${result[0]?.name}`);

    const result2 = await concept._searchExercises({ query: "", tags: ["full body"] });
    assertEquals(result2.length, 2, "Should find two exercises with 'full body' tag (Burpee Jumps, Jumping Jacks)");
    assertEquals(result2.some(e => e.name === "Burpee Jumps"), true);
    assertEquals(result2.some(e => e.name === "Jumping Jacks"), true);
    console.log(`  Searched by 'full body' tag: found ${result2.map(e => e.name).join(', ')}`);
  });

  await t.step("_searchExercises: should combine query, category, and tags", async () => {
    console.log("Test: _searchExercises - combined filters");
    const categories = await concept._getCategories();
    const yogaCat = categories.find(c => c.name === "Yoga");
    assertExists(yogaCat);

    const result = await concept._searchExercises({
      query: "warm-up",
      category: yogaCat.categoryID,
      tags: ["core"],
    });
    assertEquals(result.length, 1, "Should find one exercise (Plank)");
    assertEquals(result[0]?.name, "Plank", "Should be 'Plank'");
    console.log(`  Combined search for 'warm-up' in Yoga category with 'core' tag: found ${result[0]?.name}`);
  });

  await t.step("_searchExercises: should return empty array if no matches", async () => {
    console.log("Test: _searchExercises - no matches");
    const result = await concept._searchExercises({ query: "nonexistent" });
    assertEquals(result.length, 0, "Should return an empty array");
    console.log(`  Searched for 'nonexistent': found ${result.length} exercises.`);
  });

  await t.step("_searchExercises: should return all if no filters/query", async () => {
    console.log("Test: _searchExercises - no filters/query");
    const result = await concept._searchExercises({ query: "" });
    assertEquals(result.length, 3, "Should return all 3 exercises (Burpee Jumps, Jumping Jacks, Plank)");
    console.log(`  Searched with no filters: found ${result.length} exercises.`);
  });


  await client.close();
});
```
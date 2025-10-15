```
PS C:\Users\steph\OneDrive\Desktop\PlateMate> deno test src/concepts/ExerciseCatalog/ExerciseCatalogConcept.test.ts --allow-read --allow-env --allow-sys --allow-net
Check file:///C:/Users/steph/OneDrive/Desktop/PlateMate/src/concepts/ExerciseCatalog/ExerciseCatalogConcept.test.ts
running 1 test from ./src/concepts/ExerciseCatalog/ExerciseCatalogConcept.test.ts
ExerciseCatalog Concept ...
  Operational Principle: Complete exercise catalog workflow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===
Testing the common expected usage: add exercises, search, and retrieve

1. Adding comprehensive exercise: Bench Press
   ✓ Exercise created with ID: 0199da5c-4bb3-73ad-8fe6-c0e6eb0893f3

2. Retrieving exercise by ID: 0199da5c-4bb3-73ad-8fe6-c0e6eb0893f3
   ✓ Exercise retrieved: Bench Press

3. Searching for exercises by name: "bench"
   ✓ Search found 1 exercises

4. Searching for exercises by muscle group: "chest"
   ✓ Muscle group search found 1 exercises

✓ Operational principle test completed successfully
----- output end -----
  Operational Principle: Complete exercise catalog workflow ... ok (183ms)
  Interesting Scenario 1: Building a comprehensive exercise library ...
------- output -------

=== SCENARIO 1: BUILDING COMPREHENSIVE EXERCISE LIBRARY ===
Testing adding multiple exercises with different characteristics

1. Adding exercise: Squat
   ✓ Added Squat with ID: 0199da5c-4c61-75a8-892d-046158e0f9fe

2. Adding exercise: Deadlift
   ✓ Added Deadlift with ID: 0199da5c-4cc7-7a0b-8a86-89ae5cdf0921

3. Adding exercise: Push-ups
   ✓ Added Push-ups with ID: 0199da5c-4d2c-7cb0-b921-396bb68b1538

4. Adding exercise: Pull-ups
   ✓ Added Pull-ups with ID: 0199da5c-4d90-71c3-9763-09f3b3a6f360

5. Adding exercise: Romanian Deadlift
   ✓ Added Romanian Deadlift with ID: 0199da5c-4df0-703e-9917-19109895ab62

✓ Successfully added 5 exercises to catalog

6. Testing search across full exercise library
   ✓ Found 2 push exercises: Bench Press, Push-ups
   ✓ Found 3 back exercises: Deadlift, Pull-ups, Romanian Deadlift
   ✓ Empty search returned 6 total exercises
----- output end -----
  Interesting Scenario 1: Building a comprehensive exercise library ... ok (596ms)
  Interesting Scenario 2: Error handling and validation ...
------- output -------

=== SCENARIO 2: ERROR HANDLING AND VALIDATION ===
Testing various error conditions and edge cases

1. Testing duplicate exercise name prevention
   ✓ Correctly rejected duplicate name: "Exercise with name 'Squat' already exists"

2. Testing empty exercise name
   ✓ Correctly rejected empty name: "Exercise name cannot be empty"

3. Testing empty muscle groups
   ✓ Correctly rejected empty muscle groups: "At least one muscle group must be specified"

4. Testing empty movement pattern
   ✓ Correctly rejected empty movement pattern: "movement pattern cannot be empty"

5. Testing retrieval of non-existent exercise
   ✓ Correctly handled non-existent exercise: "Exercise with ID nonexistent not found"
----- output end -----
  Interesting Scenario 2: Error handling and validation ... ok (67ms)
  Interesting Scenario 3: Advanced search capabilities ...
------- output -------

=== SCENARIO 3: ADVANCED SEARCH CAPABILITIES ===
Testing various search combinations and edge cases

1. Testing case-insensitive search
   ✓ Case-insensitive search for "BENCH" found 1 exercises

2. Testing partial name matching
   ✓ Partial search for "deadlift" found 2 exercises

3. Testing combined query and muscle group search
   ✓ Combined search (deadlift + back) found 2 exercises

4. Testing search with non-matching query
   ✓ Non-matching search found 0 exercises

5. Testing search with non-matching muscle group
   ✓ Non-matching muscle group search found 0 exercises

6. Testing empty search (should return all exercises)
   ✓ Empty search returned 6 exercises
----- output end -----
  Interesting Scenario 3: Advanced search capabilities ... ok (209ms)
  Interesting Scenario 4: Exercise variations and similar exercises ...
------- output -------

=== SCENARIO 4: EXERCISE VARIATIONS AND SIMILAR EXERCISES ===
Testing adding exercises with similar names and characteristics

1. Adding exercise variation: Incline Bench Press
   ✓ Added Incline Bench Press with ID: 0199da5c-4fd7-7a35-b3e7-4090e0498b1d

2. Adding exercise variation: Decline Bench Press
   ✓ Added Decline Bench Press with ID: 0199da5c-5038-7375-a8b3-bca3eebeaabc

3. Adding exercise variation: Dumbbell Bench Press
   ✓ Added Dumbbell Bench Press with ID: 0199da5c-509e-7581-8bfb-897c764d5bca

4. Adding exercise variation: Goblet Squat
   ✓ Added Goblet Squat with ID: 0199da5c-510d-7c27-bd36-054b5d515f6b

5. Searching for bench press family
   ✓ Found 4 bench press variations
   ✓ Bench press family: Bench Press, Decline Bench Press, Dumbbell Bench Press, Incline Bench Press

6. Searching for squat family
   ✓ Found 2 squat variations

7. Searching for chest exercises across all variations
   ✓ Found 5 chest exercises
----- output end -----
  Interesting Scenario 4: Exercise variations and similar exercises ... ok (507ms)
  Interesting Scenario 5: Catalog maintenance and data integrity ...
------- output -------

=== SCENARIO 5: CATALOG MAINTENANCE AND DATA INTEGRITY ===
Testing catalog operations and data consistency

1. Testing retrieval of all exercises
   ✓ Catalog contains 10 total exercises
   ✓ Exercise 1: Bench Press (chest, shoulders, triceps)
   ✓ Exercise 2: Squat (legs, glutes)
   ✓ Exercise 3: Deadlift (back, legs, glutes)
   ✓ Exercise 4: Push-ups (chest, triceps)
   ✓ Exercise 5: Pull-ups (back, biceps)
   ✓ Exercise 6: Romanian Deadlift (back, legs)
   ✓ Exercise 7: Incline Bench Press (chest, shoulders)
   ✓ Exercise 8: Decline Bench Press (chest)
   ✓ Exercise 9: Dumbbell Bench Press (chest, shoulders, triceps)
   ✓ Exercise 10: Goblet Squat (legs, glutes)

2. Testing muscle group distribution
   ✓ Chest exercises: 5
   ✓ Back exercises: 3
   ✓ Leg exercises: 4

3. Testing movement pattern distribution
   ✓ Push exercises: 5
   ✓ Pull exercises: 1
   ✓ Hinge exercises: 2
   ✓ Squat exercises: 2

4. Testing search consistency
   ✓ Repeated searches return consistent results: 4 = 4

5. Testing all exercises can be retrieved by ID
   ✓ Successfully retrieved 10/10 exercises by ID
----- output end -----
  Interesting Scenario 5: Catalog maintenance and data integrity ... ok (664ms)
ExerciseCatalog Concept ... ok (4s)

ok | 1 passed (6 steps) | 0 failed (4s)
```
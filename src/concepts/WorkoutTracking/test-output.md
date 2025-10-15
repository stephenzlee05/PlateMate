```
PS C:\Users\steph\OneDrive\Desktop\PlateMate> deno test src/concepts/WorkoutTracking/WorkoutTrackingConcept.test.ts --allow-net --allow-read --allow-write --allow-env --allow-sys    
Check file:///C:/Users/steph/OneDrive/Desktop/PlateMate/src/concepts/WorkoutTracking/WorkoutTrackingConcept.test.ts
running 1 test from ./src/concepts/WorkoutTracking/WorkoutTrackingConcept.test.ts
WorkoutTracking Concept ...
  Operational Principle: Complete workout tracking flow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===
Testing the common expected usage: start session, record exercises, get history

1. Starting session for user: user123, date: 2024-01-15
   ✓ Session created with ID: 0199da60-3088-7654-9a42-ca3068b29bb1

2. Recording bench press exercise: 135lbs, 3 sets x 10 reps
   ✓ Exercise recorded successfully

3. Getting last weight for exercise: benchpress
   ✓ Last weight retrieved: 135lbs

4. Getting workout history for exercise: benchpress
   ✓ History retrieved: 1 records

✓ Operational principle test completed successfully
----- output end -----
  Operational Principle: Complete workout tracking flow ... ok (439ms)
  Interesting Scenario 1: Multiple sessions with progression ...
------- output -------

=== SCENARIO 1: MULTIPLE SESSIONS WITH PROGRESSION ===
Testing progression tracking across multiple workout sessions

Creating session 1: 2024-01-10, weight: 125lbs
   ✓ Recorded 125lbs in session 0199da60-3240-7bb5-bcc1-6259c841fd8f

Creating session 2: 2024-01-12, weight: 130lbs
   ✓ Recorded 130lbs in session 0199da60-3314-75bd-92a7-837f9ae65478

Creating session 3: 2024-01-15, weight: 135lbs
   ✓ Recorded 135lbs in session 0199da60-3457-7336-bd70-4d80f9cf2708

Creating session 4: 2024-01-17, weight: 140lbs
   ✓ Recorded 140lbs in session 0199da60-3524-7bc9-8e2a-cbd0326ba5ed

Checking last weight after 4 sessions
   ✓ Last weight: 140lbs (should be 140)

Checking workout history for progression
   ✓ History shows 5 records
   ✓ Weight progression: 140 -> 135 -> 135 -> 130 -> 125lbs
----- output end -----
  Interesting Scenario 1: Multiple sessions with progression ... ok (1s)
  Interesting Scenario 2: Error handling and validation ...
------- output -------

=== SCENARIO 2: ERROR HANDLING AND VALIDATION ===
Testing various error conditions and edge cases

1. Testing invalid session creation
   ✓ Correctly rejected empty user: "User is required"
   ✓ Correctly rejected invalid date: "Invalid date format"

2. Created valid session: 0199da60-3640-7f76-a6f4-497361cca64a

3. Testing invalid exercise recording
   ✓ Correctly rejected negative weight: "Weight cannot be negative"
   ✓ Correctly rejected zero sets: "Sets must be greater than 0"
   ✓ Successfully recorded valid exercise: 145lbs, 4x8

4. Testing non-existent session
   ✓ Correctly rejected non-existent session: "Session with ID nonexistent not found"
----- output end -----
  Interesting Scenario 2: Error handling and validation ... ok (358ms)
  Interesting Scenario 3: Empty history and new user ...
------- output -------

=== SCENARIO 3: EMPTY HISTORY AND NEW USER ===
Testing behavior with new users and exercises that have no history

1. Getting last weight for new user: newuser456, exercise: deadlift
   ✓ Last weight for new user: null (should be null)

2. Getting workout history for new user
   ✓ Workout history for new user: 0 records

3. Creating first session for new user
   ✓ First session created: 0199da60-3808-7947-ac2c-d0165d3a19e1
   ✓ First exercise recorded: 225lbs, 1x5
   ✓ After first session: 1 record
----- output end -----
  Interesting Scenario 3: Empty history and new user ... ok (302ms)
  Interesting Scenario 4: Repeated actions with same parameters ...
------- output -------

=== SCENARIO 4: REPEATED ACTIONS WITH SAME PARAMETERS ===
Testing behavior when same actions are repeated multiple times

1. Creating multiple sessions on same date: 2024-01-30
   ✓ Created two sessions on same date: 0199da60-38d5-719f-b723-9c66de1e545a, 0199da60-3915-7d95-a040-16e71ffadcc5
   ✓ Recorded same exercise (squat, 185lbs) in both sessions
   ✓ History shows 2 squat records
     Record 1: 185lbs, session: 0199da60-3915-7d95-a040-16e71ffadcc5
     Record 2: 185lbs, session: 0199da60-38d5-719f-b723-9c66de1e545a

2. Testing repeated getLastWeight calls
   ✓ Repeated calls return consistent results: 185lbs
----- output end -----
  Interesting Scenario 4: Repeated actions with same parameters ... ok (467ms)
  Interesting Scenario 5: Limit parameter edge cases ...
------- output -------

=== SCENARIO 5: LIMIT PARAMETER EDGE CASES ===
Testing various limit values and edge cases for workout history

1. Testing history with limit = 1
   ✓ Limit 1 returned 1 record

2. Testing history with limit = 0 (should fail)
   ✓ Correctly rejected limit = 0: "Limit must be greater than 0"

3. Testing history with large limit = 100
   ✓ Large limit returned 6 records

4. Testing history with negative limit = -5 (should fail)
   ✓ Correctly rejected negative limit: "Limit must be greater than 0"
----- output end -----
  Interesting Scenario 5: Limit parameter edge cases ... ok (73ms)
WorkoutTracking Concept ... ok (4s)

ok | 1 passed (6 steps) | 0 failed (4s)
```
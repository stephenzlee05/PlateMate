```
PS C:\Users\steph\OneDrive\Desktop\PlateMate> deno test src/concepts/RoutinePlanner/RoutinePlannerConcept.test.ts --allow-net --allow-read --allow-write --allow-env --allow-sys      
Check file:///C:/Users/steph/OneDrive/Desktop/PlateMate/src/concepts/RoutinePlanner/RoutinePlannerConcept.test.ts
running 1 test from ./src/concepts/RoutinePlanner/RoutinePlannerConcept.test.ts
RoutinePlanner Concept ...
  Operational Principle: Complete routine planning workflow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===
Testing the common expected usage: create template, set default, get suggested workout

1. Creating workout template: Push Day
   ✓ Template created with ID: 0199da5d-921f-7c2c-b11f-5fa240a3be6d

2. Setting template as default for user
   ✓ Template set as default successfully

3. Getting suggested workout for user
   ✓ Suggested workout: Push Day

4. Updating weekly volume for tracking
   ✓ Volume updated successfully

✓ Operational principle test completed successfully
----- output end -----
  Operational Principle: Complete routine planning workflow ... ok (428ms)
  Interesting Scenario 1: Multiple templates and template management ...
------- output -------

=== SCENARIO 1: MULTIPLE TEMPLATES AND TEMPLATE MANAGEMENT ===
Testing creation and management of multiple workout templates

0. Clearing existing data for clean test
   ✓ Cleared existing templates and data

1. Creating template: Pull Day
   ✓ Created Pull Day with ID: 0199da5d-9462-7478-832d-15d4cd239cc3
     Exercises: pullups, bentoverrow, bicepcurl

2. Creating template: Leg Day
   ✓ Created Leg Day with ID: 0199da5d-94a5-7f9a-855a-98e09b0e5200
     Exercises: squat, deadlift, lunges

3. Creating template: Full Body
   ✓ Created Full Body with ID: 0199da5d-950a-7cf3-82a6-5216d62409fd
     Exercises: benchpress, squat, pullups

4. Creating template: Upper Body
   ✓ Created Upper Body with ID: 0199da5d-9550-705d-8b44-06036ea75f01
     Exercises: benchpress, pullups, overheadpress, bentoverrow

5. Setting Full Body as default template
   ✓ Full Body template set as default
   ✓ Suggested workout: Full Body

6. Retrieving all templates
   ✓ Found 4 total templates
   ✓ Template names: Full Body, Leg Day, Pull Day, Upper Body
   ✓ User has 4 templates
----- output end -----
  Interesting Scenario 1: Multiple templates and template management ... ok (836ms)
  Interesting Scenario 2: Volume tracking and muscle group balance ...
------- output -------

=== SCENARIO 2: VOLUME TRACKING AND MUSCLE GROUP BALANCE ===
Testing volume accumulation and balance checking across muscle groups

1. Creating volume records for different muscle groups
   1. Recording benchpress: 4x8 @ 135lbs
   2. Recording inclinebench: 3x10 @ 115lbs
   3. Recording squat: 5x5 @ 185lbs
   4. Recording deadlift: 3x8 @ 225lbs
   5. Recording pullups: 4x8 @ 0lbs

2. Checking weekly volume accumulation
   ✓ Found volume records for 3 muscle groups
     chest: 7770 total volume
     legs: 4625 total volume
     back: 5400 total volume

3. Checking muscle group balance
   ✓ Balance check found 0 imbalanced muscle groups
     All muscle groups are balanced

4. Creating intentionally imbalanced scenario
   ✓ Imbalance check found 1 imbalanced groups
----- output end -----
  Interesting Scenario 2: Volume tracking and muscle group balance ... ok (349ms)
  Interesting Scenario 3: Error handling and validation ...
------- output -------

=== SCENARIO 3: ERROR HANDLING AND VALIDATION ===
Testing various error conditions and edge cases

1. Testing template creation validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected empty name: "Template name cannot be empty"
   ✓ Correctly rejected empty exercises: "At least one exercise must be specified"

2. Testing setDefaultTemplate validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected non-existent template: "Template with ID nonexistent not found"

3. Testing getSuggestedWorkout validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected invalid date: "Invalid date format"

4. Testing updateVolume validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected zero sets: "Sets, reps, and weight must be positive values"
----- output end -----
  Interesting Scenario 3: Error handling and validation ... ok (33ms)
  Interesting Scenario 4: User with no templates ...
------- output -------

=== SCENARIO 4: USER WITH NO TEMPLATES ===
Testing behavior for users who haven't created any templates

1. Getting suggested workout for user with no templates
   ✓ No templates result: null

2. Testing setDefaultTemplate with non-existent template
   ✓ Correctly rejected non-existent template: "Template with ID nonexistent not found"

3. Testing volume tracking for new user
   ✓ Volume tracking works for new user

4. Checking balance for new user
   ✓ New user balance: 0 imbalanced groups

5. Getting user templates for user with no templates
   ✓ New user has 0 templates
----- output end -----
  Interesting Scenario 4: User with no templates ... ok (174ms)
  Interesting Scenario 5: Multiple weeks and volume tracking ...
------- output -------

=== SCENARIO 5: MULTIPLE WEEKS AND VOLUME TRACKING ===
Testing volume tracking across multiple weeks and time periods

1. Recording volume for week starting 2024-01-15
   benchpress: 3x8 @ 100lbs
   squat: 4x9 @ 110lbs
   ✓ Week 1 volume: 2 muscle groups tracked
     chest: 2400 total volume
     legs: 3960 total volume

2. Recording volume for week starting 2024-01-22
   benchpress: 3x8 @ 105lbs
   deadlift: 4x9 @ 115lbs
   ✓ Week 2 volume: 2 muscle groups tracked
     chest: 2520 total volume
     back: 4140 total volume

3. Recording volume for week starting 2024-01-29
   inclinebench: 3x8 @ 110lbs
   squat: 4x9 @ 120lbs
   pullups: 5x10 @ 130lbs
   ✓ Week 3 volume: 3 muscle groups tracked
     chest: 2640 total volume
     legs: 4320 total volume
     back: 6500 total volume

4. Testing balance checking across different weeks
   Week 1 (2024-01-15): 0 imbalanced groups
   Week 2 (2024-01-22): 0 imbalanced groups
   Week 3 (2024-01-29): 0 imbalanced groups

5. Testing volume patterns across weeks
   ✓ Chest volume tracking:
     Week 1: 2400
     Week 2: 2520
     Week 3: 2640
----- output end -----
  Interesting Scenario 5: Multiple weeks and volume tracking ... ok (586ms)
RoutinePlanner Concept ... ok (4s)

ok | 1 passed (6 steps) | 0 failed (4s)
```
```
PS C:\Users\steph\OneDrive\Desktop\PlateMate> deno test src/concepts/ProgressionEngine/ProgressionEngineConcept.test.ts --allow-net --allow-read --allow-write --allow-env --allow-sys
Check file:///C:/Users/steph/OneDrive/Desktop/PlateMate/src/concepts/ProgressionEngine/ProgressionEngineConcept.test.ts
running 1 test from ./src/concepts/ProgressionEngine/ProgressionEngineConcept.test.ts
ProgressionEngine Concept ...
  Operational Principle: Complete progression workflow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===
Testing the common expected usage: create rule, update progression, suggest weight

1. Creating progression rule for bench press
   ✓ Progression rule created successfully

2. Updating progression with initial weight: 135lbs
   ✓ Progression updated successfully

3. Retrieving progression rule
   ✓ Rule retrieved: increment=5lbs, target=2 sessions

4. Suggesting weight for first time (should maintain)
   ✓ Weight suggestion: maintain at 135lbs

✓ Operational principle test completed successfully
----- output end -----
  Operational Principle: Complete progression workflow ... ok (270ms)
  Interesting Scenario 1: Progressive overload sequence ...
------- output -------

=== SCENARIO 1: PROGRESSIVE OVERLOAD SEQUENCE ===
Testing progression through multiple sessions with weight increases

1. Creating rule for squat
   ✓ Rule created: 10lb increments, 3 target sessions

2. Session 1: Testing weight 185lbs
   ✓ Suggestion: maintain at 185lbs (expected: maintain at 185lbs)

3. Session 2: Testing weight 185lbs
   ✓ Suggestion: maintain at 185lbs (expected: maintain at 185lbs)

4. Session 3: Testing weight 185lbs
   ✓ Suggestion: increase at 195lbs (expected: increase at 195lbs)

5. Session 4: Testing weight 195lbs
   ✓ Suggestion: maintain at 195lbs (expected: maintain at 195lbs)

6. Session 5: Testing weight 195lbs
   ✓ Suggestion: maintain at 195lbs (expected: maintain at 195lbs)

7. Session 6: Testing weight 195lbs
   ✓ Suggestion: increase at 205lbs (expected: increase at 205lbs)

8. Session 7: Testing weight 205lbs
   ✓ Suggestion: maintain at 205lbs (expected: maintain at 205lbs)
----- output end -----
  Interesting Scenario 1: Progressive overload sequence ... ok (1s)
  Interesting Scenario 2: Deload scenarios and recovery ...
------- output -------

=== SCENARIO 2: DELOAD SCENARIOS AND RECOVERY ===
Testing deload recommendations and recovery from setbacks

1. Creating rule for deadlift with 15% deload threshold

2. Setting up progression at 225lbs

3. Testing significant weight drop (225lbs -> 185lbs = 17.8% drop)
   ✓ Deload suggestion: deload at 202.5lbs

4. Testing minor weight drop (225lbs -> 215lbs = 4.4% drop)
   ✓ Minor drop suggestion: maintain at 225lbs

5. Testing recovery progression
   ✓ Recovery suggestion: increase at 190lbs
----- output end -----
  Interesting Scenario 2: Deload scenarios and recovery ... ok (413ms)
  Interesting Scenario 3: Multiple exercises and users ...
------- output -------

=== SCENARIO 3: MULTIPLE EXERCISES AND USERS ===
Testing progression tracking across different exercises and users

1. Creating rule for overheadpress: 2.5lb increments, 3 target sessions

2. Creating rule for bentoverrow: 5lb increments, 2 target sessions

3. Creating rule for pullups: 1lb increments, 4 target sessions

4. Testing user user1 progressions
   overheadpress: Starting at 100lbs
     ✓ overheadpress: maintain at 100lbs
   bentoverrow: Starting at 105lbs
     ✓ bentoverrow: maintain at 105lbs
   pullups: Starting at 110lbs
     ✓ pullups: maintain at 110lbs

5. Testing user user2 progressions
   overheadpress: Starting at 110lbs
     ✓ overheadpress: maintain at 110lbs
   bentoverrow: Starting at 115lbs
     ✓ bentoverrow: maintain at 115lbs
   pullups: Starting at 120lbs
     ✓ pullups: maintain at 120lbs

6. Testing user user3 progressions
   overheadpress: Starting at 120lbs
     ✓ overheadpress: maintain at 120lbs
   bentoverrow: Starting at 125lbs
     ✓ bentoverrow: maintain at 125lbs
   pullups: Starting at 130lbs
     ✓ pullups: maintain at 130lbs

9. Verifying all progressions created
   ✓ Found 12 user progressions (expected: 12)
----- output end -----
  Interesting Scenario 3: Multiple exercises and users ... ok (1s)
  Interesting Scenario 4: Error handling and edge cases ...
------- output -------

=== SCENARIO 4: ERROR HANDLING AND EDGE CASES ===
Testing various error conditions and validation

1. Testing duplicate rule prevention
   ✓ Correctly rejected duplicate rule: "Progression rule already exists for exercise benchpress"

2. Testing invalid rule parameters
   ✓ Correctly rejected zero increment: "Increment must be greater than 0"
   ✓ Correctly rejected invalid threshold: "Deload threshold must be between 0 and 1"
   ✓ Correctly rejected zero sessions: "Target sessions must be greater than 0"

3. Testing suggestion for exercise without rule
   ✓ Correctly handled no rule: "No progression rule found for exercise norule"

4. Testing invalid suggestion parameters
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "Last weight cannot be negative"
----- output end -----
  Interesting Scenario 4: Error handling and edge cases ... ok (69ms)
  Interesting Scenario 5: Complex progression patterns ...
------- output -------

=== SCENARIO 5: COMPLEX PROGRESSION PATTERNS ===
Testing complex scenarios with varying progression patterns

1. Creating complex progression rule
   ✓ Rule created: 2.5lb increments, 12% deload threshold, 4 target sessions

2. Testing progression with weight fluctuations

   Session 1: Weight 100lbs
     ✓ Suggestion: maintain at 100lbs (expected: maintain)

   Session 2: Weight 100lbs
     ✓ Suggestion: maintain at 100lbs (expected: maintain)

   Session 3: Weight 100lbs
     ✓ Suggestion: maintain at 100lbs (expected: maintain)

   Session 4: Weight 100lbs
     ✓ Suggestion: increase at 102.5lbs (expected: increase)

   Session 5: Weight 102.5lbs
     ✓ Suggestion: maintain at 102.5lbs (expected: maintain)

   Session 6: Weight 102.5lbs
     ✓ Suggestion: maintain at 102.5lbs (expected: maintain)

   Session 7: Weight 102.5lbs
     ✓ Suggestion: maintain at 102.5lbs (expected: maintain)

   Session 8: Weight 105lbs
     ✓ Suggestion: maintain at 105lbs (expected: increase)

   Session 9: Weight 105lbs
     ✓ Suggestion: maintain at 105lbs (expected: maintain)

   Session 10: Weight 103lbs
     ✓ Suggestion: maintain at 103lbs (expected: maintain)

   Session 11: Weight 105lbs
     ✓ Suggestion: maintain at 105lbs (expected: deload)

   Session 12: Weight 107.5lbs
     ✓ Suggestion: maintain at 107.5lbs (expected: maintain)

3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
ProgressionEngine Concept ... ok (5s)

ok | 1 passed (6 steps) | 0 failed (5s)

PS C:\Users\steph\OneDrive\Desktop\PlateMate> ^C
PS C:\Users\steph\OneDrive\Desktop\PlateMate>

3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
ProgressionEngine Concept ... ok (5s)

ok | 1 passed (6 steps) | 0 failed (5s)

PS C:\Users\steph\OneDrive\Desktop\PlateMate> ^C
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
ProgressionEngine Concept ... ok (5s)

ok | 1 passed (6 steps) | 0 failed (5s)
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"

4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
3. Testing retrieval of non-existent rule
   ✓ Correctly handled non-existent rule: "No progression rule found for exercise nonexistent"


4. Testing update progression validation
   ✓ Correctly rejected missing user: "User is required"
   ✓ Correctly rejected negative weight: "New weight cannot be negative"
----- output end -----
  Interesting Scenario 5: Complex progression patterns ... ok (1s)
ProgressionEngine Concept ... ok (5s)

ok | 1 passed (6 steps) | 0 failed (5s)
```
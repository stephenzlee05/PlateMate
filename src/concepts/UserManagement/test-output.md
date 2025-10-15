```
PS C:\Users\steph\OneDrive\Desktop\PlateMate> deno test src/concepts/UserManagement/UserManagementConcept.test.ts --allow-net --allow-read --allow-write --allow-env --allow-sys      
Check file:///C:/Users/steph/OneDrive/Desktop/PlateMate/src/concepts/UserManagement/UserManagementConcept.test.ts
running 1 test from ./src/concepts/UserManagement/UserManagementConcept.test.ts
UserManagement Concept ...
  Operational Principle: Complete user management workflow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===
Testing the common expected usage: create user, get user, update preferences

1. Creating new user: testuser
   ✓ User created with ID: 0199da5e-4031-7576-bf53-28944357a7e0

2. Retrieving user by ID
   ✓ User retrieved: testuser (test@example.com)
     Default preferences: lbs, 5lb increment

3. Updating user preferences
   ✓ Preferences updated successfully

4. Verifying updated preferences
   ✓ Updated preferences: kg, 10 increment

✓ Operational principle test completed successfully
----- output end -----
  Operational Principle: Complete user management workflow ... ok (344ms)
  Interesting Scenario 1: Multiple users and uniqueness constraints ...
------- output -------

=== SCENARIO 1: MULTIPLE USERS AND UNIQUENESS CONSTRAINTS ===
Testing user creation with various username and email combinations

0. Clearing existing users for clean test
   ✓ Cleared existing users and preferences

1. Creating user: alice
   ✓ Created alice with ID: 0199da5e-41cd-730f-99ac-a6cc240189be

2. Creating user: bob
   ✓ Created bob with ID: 0199da5e-429f-75b9-b39d-ecd447188768

3. Creating user: charlie
   ✓ Created charlie with ID: 0199da5e-436b-7b14-b82f-c362e57b66b3

4. Creating user: diana
   ✓ Created diana with ID: 0199da5e-4435-7271-af5b-3d742a48647b

5. Creating user: eve
   ✓ Created eve with ID: 0199da5e-4507-7adb-ba79-dded1fbebccf

✓ Successfully created 5 users

6. Testing duplicate username prevention
   ✓ Correctly rejected duplicate username: "Username 'alice' already exists"

7. Testing duplicate email prevention
   ✓ Correctly rejected duplicate email: "Email 'alice@example.com' already exists"

8. Retrieving all users
   ✓ Found 5 total users
   ✓ User names: alice, bob, charlie, diana, eve
----- output end -----
  Interesting Scenario 1: Multiple users and uniqueness constraints ... ok (1s)
  Interesting Scenario 2: Preference updates and partial updates ...
------- output -------

=== SCENARIO 2: PREFERENCE UPDATES AND PARTIAL UPDATES ===
Testing various preference update scenarios

1. Creating user for preference testing
   ✓ Created user: 0199da5e-4665-790b-add8-4b13911328ba

2. Testing full preference update
   ✓ Full preferences updated
   ✓ Verified full update: kg, 15 increment, notifications: false

3. Testing partial update (only increment)
   ✓ Partial preferences updated
   ✓ Verified partial update: kg, 20 increment, notifications: false

4. Testing partial update (only units)
   ✓ Units preference updated
   ✓ Verified units update: lbs, 20 increment, notifications: false

5. Testing notifications update
   ✓ Notifications preference updated
   ✓ Verified notifications update: lbs, 20 increment, notifications: true
----- output end -----
  Interesting Scenario 2: Preference updates and partial updates ... ok (561ms)
  Interesting Scenario 3: Error handling and validation ...
------- output -------

=== SCENARIO 3: ERROR HANDLING AND VALIDATION ===
Testing various error conditions and edge cases

1. Testing update preferences for non-existent user
   ✓ Correctly rejected non-existent user: "User preferences not found"

2. Testing get non-existent user
   ✓ Correctly handled non-existent user: "User with ID nonexistent not found"

3. Testing get preferences for non-existent user
   ✓ Non-existent user preferences: 0 records

4. Testing empty preference updates
   ✓ Correctly handled empty preferences: "No valid preferences provided to update"
----- output end -----
  Interesting Scenario 3: Error handling and validation ... ok (247ms)
  Interesting Scenario 4: User preferences and data consistency ...
------- output -------

=== SCENARIO 4: USER PREFERENCES AND DATA CONSISTENCY ===
Testing preference data consistency and retrieval patterns

1. Creating users with different preference patterns
   1. Creating kguser with kg units
     ✓ Created with kg, 2.5 increment
   2. Creating lbsuser with lbs units
     ✓ Created with lbs, 5 increment
   3. Creating heavyuser with lbs units
     ✓ Created with lbs, 10 increment
   4. Creating lightuser with kg units
     ✓ Created with kg, 1.25 increment

2. Testing preference retrieval consistency
   Testing kguser preferences
     ✓ Preferences match: kg, 2.5
     ✓ Direct preferences match: kg, 2.5
   Testing lbsuser preferences
     ✓ Preferences match: lbs, 5
     ✓ Direct preferences match: lbs, 5
   Testing heavyuser preferences
     ✓ Preferences match: lbs, 10
     ✓ Direct preferences match: lbs, 10
   Testing lightuser preferences
     ✓ Preferences match: kg, 1.25
     ✓ Direct preferences match: kg, 1.25

3. Testing repeated preference updates
   Update 1: {"defaultIncrement":7.5}
     ✓ Updated to: kg, 7.5, notifications: true
   Update 2: {"units":"kg"}
     ✓ Updated to: kg, 7.5, notifications: true
   Update 3: {"notifications":false}
     ✓ Updated to: kg, 7.5, notifications: false
   Update 4: {"defaultIncrement":3.75,"units":"lbs","notifications":true}
     ✓ Updated to: lbs, 3.75, notifications: true
----- output end -----
  Interesting Scenario 4: User preferences and data consistency ... ok (1s)
  Interesting Scenario 5: User management operations ...
------- output -------

=== SCENARIO 5: USER MANAGEMENT OPERATIONS ===
Testing various user management operations and edge cases

1. Clearing existing users for clean test
   ✓ Cleared existing users

2. Creating test users
   1. Creating admin
     ✓ Created with ID: 0199da5e-4fd0-7f64-86be-bb56f3b7a6fb
   2. Creating trainer
     ✓ Created with ID: 0199da5e-5065-7512-a05d-9ef2b22187e5
   3. Creating beginner
     ✓ Created with ID: 0199da5e-50e8-7af7-bdb4-d56690359b98
   4. Creating advanced
     ✓ Created with ID: 0199da5e-5181-7521-8d58-0534e652f559

3. Testing retrieval of all users
   ✓ Retrieved 4 users
   ✓ User names: admin, advanced, beginner, trainer

4. Testing retrieval of specific users
   Getting admin
     ✓ Retrieved: admin (admin@example.com)
   Getting trainer
     ✓ Retrieved: trainer (trainer@example.com)
   Getting beginner
     ✓ Retrieved: beginner (beginner@example.com)
   Getting advanced
     ✓ Retrieved: advanced (advanced@example.com)

5. Testing different preference patterns
   1. Setting preferences for admin
     ✓ Set to: lbs, 5 increment, notifications: true
   2. Setting preferences for trainer
     ✓ Set to: lbs, 10 increment, notifications: false
   3. Setting preferences for beginner
     ✓ Set to: kg, 2.5 increment, notifications: true
   4. Setting preferences for advanced
     ✓ Set to: kg, 7.5 increment, notifications: false

6. Testing preference queries
   ✓ admin preferences: lbs, 5
   ✓ trainer preferences: lbs, 10
   ✓ beginner preferences: kg, 2.5
   ✓ advanced preferences: kg, 7.5
----- output end -----
  Interesting Scenario 5: User management operations ... ok (1s)
UserManagement Concept ... ok (6s)

ok | 1 passed (6 steps) | 0 failed (6s)
```
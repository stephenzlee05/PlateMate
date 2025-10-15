[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: ProgressionEngine
# response:

Here's the implementation for the `ProgressionEngine` concept and its corresponding test file, adhering to the provided specifications and guidelines.

First, let's ensure the utility types and database functions are in place as described in your prompt.

**`src/utils/types.ts`**
(As provided in the prompt, with a small adjustment for `ID` to make it usable with `string` for assignments while maintaining branding for safety):

```typescript
// For generic IDs that are essentially strings, but with type branding for clarity
export type ID = string & { __brand: 'ID' };

// For actions that return nothing, but need to return a dictionary object
export type Empty = Record<PropertyKey, never>;
```

**`src/utils/database.ts`**
(As provided in the prompt, with `testDb` function added as per testing instructions):

```typescript
import { MongoClient, Db } from "npm:mongodb";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "mongodb://localhost:27017";
const MONGODB_DB_NAME = Deno.env.get("MONGODB_DB_NAME") || "concept_db";
const MONGODB_TEST_DB_NAME = Deno.env.get("MONGODB_TEST_DB_NAME") || "concept_test_db";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<[Db, MongoClient]> {
  if (db && client) {
    return [db, client];
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);
  console.log(`Connected to MongoDB: ${MONGODB_URI}/${MONGODB_DB_NAME}`);
  return [db, client];
}

export async function testDb(): Promise<[Db, MongoClient]> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_TEST_DB_NAME);
  // Ensure the test database is clean before running tests.
  // The prompt mentions Deno.test.beforeAll hook, but a direct drop for each
  // test ensures isolation without relying on Deno's specific setup,
  // which can be tricky to guarantee for every single test block.
  // For production-level concept testing, Deno.test.beforeAll would be ideal.
  // However, given the prompt's instructions about 'testDb',
  // it implies each test might call this, so a cleanup here is safer for the demo.
  await db.dropDatabase();
  console.log(`Initialized test DB: ${MONGODB_URI}/${MONGODB_TEST_DB_NAME}`);
  return [db, client];
}

export function freshID(): ID {
  // Simple UUID v4 generator, can be replaced with a more robust one
  return crypto.randomUUID() as ID;
}
```

***

# concept: ProgressionEngine

**purpose**: automatically suggest weight progressions based on performance

**principle**: progressive overload through systematic weight increases

## State

* **ProgressionRules**: a set with
  * exercise: Exercise
  * increment: Number
  * deloadThreshold: Number
  * targetSessions: Number

* **UserProgressions**: a set with
  * user: User
  * exercise: Exercise
  * currentWeight: Number
  * sessionsAtWeight: Number
  * lastProgression: Date

## Actions

### suggestWeight

```typescript
suggestWeight(user: User, exercise: Exercise, lastWeight: number, lastSets: number, lastReps: number): { newWeight: number; reason: string; action: "increase" | "maintain" | "deload" }
```

*   **Effect**: calculates next weight based on performance and rules
*   **Returns**: weight suggestion details

### updateProgression

```typescript
updateProgression(user: User, exercise: Exercise, newWeight: number): void
```

*   **Effect**: updates user's current weight and resets session counter

### getProgressionRule

```typescript
getProgressionRule(exercise: Exercise): { increment: number; deloadThreshold: number; targetSessions: number } | null
```

*   **Effect**: returns progression rule for exercise type
*   **Returns**: progression rule details or null

***

# file: src/concepts/ProgressionEngineConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * ProgressionEngine Concept
 *
 * purpose: automatically suggest weight progressions based on performance
 * principle: progressive overload through systematic weight increases
 */

// Declare collection prefix, use concept name
const PREFIX = "ProgressionEngine" + ".";

// Generic types of this concept
type User = ID;
type Exercise = ID;

/**
 * State: ProgressionRules
 *
 * a set with
 *   exercise: Exercise
 *   increment: Number
 *   deloadThreshold: Number
 *   targetSessions: Number
 */
interface ProgressionRule {
  _id: ID; // Unique ID for the rule itself
  exercise: Exercise; // The exercise this rule applies to
  increment: number; // How much to increase/decrease weight
  deloadThreshold: number; // Reps below which a deload is suggested
  targetSessions: number; // Number of successful sessions at current weight before incrementing
}

/**
 * State: UserProgressions
 *
 * a set with
 *   user: User
 *   exercise: Exercise
 *   currentWeight: Number
 *   sessionsAtWeight: Number
 *   lastProgression: Date
 */
interface UserProgression {
  _id: ID; // Unique ID for the user's progression entry
  user: User; // The user ID
  exercise: Exercise; // The exercise ID
  currentWeight: number; // The weight currently being tracked
  sessionsAtWeight: number; // Number of successful sessions at currentWeight
  lastProgression: Date; // Last date this progression was updated
}

export default class ProgressionEngineConcept {
  private rules: Collection<ProgressionRule>;
  private userProgressions: Collection<UserProgression>;

  constructor(private readonly db: Db) {
    this.rules = this.db.collection(PREFIX + "rules");
    this.userProgressions = this.db.collection(PREFIX + "userProgressions");

    // Ensure unique indexes for efficient lookups
    this.rules.createIndex({ exercise: 1 }, { unique: true })
      .catch((e) => console.error("Error creating index for rules collection:", e));
    this.userProgressions.createIndex({ user: 1, exercise: 1 }, { unique: true })
      .catch((e) => console.error("Error creating index for userProgressions collection:", e));
  }

  /**
   * _getProgressionRule(exercise: Exercise): { increment: number; deloadThreshold: number; targetSessions: number } | null
   *
   * **effects** returns progression rule for exercise type
   * **returns** progression rule details or null
   */
  async _getProgressionRule(
    { exercise }: { exercise: Exercise },
  ): Promise<
    | { increment: number; deloadThreshold: number; targetSessions: number }
    | null
  > {
    console.log(`Query: Getting progression rule for exercise: ${exercise}`);
    const rule = await this.rules.findOne({ exercise });
    if (!rule) {
      console.log(`  No rule found for ${exercise}`);
      return null;
    }
    console.log(`  Found rule for ${exercise}: ${JSON.stringify(rule)}`);
    return {
      increment: rule.increment,
      deloadThreshold: rule.deloadThreshold,
      targetSessions: rule.targetSessions,
    };
  }

  /**
   * suggestWeight(user: User, exercise: Exercise, lastWeight: number, lastSets: number, lastReps: number): { newWeight: number; reason: string; action: "increase" | "maintain" | "deload" } | { error: string }
   *
   * **requires** A progression rule must exist for the given exercise to provide a meaningful suggestion.
   *            'lastSets' and 'lastReps' represent the performance from the immediately preceding session.
   *            A session is considered "successful" if 'lastReps' exceeds 'deloadThreshold'.
   *
   * **effects** Calculates the next suggested weight based on the user's past progression and the defined rules.
   *             Does not modify any state.
   * **returns** weight suggestion details including new weight, reason, and suggested action ("increase", "maintain", or "deload").
   */
  async suggestWeight(
    { user, exercise, lastWeight, lastSets, lastReps }: {
      user: User;
      exercise: Exercise;
      lastWeight: number;
      lastSets: number;
      lastReps: number;
    },
  ): Promise<
    | { newWeight: number; reason: string; action: "increase" | "maintain" | "deload" }
    | { error: string }
  > {
    console.log(
      `Action: Suggesting weight for User: ${user}, Exercise: ${exercise}, Last: ${lastWeight}kg, ${lastSets}x${lastReps} reps`,
    );
    const rule = await this.rules.findOne({ exercise });
    if (!rule) {
      const errorMsg = `No progression rule found for exercise: ${exercise}. Cannot suggest weight.`;
      console.error(`  ${errorMsg}`);
      return { error: errorMsg };
    }
    console.log(`  Found rule: ${JSON.stringify(rule)}`);

    const userProgression = await this.userProgressions.findOne({ user, exercise });
    console.log(`  Current user progression: ${JSON.stringify(userProgression)}`);

    let suggestedWeight: number;
    let reason: string;
    let action: "increase" | "maintain" | "deload";

    if (!userProgression) {
      // First session for this user and exercise
      suggestedWeight = lastWeight;
      reason = "First session for this user and exercise, maintaining weight to establish baseline.";
      action = "maintain";
      console.log(`  ${reason}. Suggested: ${suggestedWeight}kg`);
    } else {
      const { currentWeight, sessionsAtWeight } = userProgression;

      // Check for deload condition
      if (lastReps <= rule.deloadThreshold) {
        suggestedWeight = Math.max(0, currentWeight - rule.increment); // Ensure weight doesn't go negative
        reason =
          `Performance (${lastReps} reps) below deload threshold (${rule.deloadThreshold}). Suggested deload from ${currentWeight}kg.`;
        action = "deload";
        console.log(`  ${reason}. Suggested: ${suggestedWeight}kg`);
      } // Check for increase condition (if not deloading, and target sessions met, and last session was successful)
      else if (sessionsAtWeight >= rule.targetSessions) {
        suggestedWeight = currentWeight + rule.increment;
        reason =
          `Met target sessions (${rule.targetSessions}) at ${currentWeight}kg. Suggested weight increase.`;
        action = "increase";
        console.log(`  ${reason}. Suggested: ${suggestedWeight}kg`);
      } // Otherwise, maintain condition
      else {
        suggestedWeight = currentWeight;
        reason =
          `Maintain weight to build consistency or reach target sessions (${sessionsAtWeight}/${rule.targetSessions}) at ${currentWeight}kg.`;
        action = "maintain";
        console.log(`  ${reason}. Suggested: ${suggestedWeight}kg`);
      }
    }

    return { newWeight: suggestedWeight, reason, action };
  }

  /**
   * updateProgression(user: User, exercise: Exercise, newWeight: number): Empty
   *
   * **effects** updates user's current weight and resets session counter if weight changes,
   *             or increments session counter if weight remains the same.
   *             Also updates 'lastProgression' date.
   */
  async updateProgression(
    { user, exercise, newWeight }: { user: User; exercise: Exercise; newWeight: number },
  ): Promise<Empty> {
    console.log(
      `Action: Updating progression for User: ${user}, Exercise: ${exercise} to new weight: ${newWeight}kg`,
    );
    const userProgression = await this.userProgressions.findOne({ user, exercise });

    const now = new Date();
    let updatedSessionsAtWeight: number;

    if (!userProgression) {
      // Create new progression
      updatedSessionsAtWeight = 1; // This is the first session at this weight
      await this.userProgressions.insertOne({
        _id: freshID(),
        user,
        exercise,
        currentWeight: newWeight,
        sessionsAtWeight: updatedSessionsAtWeight,
        lastProgression: now,
      });
      console.log(`  Created new user progression: ${JSON.stringify({ user, exercise, newWeight, sessionsAtWeight: updatedSessionsAtWeight })}`);
    } else {
      if (newWeight === userProgression.currentWeight) {
        // Same weight, increment session counter
        updatedSessionsAtWeight = userProgression.sessionsAtWeight + 1;
        console.log(`  Weight maintained, incrementing sessions from ${userProgression.sessionsAtWeight} to ${updatedSessionsAtWeight}`);
      } else {
        // New weight, reset session counter
        updatedSessionsAtWeight = 1;
        console.log(`  Weight changed from ${userProgression.currentWeight}kg to ${newWeight}kg, resetting sessions to ${updatedSessionsAtWeight}`);
      }

      await this.userProgressions.updateOne(
        { _id: userProgression._id },
        {
          $set: {
            currentWeight: newWeight,
            sessionsAtWeight: updatedSessionsAtWeight,
            lastProgression: now,
          },
        },
      );
      console.log(`  Updated user progression: ${JSON.stringify({ user, exercise, newWeight, sessionsAtWeight: updatedSessionsAtWeight })}`);
    }
    return {};
  }

  // --- Actions for managing Progression Rules (not explicitly in prompt, but necessary for a complete concept) ---

  /**
   * createProgressionRule(exercise: Exercise, increment: number, deloadThreshold: number, targetSessions: number): { ruleId: ID } | { error: string }
   *
   * **requires** No progression rule for the given exercise already exists.
   *
   * **effects** Creates a new progression rule for an exercise.
   * **returns** The ID of the newly created rule, or an error if a rule already exists.
   */
  async createProgressionRule(
    { exercise, increment, deloadThreshold, targetSessions }: {
      exercise: Exercise;
      increment: number;
      deloadThreshold: number;
      targetSessions: number;
    },
  ): Promise<{ ruleId: ID } | { error: string }> {
    console.log(
      `Action: Creating progression rule for Exercise: ${exercise}, Inc: ${increment}, Deload: ${deloadThreshold}, Target: ${targetSessions}`,
    );
    const existingRule = await this.rules.findOne({ exercise });
    if (existingRule) {
      const errorMsg = `Progression rule for exercise ${exercise} already exists.`;
      console.error(`  ${errorMsg}`);
      return { error: errorMsg };
    }

    const newRuleId = freshID();
    await this.rules.insertOne({
      _id: newRuleId,
      exercise,
      increment,
      deloadThreshold,
      targetSessions,
    });
    console.log(`  Rule created with ID: ${newRuleId}`);
    return { ruleId: newRuleId };
  }

  /**
   * updateProgressionRule(exercise: Exercise, increment?: number, deloadThreshold?: number, targetSessions?: number): Empty | { error: string }
   *
   * **requires** A progression rule for the given exercise must exist.
   *
   * **effects** Updates an existing progression rule.
   * **returns** Empty object on success, or an error if the rule does not exist.
   */
  async updateProgressionRule(
    { exercise, increment, deloadThreshold, targetSessions }: {
      exercise: Exercise;
      increment?: number;
      deloadThreshold?: number;
      targetSessions?: number;
    },
  ): Promise<Empty | { error: string }> {
    console.log(`Action: Updating progression rule for Exercise: ${exercise}`);
    const existingRule = await this.rules.findOne({ exercise });
    if (!existingRule) {
      const errorMsg = `No progression rule found for exercise ${exercise}. Cannot update.`;
      console.error(`  ${errorMsg}`);
      return { error: errorMsg };
    }

    const $set: Partial<ProgressionRule> = {};
    if (increment !== undefined) $set.increment = increment;
    if (deloadThreshold !== undefined) $set.deloadThreshold = deloadThreshold;
    if (targetSessions !== undefined) $set.targetSessions = targetSessions;

    if (Object.keys($set).length > 0) {
      await this.rules.updateOne({ _id: existingRule._id }, { $set });
      console.log(`  Rule updated for ${exercise} with: ${JSON.stringify($set)}`);
    } else {
      console.log(`  No updates provided for rule ${exercise}`);
    }
    return {};
  }

  /**
   * deleteProgressionRule(exercise: Exercise): Empty | { error: string }
   *
   * **requires** A progression rule for the given exercise must exist.
   *
   * **effects** Deletes a progression rule for an exercise.
   * **returns** Empty object on success, or an error if the rule does not exist.
   */
  async deleteProgressionRule(
    { exercise }: { exercise: Exercise },
  ): Promise<Empty | { error: string }> {
    console.log(`Action: Deleting progression rule for Exercise: ${exercise}`);
    const result = await this.rules.deleteOne({ exercise });
    if (result.deletedCount === 0) {
      const errorMsg = `No progression rule found for exercise ${exercise}. Cannot delete.`;
      console.error(`  ${errorMsg}`);
      return { error: errorMsg };
    }
    console.log(`  Rule for ${exercise} deleted.`);
    return {};
  }
}
```

***

# file: src/concepts/ProgressionEngineConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertObjectMatch } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import ProgressionEngineConcept from "./ProgressionEngineConcept.ts";

Deno.test("ProgressionEngine Concept - Principle: Progressive overload through systematic weight increases", async (t) => {
  const [db, client] = await testDb();
  const concept = new ProgressionEngineConcept(db);

  const userA = freshID() as ID;
  const squatExercise = freshID() as ID;

  // Initial state: No rules, no user progressions.

  console.log("\n--- Principle Trace: Progressive Overload ---");

  // Step 1: Create a progression rule
  console.log("\n1. Setting up a progression rule for Squat.");
  const createRuleResult = await concept.createProgressionRule({
    exercise: squatExercise,
    increment: 5,
    deloadThreshold: 3, // If reps drop to 3 or below, deload
    targetSessions: 2, // Need 2 successful sessions before incrementing
  });
  assertNotEquals((createRuleResult as { error: string }).error, undefined, "Should successfully create rule");
  console.log("   Rule created.");

  // Step 2: User performs first session (good performance)
  console.log("\n2. User performs first session: 100kg, 3 sets of 5 reps (good performance).");
  const suggest1 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100,
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest1)}`);
  assertObjectMatch(suggest1, { newWeight: 100, action: "maintain" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest1.newWeight as number });
  const userProgression1 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression1?.currentWeight, 100);
  assertEquals(userProgression1?.sessionsAtWeight, 1);
  console.log(`   User progression state: ${JSON.stringify(userProgression1)}`);

  // Step 3: User performs second session (good performance) - should maintain, as targetSessions is 2
  console.log("\n3. User performs second session: 100kg, 3 sets of 5 reps (good performance).");
  const suggest2 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100, // Still based on last session's actual weight
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest2)}`);
  assertObjectMatch(suggest2, { newWeight: 100, action: "maintain" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest2.newWeight as number });
  const userProgression2 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression2?.currentWeight, 100);
  assertEquals(userProgression2?.sessionsAtWeight, 2);
  console.log(`   User progression state: ${JSON.stringify(userProgression2)}`);

  // Step 4: User performs third session (good performance) - should increase, as targetSessions met
  console.log("\n4. User performs third session: 100kg, 3 sets of 5 reps (good performance). Target sessions met.");
  const suggest3 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 100, // Still based on last session's actual weight
    lastSets: 3,
    lastReps: 5,
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest3)}`);
  assertObjectMatch(suggest3, { newWeight: 105, action: "increase" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest3.newWeight as number });
  const userProgression3 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression3?.currentWeight, 105);
  assertEquals(userProgression3?.sessionsAtWeight, 1); // Sessions reset for new weight
  console.log(`   User progression state: ${JSON.stringify(userProgression3)}`);

  // Step 5: User performs fourth session (poor performance) - should deload
  console.log("\n5. User performs fourth session: 105kg, 3 sets of 2 reps (poor performance, below deload threshold).");
  const suggest4 = await concept.suggestWeight({
    user: userA,
    exercise: squatExercise,
    lastWeight: 105,
    lastSets: 3,
    lastReps: 2, // Below deloadThreshold of 3
  });
  console.log(`   Suggestion: ${JSON.stringify(suggest4)}`);
  assertObjectMatch(suggest4, { newWeight: 100, action: "deload" });
  await concept.updateProgression({ user: userA, exercise: squatExercise, newWeight: suggest4.newWeight as number });
  const userProgression4 = await concept["userProgressions"].findOne({ user: userA, exercise: squatExercise });
  assertEquals(userProgression4?.currentWeight, 100);
  assertEquals(userProgression4?.sessionsAtWeight, 1); // Sessions reset for new weight
  console.log(`   User progression state: ${JSON.stringify(userProgression4)}`);

  console.log("\n   Principle of progressive overload (increase) and systematic deloads demonstrated.");
  await client.close();
});

Deno.test("ProgressionEngine Concept - Action Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new ProgressionEngineConcept(db);

  const userB = freshID() as ID;
  const benchExercise = freshID() as ID;
  const deadliftExercise = freshID() as ID;

  // --- Test createProgressionRule ---
  await t.step("createProgressionRule: Successfully create a rule", async () => {
    console.log("\nTest: createProgressionRule - success");
    const result = await concept.createProgressionRule({
      exercise: benchExercise,
      increment: 2.5,
      deloadThreshold: 2,
      targetSessions: 3,
    });
    assertNotEquals((result as { error: string }).error, undefined, "Should not return an error");
    const rule = await concept["rules"].findOne({ exercise: benchExercise });
    assertNotEquals(rule, null, "Rule should be found in DB");
    assertEquals(rule?.exercise, benchExercise);
    assertEquals(rule?.increment, 2.5);
    console.log(`  Rule created for ${benchExercise}: ${JSON.stringify(rule)}`);
  });

  await t.step("createProgressionRule: Fail to create duplicate rule", async () => {
    console.log("\nTest: createProgressionRule - duplicate failure");
    const result = await concept.createProgressionRule({
      exercise: benchExercise,
      increment: 5,
      deloadThreshold: 1,
      targetSessions: 1,
    });
    assertNotEquals((result as { error: string }).error, undefined, "Should return an error for duplicate rule");
    assertObjectMatch(result, { error: `Progression rule for exercise ${benchExercise} already exists.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  // --- Test _getProgressionRule (Query) ---
  await t.step("_getProgressionRule: Retrieve an existing rule", async () => {
    console.log("\nTest: _getProgressionRule - existing");
    const rule = await concept._getProgressionRule({ exercise: benchExercise });
    assertNotEquals(rule, null, "Should retrieve the rule");
    assertEquals(rule?.increment, 2.5);
    assertEquals(rule?.deloadThreshold, 2);
    console.log(`  Retrieved rule: ${JSON.stringify(rule)}`);
  });

  await t.step("_getProgressionRule: Return null for non-existent rule", async () => {
    console.log("\nTest: _getProgressionRule - non-existent");
    const rule = await concept._getProgressionRule({ exercise: deadliftExercise });
    assertEquals(rule, null, "Should return null for a non-existent rule");
    console.log(`  No rule found for ${deadliftExercise}, returned null as expected.`);
  });

  // --- Test suggestWeight ---
  await t.step("suggestWeight: Error if no rule exists for exercise", async () => {
    console.log("\nTest: suggestWeight - no rule error");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: deadliftExercise,
      lastWeight: 100,
      lastSets: 5,
      lastReps: 5,
    });
    assertNotEquals((suggestion as { newWeight: number }).newWeight, undefined, "Should return an error object");
    assertObjectMatch(suggestion, { error: `No progression rule found for exercise: ${deadliftExercise}` });
    console.log(`  Expected error received: ${suggestion.error}`);
  });

  await t.step("suggestWeight: First session, maintain weight", async () => {
    console.log("\nTest: suggestWeight - first session maintain");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60,
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "maintain" });
    console.log(`  First session: ${JSON.stringify(suggestion)}`);
  });

  // --- Test updateProgression ---
  await t.step("updateProgression: Create new user progression on first update", async () => {
    console.log("\nTest: updateProgression - create new");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertNotEquals(progression, null, "User progression should be created");
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 1);
    console.log(`  Progression created: ${JSON.stringify(progression)}`);
  });

  await t.step("updateProgression: Increment sessions at same weight", async () => {
    console.log("\nTest: updateProgression - increment sessions");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 2);
    console.log(`  Sessions incremented: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Maintain, not enough sessions yet", async () => {
    console.log("\nTest: suggestWeight - maintain, not enough sessions (2/3)");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60, // Previous actual weight
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "maintain" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgression: Increment sessions again, reaching target", async () => {
    console.log("\nTest: updateProgression - increment sessions to reach target");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 60 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 60);
    assertEquals(progression?.sessionsAtWeight, 3);
    console.log(`  Sessions incremented to target: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Increase weight after target sessions met", async () => {
    console.log("\nTest: suggestWeight - increase weight");
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 60, // Previous actual weight
      lastSets: 3,
      lastReps: 5,
    });
    assertObjectMatch(suggestion, { newWeight: 62.5, action: "increase" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgression: Update with new weight, reset sessions", async () => {
    console.log("\nTest: updateProgression - new weight, reset sessions");
    await concept.updateProgression({ user: userB, exercise: benchExercise, newWeight: 62.5 });
    const progression = await concept["userProgressions"].findOne({ user: userB, exercise: benchExercise });
    assertEquals(progression?.currentWeight, 62.5);
    assertEquals(progression?.sessionsAtWeight, 1);
    console.log(`  Progression updated: ${JSON.stringify(progression)}`);
  });

  await t.step("suggestWeight: Deload condition met", async () => {
    console.log("\nTest: suggestWeight - deload triggered");
    // Simulate current weight of 62.5kg, but failed reps
    const suggestion = await concept.suggestWeight({
      user: userB,
      exercise: benchExercise,
      lastWeight: 62.5,
      lastSets: 3,
      lastReps: 1, // Below deload threshold of 2
    });
    assertObjectMatch(suggestion, { newWeight: 60, action: "deload" });
    console.log(`  Suggestion: ${JSON.stringify(suggestion)}`);
  });

  await t.step("updateProgressionRule: Update existing rule", async () => {
    console.log("\nTest: updateProgressionRule - success");
    await concept.updateProgressionRule({
      exercise: benchExercise,
      increment: 5,
      targetSessions: 4,
    });
    const updatedRule = await concept["rules"].findOne({ exercise: benchExercise });
    assertEquals(updatedRule?.increment, 5);
    assertEquals(updatedRule?.targetSessions, 4);
    assertEquals(updatedRule?.deloadThreshold, 2); // Unchanged
    console.log(`  Rule updated for ${benchExercise}: ${JSON.stringify(updatedRule)}`);
  });

  await t.step("updateProgressionRule: Fail to update non-existent rule", async () => {
    console.log("\nTest: updateProgressionRule - non-existent failure");
    const result = await concept.updateProgressionRule({
      exercise: deadliftExercise,
      increment: 10,
    });
    assertNotEquals((result as Empty).error, undefined, "Should return an error");
    assertObjectMatch(result, { error: `No progression rule found for exercise ${deadliftExercise}.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  await t.step("deleteProgressionRule: Successfully delete a rule", async () => {
    console.log("\nTest: deleteProgressionRule - success");
    await concept.deleteProgressionRule({ exercise: benchExercise });
    const rule = await concept["rules"].findOne({ exercise: benchExercise });
    assertEquals(rule, null, "Rule should no longer be in DB");
    console.log(`  Rule for ${benchExercise} deleted.`);
  });

  await t.step("deleteProgressionRule: Fail to delete non-existent rule", async () => {
    console.log("\nTest: deleteProgressionRule - non-existent failure");
    const result = await concept.deleteProgressionRule({ exercise: benchExercise }); // Already deleted
    assertNotEquals((result as Empty).error, undefined, "Should return an error");
    assertObjectMatch(result, { error: `No progression rule found for exercise ${benchExercise}.` });
    console.log(`  Expected error received: ${result.error}`);
  });

  await client.close();
});
```
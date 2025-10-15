[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@ProgressionEngine.spec](../../../src/concepts/ProgressionEngine/ProgressionEngine.spec.md)

# implement: ProgressionEngine
# response:

Here's the implementation for the `ProgressionEngine` concept following your specifications and guidelines.

First, let's define the necessary utility types and functions. Assume `@utils/types.ts` and `@utils/database.ts` exist as described in the prompt.

**`src/utils/types.ts` (Example content, based on prompt's usage)**
```typescript
// For generic IDs that are essentially strings, but with type branding for clarity
export type ID = string & { __brand: 'ID' };

// For actions that return nothing, but need to return a dictionary object
export type Empty = Record<PropertyKey, never>;
```

**`src/utils/database.ts` (Example content, based on prompt's usage)**
```typescript
import { MongoClient, Db } from "npm:mongodb";

const MONGODB_URI = Deno.env.get("MONGODB_URI") || "mongodb://localhost:27017";
const MONGODB_DB_NAME = Deno.env.get("MONGODB_DB_NAME") || "concept_db";

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

export function freshID(): ID {
  // Simple UUID v4 generator, can be replaced with a more robust one
  return crypto.randomUUID() as ID;
}
```

Now, the `ProgressionEngine` concept implementation:

---

# concept: ProgressionEngine

**purpose**: automatically suggest weight progressions based on performance

**principle**: progressive overload through systematic weight increases

## State

*   **ProgressionRules**: a set with
    *   exercise: Exercise
    *   increment: Number
    *   deloadThreshold: Number
    *   targetSessions: Number
*   **UserProgressions**: a set with
    *   user: User
    *   exercise: Exercise
    *   currentWeight: Number
    *   sessionsAtWeight: Number
    *   lastProgression: Date

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

---

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
    this.rules.createIndex({ exercise: 1 }, { unique: true });
    this.userProgressions.createIndex({ user: 1, exercise: 1 }, { unique: true });
  }

  /**
   * getProgressionRule(exercise: Exercise): { increment: number; deloadThreshold: number; targetSessions: number } | null
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
    const rule = await this.rules.findOne({ exercise });
    if (!rule) {
      return null;
    }
    return {
      increment: rule.increment,
      deloadThreshold: rule.deloadThreshold,
      targetSessions: rule.targetSessions,
    };
  }

  /**
   * suggestWeight(user: User, exercise: Exercise, lastWeight: number, lastSets: number, lastReps: number): { newWeight: number; reason: string; action: "increase" | "maintain" | "deload" }
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
    const rule = await this.rules.findOne({ exercise });
    if (!rule) {
      return { error: `No progression rule found for exercise: ${exercise}` };
    }

    const userProgression = await this.userProgressions.findOne({ user, exercise });

    let suggestedWeight: number;
    let reason: string;
    let action: "increase" | "maintain" | "deload";

    if (!userProgression) {
      // First session for this user and exercise
      suggestedWeight = lastWeight;
      reason = "First session, maintaining weight to establish baseline.";
      action = "maintain";
    } else {
      const { currentWeight, sessionsAtWeight } = userProgression;

      // Check for deload condition
      if (lastReps <= rule.deloadThreshold) {
        suggestedWeight = Math.max(0, currentWeight - rule.increment); // Ensure weight doesn't go negative
        reason = `Performance (${lastReps} reps) below threshold (${rule.deloadThreshold}). Suggested deload.`;
        action = "deload";
      }
      // Check for increase condition (if not deloading, and target sessions met, and last session was successful)
      else if (sessionsAtWeight >= rule.targetSessions) { // No need to check lastReps > deloadThreshold here as it's an 'else if'
        suggestedWeight = currentWeight + rule.increment;
        reason = `Met target sessions (${rule.targetSessions}). Suggested weight increase.`;
        action = "increase";
      }
      // Otherwise, maintain condition
      else {
        suggestedWeight = currentWeight;
        reason = `Maintain weight to build consistency or reach target sessions (${sessionsAtWeight}/${rule.targetSessions}).`;
        action = "maintain";
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
    const userProgression = await this.userProgressions.findOne({ user, exercise });

    const now = new Date();

    if (!userProgression) {
      // Create new progression
      await this.userProgressions.insertOne({
        _id: freshID(),
        user,
        exercise,
        currentWeight: newWeight,
        sessionsAtWeight: 1, // This is the first session at this weight
        lastProgression: now,
      });
    } else {
      let updatedSessionsAtWeight = 0;
      if (newWeight === userProgression.currentWeight) {
        // Same weight, increment session counter
        updatedSessionsAtWeight = userProgression.sessionsAtWeight + 1;
      } else {
        // New weight, reset session counter
        updatedSessionsAtWeight = 1;
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
    const existingRule = await this.rules.findOne({ exercise });
    if (existingRule) {
      return { error: `Progression rule for exercise ${exercise} already exists.` };
    }

    const newRuleId = freshID();
    await this.rules.insertOne({
      _id: newRuleId,
      exercise,
      increment,
      deloadThreshold,
      targetSessions,
    });
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
    const existingRule = await this.rules.findOne({ exercise });
    if (!existingRule) {
      return { error: `No progression rule found for exercise ${exercise}.` };
    }

    const $set: Partial<ProgressionRule> = {};
    if (increment !== undefined) $set.increment = increment;
    if (deloadThreshold !== undefined) $set.deloadThreshold = deloadThreshold;
    if (targetSessions !== undefined) $set.targetSessions = targetSessions;

    if (Object.keys($set).length > 0) {
      await this.rules.updateOne({ _id: existingRule._id }, { $set });
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
    const result = await this.rules.deleteOne({ exercise });
    if (result.deletedCount === 0) {
      return { error: `No progression rule found for exercise ${exercise}.` };
    }
    return {};
  }
}
```
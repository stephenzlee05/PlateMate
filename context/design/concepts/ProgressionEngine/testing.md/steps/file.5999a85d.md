---
timestamp: 'Sun Oct 12 2025 19:55:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_195558.7ef92437.md]]'
content_id: 5999a85dcb8a24fc66b7616310dd05c64efb97750d7ad8427f9b5d55124c72a7
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

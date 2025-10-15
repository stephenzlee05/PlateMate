import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "ProgressionEngine" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Exercise = ID;

// Internal entity types, represented as IDs
type ProgressionRuleId = ID;

/**
 * State: A set of ProgressionRules with exercise, increment, deloadThreshold, and targetSessions.
 */
interface ProgressionRuleDoc {
  exercise: Exercise;
  increment: number;
  deloadThreshold: number;
  targetSessions: number;
}

/**
 * State: A set of UserProgressions with user, exercise, currentWeight, sessionsAtWeight, and lastProgression.
 */
interface UserProgressionDoc {
  user: User;
  exercise: Exercise;
  currentWeight: number;
  sessionsAtWeight: number;
  lastProgression: string; // ISO date string
}


/**
 * @concept ProgressionEngine
 * @purpose Automatically suggest weight progressions based on performance
 */
export default class ProgressionEngineConcept {
  progressionRules: Collection<ProgressionRuleDoc>;
  userProgressions: Collection<UserProgressionDoc>;

  constructor(private readonly db: Db) {
    this.progressionRules = this.db.collection(PREFIX + "progressionRules");
    this.userProgressions = this.db.collection(PREFIX + "userProgressions");
  }

  /**
   * Action: Suggests next weight based on performance and rules.
   * @effects calculates next weight based on performance and rules
   */
  async suggestWeight({ 
    user, 
    exercise, 
    lastWeight, 
    lastSets, 
    lastReps 
  }: { 
    user: User; 
    exercise: Exercise; 
    lastWeight: number; 
    lastSets: number; 
    lastReps: number; 
  }): Promise<{ 
    suggestion: {
      newWeight: number; 
      reason: string; 
      action: "increase" | "maintain" | "deload"; 
    }
  } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (lastWeight < 0) {
      return { error: "Last weight cannot be negative" };
    }

    if (lastSets <= 0 || lastReps <= 0) {
      return { error: "Last sets and reps must be greater than 0" };
    }

    // Get progression rule for exercise
    const rule = await this.progressionRules.findOne({ exercise });
    if (!rule) {
      return { error: `No progression rule found for exercise ${exercise}` };
    }

    // Get user's current progression state
    const userProgression = await this.userProgressions.findOne({ user, exercise });

    if (!userProgression) {
      // First time doing this exercise - start at last weight
      return {
        suggestion: {
          newWeight: lastWeight,
          reason: "First time performing this exercise",
          action: "maintain"
        }
      };
    } else {
      const { currentWeight, sessionsAtWeight } = userProgression;
      
      // Check if user has been at this weight long enough to progress
      if (sessionsAtWeight >= rule.targetSessions) {
        // Check if user hit target reps consistently
        // For simplicity, assume target is met if last session was successful
        if (lastWeight === currentWeight) {
          // User completed target sessions at current weight - suggest increase
          return {
            suggestion: {
              newWeight: currentWeight + rule.increment,
              reason: `Completed ${rule.targetSessions} sessions at current weight`,
              action: "increase"
            }
          };
        } else {
          // User is already progressing - maintain
          return {
            suggestion: {
              newWeight: lastWeight,
              reason: "Continue current progression",
              action: "maintain"
            }
          };
        }
      } else if (lastWeight < currentWeight * (1 - rule.deloadThreshold)) {
        // Significant weight drop - suggest deload
        return {
          suggestion: {
            newWeight: Math.max(currentWeight * 0.9, lastWeight), // 10% deload or current weight
            reason: "Significant weight drop detected - suggesting deload",
            action: "deload"
          }
        };
      } else {
        // Continue at current weight
        return {
          suggestion: {
            newWeight: currentWeight,
            reason: `Continue for ${rule.targetSessions - sessionsAtWeight} more sessions`,
            action: "maintain"
          }
        };
      }
    }
  }

  /**
   * Action: Updates user's current weight and resets session counter.
   * @effects updates user's current weight and resets session counter
   */
  async updateProgression({ 
    user, 
    exercise, 
    newWeight 
  }: { 
    user: User; 
    exercise: Exercise; 
    newWeight: number; 
  }): Promise<Empty | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (newWeight < 0) {
      return { error: "New weight cannot be negative" };
    }

    const existingProgression = await this.userProgressions.findOne({ user, exercise });
    
    if (existingProgression) {
      // Update existing progression
      if (newWeight > existingProgression.currentWeight) {
        // Weight increased - reset session counter
        await this.userProgressions.updateOne(
          { user, exercise },
          {
            $set: {
              currentWeight: newWeight,
              sessionsAtWeight: 1,
              lastProgression: new Date().toISOString()
            }
          }
        );
      } else if (newWeight === existingProgression.currentWeight) {
        // Same weight - increment session counter
        await this.userProgressions.updateOne(
          { user, exercise },
          {
            $inc: { sessionsAtWeight: 1 },
            $set: { lastProgression: new Date().toISOString() }
          }
        );
      } else {
        // Weight decreased - update but don't reset counter (might be deload)
        await this.userProgressions.updateOne(
          { user, exercise },
          {
            $set: {
              currentWeight: newWeight,
              lastProgression: new Date().toISOString()
            }
          }
        );
      }
    } else {
      // Create new progression
      await this.userProgressions.insertOne({
        user,
        exercise,
        currentWeight: newWeight,
        sessionsAtWeight: 1,
        lastProgression: new Date().toISOString()
      });
    }

    return {};
  }

  /**
   * Action: Gets progression rule for exercise.
   * @effects returns progression rule for exercise type
   */
  async getProgressionRule({ exercise }: { exercise: Exercise }): Promise<{ 
    rule: {
      exercise: Exercise;
      increment: number; 
      deloadThreshold: number; 
      targetSessions: number; 
    }
  } | { error: string }> {
    if (!exercise) {
      return { error: "Exercise is required" };
    }

    const rule = await this.progressionRules.findOne({ exercise });
    if (!rule) {
      return { error: `No progression rule found for exercise ${exercise}` };
    }

    return {
      rule: {
        exercise: rule.exercise,
        increment: rule.increment,
        deloadThreshold: rule.deloadThreshold,
        targetSessions: rule.targetSessions
      }
    };
  }

  /**
   * Helper action: Creates a progression rule for an exercise.
   * This is not in the original spec but useful for testing and setup.
   */
  async createProgressionRule({ 
    exercise, 
    increment, 
    deloadThreshold, 
    targetSessions 
  }: { 
    exercise: Exercise; 
    increment: number; 
    deloadThreshold: number; 
    targetSessions: number; 
  }): Promise<Empty | { error: string }> {
    
    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (increment <= 0) {
      return { error: "Increment must be greater than 0" };
    }

    if (deloadThreshold <= 0 || deloadThreshold >= 1) {
      return { error: "Deload threshold must be between 0 and 1" };
    }

    if (targetSessions <= 0) {
      return { error: "Target sessions must be greater than 0" };
    }

    // Check if rule already exists
    const existingRule = await this.progressionRules.findOne({ exercise });
    if (existingRule) {
      return { error: `Progression rule already exists for exercise ${exercise}` };
    }

    await this.progressionRules.insertOne({
      exercise,
      increment,
      deloadThreshold,
      targetSessions
    });

    return {};
  }

  /**
   * Query: Gets user's progression for an exercise.
   */
  async _getUserProgression({ user, exercise }: { user: User; exercise: Exercise }): Promise<UserProgressionDoc[]> {
    const progression = await this.userProgressions.findOne({ user, exercise });
    return progression ? [progression] : [];
  }

  /**
   * Query: Gets all progression rules.
   */
  async _getAllProgressionRules(): Promise<ProgressionRuleDoc[]> {
    return await this.progressionRules.find({}).toArray();
  }

  /**
   * Query: Gets all user progressions.
   */
  async _getAllUserProgressions(): Promise<UserProgressionDoc[]> {
    return await this.userProgressions.find({}).toArray();
  }
}

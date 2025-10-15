---
timestamp: 'Sun Oct 12 2025 18:19:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_181920.63c526d6.md]]'
content_id: bfbcb9cf02aad732f0fa4796fe8dc0a037e636280355b6e9b04bfcbdf1e625c2
---

# response:

```typescript
// file: src/concepts/RoutinePlannerConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix using concept name
const PREFIX = "RoutinePlanner" + ".";

// Generic types used by this concept
type User = ID;
type TemplateId = ID;
type ExerciseId = ID; // Assuming Exercise itself has an ID
type MuscleGroup = ID; // Represents a specific muscle group, e.g., "chest", "legs"

// --- Helper Types for internal logic ---
// Assuming Exercise objects have muscle group information
interface Exercise {
  exerciseId: ExerciseId; // An ID for the exercise itself (e.g., "squat", "bench_press")
  name: string;
  muscleGroups: MuscleGroup[]; // List of primary and secondary muscle groups targeted
  // Potentially other properties like type (compound/isolation), equipment, etc.
}

// --- Interfaces for MongoDB Collections ---

/**
 * State: WorkoutTemplates
 *
 * a set with
 *   templateId: String
 *   name: String
 *   exercises: List<Exercise>
 *   muscleGroups: Set<MuscleGroup>
 */
interface WorkoutTemplateDoc {
  _id: TemplateId; // Mapped from templateId
  name: string;
  exercises: Exercise[];
  muscleGroups: MuscleGroup[]; // All unique muscle groups targeted by exercises in this template
}

/**
 * State: UserTemplates
 *
 * a set with
 *   user: User
 *   templateId: String
 *   isDefault: Boolean
 */
interface UserTemplateDoc {
  _id: ID; // Unique ID for this association
  user: User;
  templateId: TemplateId;
  isDefault: boolean;
}

/**
 * State: WeeklyVolume
 *
 * a set with
 *   user: User
 *   muscleGroup: MuscleGroup
 *   weekStart: Date
 *   volume: Number
 */
interface WeeklyVolumeDoc {
  _id: ID; // Unique ID for this volume entry
  user: User;
  muscleGroup: MuscleGroup;
  weekStart: Date; // Start of the week (e.g., Monday 00:00:00)
  volume: number;
}

// --- RoutinePlannerConcept Class ---

/**
 * concept RoutinePlanner
 *
 * purpose: manage workout templates and balance muscle group training
 *
 * principle: ensure balanced training across muscle groups and movement patterns
 */
export default class RoutinePlannerConcept {
  private workoutTemplates: Collection<WorkoutTemplateDoc>;
  private userTemplates: Collection<UserTemplateDoc>;
  private weeklyVolume: Collection<WeeklyVolumeDoc>;

  constructor(private readonly db: Db) {
    this.workoutTemplates = this.db.collection(PREFIX + "workoutTemplates");
    this.userTemplates = this.db.collection(PREFIX + "userTemplates");
    this.weeklyVolume = this.db.collection(PREFIX + "weeklyVolume");
  }

  // --- Utility Methods ---

  /**
   * Calculates the start of the week for a given date (Monday 00:00:00).
   * @param date The date to calculate week start from.
   * @returns A Date object representing the start of the week.
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC
    const dayOfWeek = d.getUTCDay(); // 0 for Sunday, 1 for Monday
    const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
    d.setUTCDate(diff);
    return d;
  }

  /**
   * Extracts unique muscle groups from a list of exercises.
   * @param exercises A list of Exercise objects.
   * @returns A Set of MuscleGroup IDs.
   */
  private extractUniqueMuscleGroups(exercises: Exercise[]): MuscleGroup[] {
    const allMuscleGroups = new Set<MuscleGroup>();
    for (const exercise of exercises) {
      exercise.muscleGroups.forEach((mg) => allMuscleGroups.add(mg));
    }
    return Array.from(allMuscleGroups);
  }

  // --- Actions ---

  /**
   * createTemplate(user: User, name: string, exercises: Exercise[]): { templateId: TemplateId } | { error: string }
   *
   * **requires** `user` and `name` are provided; `exercises` is not empty;
   *   no `WorkoutTemplate` with the given `name` already exists.
   *
   * **effects** creates a new workout template with a fresh `templateId`;
   *   stores the template `name`, `exercises`, and derived `muscleGroups`;
   *   returns the `templateId` of the newly created template.
   */
  async createTemplate(
    { user, name, exercises }: { user: User; name: string; exercises: Exercise[] },
  ): Promise<{ templateId: TemplateId } | { error: string }> {
    if (!user) return { error: "User must be provided" };
    if (!name) return { error: "Template name must be provided" };
    if (!exercises || exercises.length === 0) {
      return { error: "Exercises list cannot be empty" };
    }

    // Check for existing template with the same name (globally, as per WorkoutTemplates schema)
    const existingTemplate = await this.workoutTemplates.findOne({ name });
    if (existingTemplate) {
      return { error: `Template with name '${name}' already exists` };
    }

    const templateId = freshID() as TemplateId;
    const muscleGroups = this.extractUniqueMuscleGroups(exercises);

    await this.workoutTemplates.insertOne({
      _id: templateId,
      name,
      exercises,
      muscleGroups,
    });

    // Optionally, associate this template as not-default with the creating user
    // This is not explicitly in the spec's effect for createTemplate, but might be desired
    // as a follow-up action or sync. For now, strictly follow the spec's effects for this action.

    return { templateId };
  }

  /**
   * getSuggestedWorkout(user: User, date: Date): { templateId: TemplateId } | { error: string } | null
   *
   * **requires** `user` and `date` are provided.
   *
   * **effects** returns the `templateId` of a workout based on the user's recent training volume
   *   and muscle group balance; prioritizes muscle groups with significantly lower volume;
   *   returns `null` if no suitable template is found.
   */
  async getSuggestedWorkout(
    { user, date }: { user: User; date: Date },
  ): Promise<{ templateId: TemplateId } | { error: string } | null> {
    if (!user) return { error: "User must be provided" };
    if (!date) return { error: "Date must be provided" };

    const weekStart = this.getWeekStart(date);

    // 1. Get current weekly volume for the user
    const userVolumes = await this.weeklyVolume.find({ user, weekStart }).toArray();

    // 2. Determine muscle groups with lowest volume
    // For simplicity, let's find the muscle group(s) with the absolute lowest volume
    let lowestVolumeGroups: MuscleGroup[] = [];
    let minVolume = Infinity;

    // A simpler approach for balancing: just find the lowest volume groups
    if (userVolumes.length > 0) {
      for (const entry of userVolumes) {
        if (entry.volume < minVolume) {
          minVolume = entry.volume;
          lowestVolumeGroups = [entry.muscleGroup];
        } else if (entry.volume === minVolume) {
          lowestVolumeGroups.push(entry.muscleGroup);
        }
      }
    } else {
      // If no volume data, perhaps suggest a template that targets primary muscle groups
      // Or, for now, if no history, just pick a default or any random template.
      // For this implementation, let's say if no history, no suggestion based on balance.
      // Instead, we could look for a default template.
      const defaultUserTemplate = await this.userTemplates.findOne({
        user,
        isDefault: true,
      });
      if (defaultUserTemplate) {
        return { templateId: defaultUserTemplate.templateId };
      }
      return null; // No history, no default
    }

    // If there are lowest volume groups, try to find a template that targets one of them
    if (lowestVolumeGroups.length > 0) {
      const allUserTemplates = await this.userTemplates.find({ user }).toArray();
      const userTemplateIds = allUserTemplates.map((ut) => ut.templateId);

      const candidateTemplates = await this.workoutTemplates.find({
        _id: { $in: userTemplateIds },
        muscleGroups: { $in: lowestVolumeGroups }, // Template must target one of the lowest volume groups
      }).toArray();

      // Prioritize templates with highest number of lowest volume groups targeted
      // Or, for simplicity, just pick the first one found.
      if (candidateTemplates.length > 0) {
        // Simple heuristic: pick one that covers the most "imbalanced" groups.
        // For now, just pick the first one.
        return { templateId: candidateTemplates[0]._id };
      }
    }

    // If no specific imbalanced group template found, try a user's default template
    const defaultUserTemplate = await this.userTemplates.findOne({
      user,
      isDefault: true,
    });
    if (defaultUserTemplate) {
      return { templateId: defaultUserTemplate.templateId };
    }

    return null; // No suitable template found
  }

  /**
   * updateVolume(user: User, exercise: Exercise, sets: number, reps: number, weight: number): Empty | { error: string }
   *
   * **requires** all parameters provided; `sets`, `reps`, `weight` are positive numbers;
   *   `exercise` object must include `muscleGroups`.
   *
   * **effects** calculates the volume for the `exercise` (sets * reps * weight);
   *   updates/upserts the `WeeklyVolume` for the `user`, each of the `exercise`'s `muscleGroups`,
   *   and the current `weekStart` by adding the calculated volume.
   */
  async updateVolume(
    { user, exercise, sets, reps, weight }: {
      user: User;
      exercise: Exercise; // Needs exerciseId and muscleGroups
      sets: number;
      reps: number;
      weight: number;
    },
  ): Promise<Empty | { error: string }> {
    if (!user) return { error: "User must be provided" };
    if (!exercise || !exercise.muscleGroups || exercise.muscleGroups.length === 0) {
      return { error: "Exercise must be provided and contain muscle groups" };
    }
    if (sets <= 0 || reps <= 0 || weight <= 0) {
      return { error: "Sets, reps, and weight must be positive numbers" };
    }

    const currentVolume = sets * reps * weight;
    const weekStart = this.getWeekStart(new Date()); // Always use current date for volume updates

    for (const muscleGroup of exercise.muscleGroups) {
      await this.weeklyVolume.updateOne(
        { user, muscleGroup, weekStart },
        {
          $inc: { volume: currentVolume },
          $setOnInsert: { _id: freshID(), user, muscleGroup, weekStart }, // Use _id for new doc
        },
        { upsert: true }, // Create if not exists
      );
    }

    return {};
  }

  /**
   * checkBalance(user: User, weekStart: Date): { imbalancedGroups: MuscleGroup[] } | { error: string }
   *
   * **requires** `user` and `weekStart` are provided.
   *
   * **effects** retrieves all `WeeklyVolume` entries for the `user` and `weekStart`;
   *   calculates the average volume across all muscle groups;
   *   returns a list of `muscleGroups` whose volume falls below a certain threshold
   *   (e.g., 50% of the average volume), indicating imbalance.
   */
  async checkBalance(
    { user, weekStart }: { user: User; weekStart: Date },
  ): Promise<{ imbalancedGroups: MuscleGroup[] } | { error: string }> {
    if (!user) return { error: "User must be provided" };
    if (!weekStart) return { error: "Week start date must be provided" };

    const userVolumes = await this.weeklyVolume.find({ user, weekStart }).toArray();

    if (userVolumes.length === 0) {
      return { imbalancedGroups: [] }; // No volume data, considered balanced for this week
    }

    const totalVolume = userVolumes.reduce((sum, entry) => sum + entry.volume, 0);
    const averageVolume = totalVolume / userVolumes.length;
    const imbalanceThreshold = 0.5; // Example: 50% below average

    const imbalancedGroups: MuscleGroup[] = userVolumes
      .filter((entry) => entry.volume < averageVolume * imbalanceThreshold)
      .map((entry) => entry.muscleGroup);

    return { imbalancedGroups };
  }

  /**
   * getTemplate(templateId: TemplateId): { name: string; exercises: Exercise[]; muscleGroups: MuscleGroup[] } | { error: string } | null
   *
   * **requires** `templateId` is provided.
   *
   * **effects** retrieves the `WorkoutTemplate` entry matching `templateId`.
   *
   * **returns** template details object if found, otherwise `null`.
   */
  async getTemplate(
    { templateId }: { templateId: TemplateId },
  ): Promise<{ name: string; exercises: Exercise[]; muscleGroups: MuscleGroup[] } | {
    error: string;
  } | null> {
    if (!templateId) return { error: "Template ID must be provided" };

    const template = await this.workoutTemplates.findOne({ _id: templateId });

    if (template) {
      return {
        name: template.name,
        exercises: template.exercises,
        muscleGroups: template.muscleGroups,
      };
    } else {
      return null;
    }
  }

  /**
   * setDefaultTemplate(user: User, templateId: TemplateId): Empty | { error: string }
   *
   * **requires** `user` and `templateId` are provided;
   *   `templateId` must correspond to an existing `WorkoutTemplate`.
   *
   * **effects** for the given `user`, updates all existing `UserTemplates` to set `isDefault: false`;
   *   creates or updates the `UserTemplates` entry for `user` and `templateId` to set `isDefault: true`.
   */
  async setDefaultTemplate(
    { user, templateId }: { user: User; templateId: TemplateId },
  ): Promise<Empty | { error: string }> {
    if (!user) return { error: "User must be provided" };
    if (!templateId) return { error: "Template ID must be provided" };

    // Check if the templateId exists in WorkoutTemplates
    const templateExists = await this.workoutTemplates.findOne({ _id: templateId });
    if (!templateExists) {
      return { error: `Template with ID '${templateId}' does not exist` };
    }

    // Set all other templates for this user as not default
    await this.userTemplates.updateMany(
      { user, isDefault: true },
      { $set: { isDefault: false } },
    );

    // Set the specified template as default for the user
    await this.userTemplates.updateOne(
      { user, templateId },
      { $set: { isDefault: true, user, templateId }, $setOnInsert: { _id: freshID() } },
      { upsert: true }, // Create if not exists
    );

    return {};
  }
}
```

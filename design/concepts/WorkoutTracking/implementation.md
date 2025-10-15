[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@WorkoutTracking.spec](../../../src/concepts/WorkoutTracking/WorkoutTracking.spec.md)

# implement: WorkoutTracking
# response:

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "WorkoutTracking" + ".";

// Generic types of this concept
type User = ID;
type Exercise = ID;
type MuscleGroup = ID;

/**
 * WorkoutSessions: a set with
 *   user: User
 *   date: Date
 *   sessionId: String
 *
 * Here, sessionId is the _id of the document.
 */
interface IWorkoutSession {
  _id: string; // sessionId
  user: User;
  date: Date;
}

/**
 * ExerciseRecords: a set with
 *   sessionId: String
 *   exercise: Exercise
 *   weight: Number
 *   sets: Number
 *   reps: Number
 *   notes: String?
 */
interface IExerciseRecord {
  _id: ID; // freshID for each record
  sessionId: string;
  exercise: Exercise;
  weight: number;
  sets: number;
  reps: number;
  notes?: string;
}

/**
 * WeeklyVolume: a set with
 *   user: User
 *   muscleGroup: MuscleGroup
 *   weekStart: Date
 *   volume: Number
 *
 * The _id will be a composite of user, muscleGroup, and weekStart to ensure uniqueness.
 */
interface IWeeklyVolume {
  _id: string; // Composite ID: `${user}_${muscleGroup}_${weekStart.toISOString()}`
  user: User;
  muscleGroup: MuscleGroup;
  weekStart: Date;
  volume: number;
}

/**
 * Helper function to get the start of the week (Sunday at midnight) for a given date.
 * @param date The date to get the week start for.
 * @returns A Date object representing the start of the week.
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = d.getDate() - day; // adjust date to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Set to midnight
  return d;
}

/**
 * Mock internal mapping for exercises to muscle groups.
 * In a real application, this might come from another concept or configuration.
 */
function _getMuscleGroupsForExercise(exercise: Exercise): MuscleGroup[] {
  // This is a placeholder for actual exercise-to-muscle-group mapping
  // For demonstration, let's hardcode a few examples.
  if (exercise === "exercise:BenchPress" as ID) {
    return ["muscleGroup:Chest" as ID, "muscleGroup:Triceps" as ID, "muscleGroup:Shoulders" as ID];
  }
  if (exercise === "exercise:Squat" as ID) {
    return ["muscleGroup:Quads" as ID, "muscleGroup:Glutes" as ID, "muscleGroup:Hamstrings" as ID];
  }
  if (exercise === "exercise:Deadlift" as ID) {
    return ["muscleGroup:Back" as ID, "muscleGroup:Hamstrings" as ID, "muscleGroup:Glutes" as ID];
  }
  if (exercise === "exercise:BicepCurl" as ID) {
    return ["muscleGroup:Biceps" as ID];
  }
  return []; // Default to no specific muscle group if not found
}

/**
 * WorkoutTracking Concept
 * Purpose: maintain historical workout data for progression tracking and volume monitoring
 * Principle: each workout session records exercises with weights, sets, and reps, and tracks weekly training volume for muscle group balance
 */
export default class WorkoutTrackingConcept {
  private workoutSessions: Collection<IWorkoutSession>;
  private exerciseRecords: Collection<IExerciseRecord>;
  private weeklyVolume: Collection<IWeeklyVolume>;

  constructor(private readonly db: Db) {
    this.workoutSessions = this.db.collection(PREFIX + "workoutSessions");
    this.exerciseRecords = this.db.collection(PREFIX + "exerciseRecords");
    this.weeklyVolume = this.db.collection(PREFIX + "weeklyVolume");
  }

  /**
   * startSession(user: User, date: Date): (sessionId: string)
   *
   * **requires** true
   *
   * **effects** creates a new workout session `s`; sets `s.user` to `user` and `s.date` to `date`; returns `s._id` as `sessionId`
   */
  async startSession({ user, date }: { user: User; date: Date }): Promise<{ sessionId: string }> {
    const sessionId = freshID();
    const session: IWorkoutSession = {
      _id: sessionId,
      user,
      date: new Date(date), // Ensure date is a Date object
    };
    await this.workoutSessions.insertOne(session);
    return { sessionId };
  }

  /**
   * recordExercise(sessionId: string, exercise: Exercise, weight: number, sets: number, reps: number, notes?: string): Empty
   *
   * **requires** sessionId exists
   *
   * **effects** adds an exercise record `er` to the session identified by `sessionId`;
   *             sets `er.exercise`, `er.weight`, `er.sets`, `er.reps`, `er.notes` from arguments
   */
  async recordExercise(
    { sessionId, exercise, weight, sets, reps, notes }: {
      sessionId: string;
      exercise: Exercise;
      weight: number;
      sets: number;
      reps: number;
      notes?: string;
    },
  ): Promise<Empty | { error: string }> {
    const sessionExists = await this.workoutSessions.findOne({ _id: sessionId });
    if (!sessionExists) {
      return { error: `Workout session with ID ${sessionId} not found.` };
    }

    const recordId = freshID();
    const exerciseRecord: IExerciseRecord = {
      _id: recordId,
      sessionId,
      exercise,
      weight,
      sets,
      reps,
      notes,
    };
    await this.exerciseRecords.insertOne(exerciseRecord);

    // Automatically update weekly volume when an exercise is recorded
    await this.updateVolume({
      user: sessionExists.user,
      exercise,
      sets,
      reps,
      weight,
      weekStart: sessionExists.date, // Use the session's date to determine the week
    });

    return {};
  }

  /**
   * _getLastWeight(user: User, exercise: Exercise): (weight: number | null)
   *
   * **requires** true
   *
   * **effects** returns the most recent weight for the given `exercise` by the given `user`,
   *             or `null` if no records exist
   */
  async _getLastWeight({ user, exercise }: { user: User; exercise: Exercise }): Promise<{ weight: number | null }> {
    const records = await this.exerciseRecords.aggregate<{ weight: number }>([
      {
        $lookup: {
          from: PREFIX + "workoutSessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      { $match: { "session.user": user, exercise: exercise } },
      { $sort: { "session.date": -1 } }, // Sort by session date descending
      { $limit: 1 },
      { $project: { _id: 0, weight: "$weight" } },
    ]).toArray();

    return { weight: records.length > 0 ? records[0].weight : null };
  }

  /**
   * _getWorkoutHistory(user: User, exercise: Exercise, limit: number): (recordIds: string[])
   *
   * **requires** true
   *
   * **effects** returns `limit` number of recent exercise record IDs for `exercise` by `user`, sorted by date descending
   */
  async _getWorkoutHistory(
    { user, exercise, limit }: { user: User; exercise: Exercise; limit: number },
  ): Promise<{ recordIds: string[] }> {
    const records = await this.exerciseRecords.aggregate<{ _id: string }>([
      {
        $lookup: {
          from: PREFIX + "workoutSessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      { $match: { "session.user": user, exercise: exercise } },
      { $sort: { "session.date": -1 } }, // Sort by session date descending
      { $limit: limit },
      { $project: { _id: "$_id" } },
    ]).toArray();

    return { recordIds: records.map((r) => r._id) };
  }

  /**
   * updateVolume(user: User, exercise: Exercise, sets: number, reps: number, weight: number, weekStart?: Date): Empty
   *
   * **requires** true
   *
   * **effects** updates weekly volume for exercise's muscle groups; if `weekStart` is not provided, uses the current week's start
   */
  async updateVolume(
    { user, exercise, sets, reps, weight, weekStart }: {
      user: User;
      exercise: Exercise;
      sets: number;
      reps: number;
      weight: number;
      weekStart?: Date;
    },
  ): Promise<Empty> {
    const volumeIncrease = sets * reps * weight;
    const effectiveWeekStart = weekStart ? getStartOfWeek(weekStart) : getStartOfWeek(new Date());
    const muscleGroups = _getMuscleGroupsForExercise(exercise);

    for (const muscleGroup of muscleGroups) {
      const compositeId = `${user.toString()}_${muscleGroup.toString()}_${effectiveWeekStart.toISOString()}`;

      await this.weeklyVolume.updateOne(
        { _id: compositeId }, // Query by composite ID
        {
          $inc: { volume: volumeIncrease },
          $set: { user: user, muscleGroup: muscleGroup, weekStart: effectiveWeekStart }, // Set other fields on insert
        },
        { upsert: true }, // Create if not exists, update if exists
      );
    }
    return {};
  }

  /**
   * _checkBalance(user: User, weekStart: Date): (imbalancedMuscleGroups: MuscleGroup[])
   *
   * **requires** true
   *
   * **effects** returns a list of muscle groups for `user` in `weekStart` with significantly lower volume (e.g., less than 50% of the average volume)
   */
  async _checkBalance(
    { user, weekStart }: { user: User; weekStart: Date },
  ): Promise<{ imbalancedMuscleGroups: MuscleGroup[] }> {
    const effectiveWeekStart = getStartOfWeek(weekStart);
    const volumes = await this.weeklyVolume.find({ user: user, weekStart: effectiveWeekStart }).toArray();

    if (volumes.length === 0) {
      return { imbalancedMuscleGroups: [] };
    }

    const totalVolume = volumes.reduce((sum, item) => sum + item.volume, 0);
    const averageVolume = totalVolume / volumes.length;

    // Define 'significantly lower' as less than 50% of the average volume
    const imbalanceThreshold = 0.5;
    const imbalancedMuscleGroups = volumes
      .filter((item) => item.volume < averageVolume * imbalanceThreshold)
      .map((item) => item.muscleGroup);

    return { imbalancedMuscleGroups };
  }

  /**
   * _getWeeklyVolume(user: User, weekStart: Date): (weeklyVolumes: { muscleGroup: MuscleGroup; volume: number }[])
   *
   * **requires** true
   *
   * **effects** returns the weekly volume data for `user` for the given `weekStart`
   */
  async _getWeeklyVolume(
    { user, weekStart }: { user: User; weekStart: Date },
  ): Promise<{ weeklyVolumes: { muscleGroup: MuscleGroup; volume: number }[] }> {
    const effectiveWeekStart = getStartOfWeek(weekStart);
    const volumes = await this.weeklyVolume.find({ user: user, weekStart: effectiveWeekStart }).toArray();

    return {
      weeklyVolumes: volumes.map((item) => ({
        muscleGroup: item.muscleGroup,
        volume: item.volume,
      })),
    };
  }
}
```
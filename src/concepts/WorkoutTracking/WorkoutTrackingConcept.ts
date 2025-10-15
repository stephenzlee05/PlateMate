import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "WorkoutTracking" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Exercise = ID;

// Internal entity types, represented as IDs
type SessionId = ID;
type MuscleGroup = string;

/**
 * State: A set of WorkoutSessions with user, date, and sessionId.
 */
interface WorkoutSessionDoc {
  sessionId: SessionId;
  user: User;
  date: string; // ISO date string
}

/**
 * State: A set of ExerciseRecords with sessionId, exercise, weight, sets, reps, and notes.
 */
interface ExerciseRecordDoc {
  sessionId: SessionId;
  exercise: Exercise;
  weight: number;
  sets: number;
  reps: number;
  notes: string | null;
  recordedAt: string; // ISO timestamp
}

/**
 * State: A set of WeeklyVolume with user, muscleGroup, weekStart, and volume.
 */
interface WeeklyVolumeDoc {
  user: User;
  muscleGroup: MuscleGroup;
  weekStart: string; // ISO date string (Monday of the week)
  volume: number; // Total volume for the week
}

/**
 * @concept WorkoutTracking
 * @purpose Maintain historical workout data for progression tracking
 */
export default class WorkoutTrackingConcept {
  workoutSessions: Collection<WorkoutSessionDoc>;
  exerciseRecords: Collection<ExerciseRecordDoc>;
  weeklyVolume: Collection<WeeklyVolumeDoc>;

  constructor(private readonly db: Db) {
    this.workoutSessions = this.db.collection(PREFIX + "workoutSessions");
    this.exerciseRecords = this.db.collection(PREFIX + "exerciseRecords");
    this.weeklyVolume = this.db.collection(PREFIX + "weeklyVolume");
  }

  /**
   * Action: Starts a new workout session.
   * @effects creates new workout session
   */
  async startSession({ user, date }: { user: User; date: string }): Promise<{ sessionId: SessionId } | { error: string }> {
    if (!user) {
      return { error: "User is required" };
    }

    if (!date || date.trim().length === 0) {
      return { error: "Date is required" };
    }

    // Validate date format (should be ISO date string)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { error: "Invalid date format" };
    }

    const sessionId = freshID() as SessionId;

    await this.workoutSessions.insertOne({
      sessionId,
      user,
      date: date.trim()
    });

    return { sessionId };
  }

  /**
   * Action: Records an exercise in a workout session.
   * @requires sessionId exists
   * @effects adds exercise record to session
   */
  async recordExercise({ 
    sessionId, 
    exercise, 
    weight, 
    sets, 
    reps, 
    notes 
  }: { 
    sessionId: SessionId; 
    exercise: Exercise; 
    weight: number; 
    sets: number; 
    reps: number; 
    notes?: string | null; 
  }): Promise<Empty | { error: string }> {
    
    // Verify session exists
    const session = await this.workoutSessions.findOne({ sessionId });
    if (!session) {
      return { error: `Session with ID ${sessionId} not found` };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (weight < 0) {
      return { error: "Weight cannot be negative" };
    }

    if (sets <= 0) {
      return { error: "Sets must be greater than 0" };
    }

    if (reps <= 0) {
      return { error: "Reps must be greater than 0" };
    }

    await this.exerciseRecords.insertOne({
      sessionId,
      exercise,
      weight,
      sets,
      reps,
      notes: notes || null,
      recordedAt: new Date().toISOString()
    });

    return {};
  }

  /**
   * Action: Gets the last weight used for an exercise by a user.
   * @effects returns most recent weight for exercise by user, or null if none
   */
  async getLastWeight({ user, exercise }: { user: User; exercise: Exercise }): Promise<{ weight: number | null } | { error: string }> {
    if (!user) {
      return { error: "User is required" };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    // Find the most recent exercise record for this user and exercise
    const latestRecord = await this.exerciseRecords.aggregate([
      {
        $lookup: {
          from: this.workoutSessions.collectionName,
          localField: "sessionId",
          foreignField: "sessionId",
          as: "session"
        }
      },
      {
        $unwind: "$session"
      },
      {
        $match: {
          "session.user": user,
          exercise: exercise
        }
      },
      {
        $sort: { recordedAt: -1 }
      },
      {
        $limit: 1
      }
    ]).toArray();

    if (latestRecord.length === 0) {
      return { weight: null };
    }

    return { weight: latestRecord[0].weight };
  }

  /**
   * Action: Gets workout history for a user and exercise.
   * @effects returns recent exercise records sorted by date descending
   */
  async getWorkoutHistory({ 
    user, 
    exercise, 
    limit 
  }: { 
    user: User; 
    exercise: Exercise; 
    limit: number; 
  }): Promise<{ records: ExerciseRecordDoc[] } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (limit <= 0) {
      return { error: "Limit must be greater than 0" };
    }

    // Find exercise records for this user and exercise, sorted by date
    const records = await this.exerciseRecords.aggregate([
      {
        $lookup: {
          from: this.workoutSessions.collectionName,
          localField: "sessionId",
          foreignField: "sessionId",
          as: "session"
        }
      },
      {
        $unwind: "$session"
      },
      {
        $match: {
          "session.user": user,
          exercise: exercise
        }
      },
      {
        $sort: { "session.date": -1, recordedAt: -1 }
      },
      {
        $limit: limit
      }
    ]).toArray();

    return { records: records as ExerciseRecordDoc[] };
  }

  /**
   * Query: Gets all workout sessions for a user.
   */
  async _getUserSessions({ user }: { user: User }): Promise<WorkoutSessionDoc[]> {
    return await this.workoutSessions.find({ user }).sort({ date: -1 }).toArray();
  }

  /**
   * Query: Gets all exercise records for a session.
   */
  async _getSessionRecords({ sessionId }: { sessionId: SessionId }): Promise<ExerciseRecordDoc[]> {
    return await this.exerciseRecords.find({ sessionId }).sort({ recordedAt: 1 }).toArray();
  }

  /**
   * Query: Gets all exercise records for a user.
   */
  async _getUserRecords({ user }: { user: User }): Promise<ExerciseRecordDoc[]> {
    const records = await this.exerciseRecords.aggregate([
      {
        $lookup: {
          from: this.workoutSessions.collectionName,
          localField: "sessionId",
          foreignField: "sessionId",
          as: "session"
        }
      },
      {
        $unwind: "$session"
      },
      {
        $match: {
          "session.user": user
        }
      },
      {
        $sort: { "session.date": -1, recordedAt: -1 }
      }
    ]).toArray();

    return records as ExerciseRecordDoc[];
  }

  /**
   * Helper function to get the start of the week (Monday) for a given date
   */
  private getWeekStart(date: string): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Action: Updates weekly volume for exercise's muscle groups.
   * @effects updates weekly volume for exercise's muscle groups
   */
  async updateVolume({ 
    user, 
    exercise, 
    sets, 
    reps, 
    weight,
    weekStart 
  }: { 
    user: User; 
    exercise: Exercise; 
    sets: number; 
    reps: number; 
    weight: number;
    weekStart?: string;
  }): Promise<Empty | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!exercise) {
      return { error: "Exercise is required" };
    }

    if (sets <= 0 || reps <= 0 || weight < 0) {
      return { error: "Sets, reps, and weight must be positive values" };
    }

    const targetWeekStart = weekStart || this.getWeekStart(new Date().toISOString());
    const volume = sets * reps * weight;

    // For simplicity, assume exercise targets chest muscle group
    // In a real implementation, you'd look up the exercise's muscle groups
    const muscleGroup: MuscleGroup = "chest";

    // Update or create weekly volume record
    await this.weeklyVolume.updateOne(
      { user, muscleGroup, weekStart: targetWeekStart },
      { 
        $inc: { volume },
        $setOnInsert: {
          user,
          muscleGroup,
          weekStart: targetWeekStart
        }
      },
      { upsert: true }
    );

    return {};
  }

  /**
   * Action: Checks for muscle group imbalances.
   * @effects returns muscle groups with significantly lower volume
   */
  async checkBalance({ 
    user, 
    weekStart 
  }: { 
    user: User; 
    weekStart: string; 
  }): Promise<{ imbalance: MuscleGroup[] } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!weekStart || weekStart.trim().length === 0) {
      return { error: "Week start date is required" };
    }

    // Get all muscle group volumes for the user and week
    const volumes = await this.weeklyVolume.find({ 
      user, 
      weekStart: weekStart.trim() 
    }).toArray();

    if (volumes.length === 0) {
      return { imbalance: [] };
    }

    // Calculate average volume
    const totalVolume = volumes.reduce((sum, vol) => sum + vol.volume, 0);
    const averageVolume = totalVolume / volumes.length;

    // Find muscle groups with significantly lower volume (less than 50% of average)
    const imbalance: MuscleGroup[] = volumes
      .filter(vol => vol.volume < averageVolume * 0.5)
      .map(vol => vol.muscleGroup);

    return { imbalance };
  }

  /**
   * Action: Gets weekly volume for a user and week.
   * @effects returns weekly volume data
   */
  async getWeeklyVolume({ 
    user, 
    weekStart 
  }: { 
    user: User; 
    weekStart: string; 
  }): Promise<{ volumes: { muscleGroup: MuscleGroup; volume: number }[] } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!weekStart || weekStart.trim().length === 0) {
      return { error: "Week start date is required" };
    }

    // Get all muscle group volumes for the user and week
    const volumes = await this.weeklyVolume.find({ 
      user, 
      weekStart: weekStart.trim() 
    }).toArray();

    return { 
      volumes: volumes.map(v => ({ 
        muscleGroup: v.muscleGroup, 
        volume: v.volume 
      })) 
    };
  }

  /**
   * Query: Gets weekly volume for a user and week.
   */
  async _getWeeklyVolume({ user, weekStart }: { user: User; weekStart: string }): Promise<WeeklyVolumeDoc[]> {
    return await this.weeklyVolume.find({ user, weekStart }).toArray();
  }

  /**
   * Query: Gets all weekly volume records.
   */
  async _getAllWeeklyVolume(): Promise<WeeklyVolumeDoc[]> {
    return await this.weeklyVolume.find({}).toArray();
  }
}

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
 * State: A set of WorkoutSessions with user, date, sessionId, and name.
 */
interface WorkoutSessionDoc {
  sessionId: SessionId;
  user: User;
  date: string; // ISO date string
  name: string; // Generated name based on date and time
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
   * @effects creates new workout session with generated name
   */
  async startSession({ user, date }: { user: User; date: string }): Promise<{ sessionId: SessionId; name: string } | { error: string }> {
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
    const sessionName = this.generateSessionName(dateObj);

    await this.workoutSessions.insertOne({
      sessionId,
      user,
      date: date.trim(),
      name: sessionName
    });

    return { sessionId, name: sessionName };
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
   * Query: Gets session information including name for a specific session.
   */
  async getSessionInfo({ sessionId }: { sessionId: SessionId }): Promise<{ session: WorkoutSessionDoc } | { error: string }> {
    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    const session = await this.workoutSessions.findOne({ sessionId });
    if (!session) {
      return { error: `Session with ID ${sessionId} not found` };
    }

    return { session };
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
   * Helper function to generate a session name based on date and time
   */
  private generateSessionName(date: Date): string {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const day = now.getDate();
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dayOfWeek} ${month} ${day}, ${year} at ${time}`;
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
   * Action: Removes a workout session and all associated exercise records.
   * @requires sessionId exists and belongs to user
   * @effects removes session and all exercise records
   */
  async removeWorkoutSession({ 
    sessionId, 
    user 
  }: { 
    sessionId: SessionId; 
    user: User; 
  }): Promise<Empty | { error: string }> {
    
    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    if (!user) {
      return { error: "User is required" };
    }

    try {
      // Verify session exists and belongs to user
      const session = await this.workoutSessions.findOne({ sessionId });
      if (!session) {
        return { error: `Session with ID ${sessionId} not found` };
      }

      if (session.user !== user) {
        return { error: "Session does not belong to the specified user" };
      }

      // Remove all exercise records for this session
      await this.exerciseRecords.deleteMany({ sessionId });
      
      // Remove the workout session
      const sessionResult = await this.workoutSessions.deleteOne({ sessionId });
      
      if (sessionResult.deletedCount === 0) {
        return { error: "Session was not found during deletion" };
      }

      return {};
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to delete session: ${errorMessage}` };
    }
  }

  /**
   * Action: Removes a workout session with detailed error reporting (debug version).
   * @requires sessionId exists and belongs to user
   * @effects removes session and all exercise records
   */
  async removeWorkoutSessionDebug({ 
    sessionId, 
    user 
  }: { 
    sessionId: SessionId; 
    user: User; 
  }): Promise<Empty | { error: string; details?: any }> {
    
    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    if (!user) {
      return { error: "User is required" };
    }

    try {
      // Step 1: Verify session exists
      const session = await this.workoutSessions.findOne({ sessionId });
      if (!session) {
        return { error: `Session with ID ${sessionId} not found` };
      }

      // Step 2: Verify user ownership
      if (session.user !== user) {
        return { error: "Session does not belong to the specified user" };
      }

      // Step 3: Count exercise records before deletion
      const exerciseCount = await this.exerciseRecords.countDocuments({ sessionId });

      // Step 4: Remove exercise records
      const exerciseResult = await this.exerciseRecords.deleteMany({ sessionId });
      
      // Step 5: Remove the session
      const sessionResult = await this.workoutSessions.deleteOne({ sessionId });
      
      // Step 6: Verify deletion
      if (sessionResult.deletedCount === 0) {
        return { 
          error: "Session was not found during deletion",
          details: {
            sessionId,
            user,
            exerciseCount,
            exerciseDeleted: exerciseResult.deletedCount
          }
        };
      }

      // Step 7: Verify exercise records were removed
      const remainingExercises = await this.exerciseRecords.countDocuments({ sessionId });
      if (remainingExercises > 0) {
        return { 
          error: `Some exercise records remain (${remainingExercises})`,
          details: {
            sessionId,
            user,
            exerciseCount,
            exerciseDeleted: exerciseResult.deletedCount,
            remainingExercises
          }
        };
      }

      return {};
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        error: `Failed to delete session: ${errorMessage}`,
        details: {
          sessionId,
          user,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Action: Removes a workout session and all associated exercise records (robust version).
   * @requires sessionId exists and belongs to user
   * @effects removes session and all exercise records
   */
  async removeWorkoutSessionRobust({ 
    sessionId, 
    user 
  }: { 
    sessionId: SessionId; 
    user: User; 
  }): Promise<Empty | { error: string }> {
    
    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    if (!user) {
      return { error: "User is required" };
    }

    // Verify session exists and belongs to user
    const session = await this.workoutSessions.findOne({ sessionId });
    if (!session) {
      return { error: `Session with ID ${sessionId} not found` };
    }

    if (session.user !== user) {
      return { error: "Session does not belong to the specified user" };
    }

    // Get count of exercise records to verify cleanup
    const exerciseCount = await this.exerciseRecords.countDocuments({ sessionId });
    
    try {
      // Remove exercise records first
      const exerciseResult = await this.exerciseRecords.deleteMany({ sessionId });
      
      // Remove the session
      const sessionResult = await this.workoutSessions.deleteOne({ sessionId });
      
      // Verify both operations succeeded
      if (sessionResult.deletedCount === 0) {
        return { error: "Failed to remove workout session" };
      }
      
      // Verify exercise records were removed
      const remainingExercises = await this.exerciseRecords.countDocuments({ sessionId });
      if (remainingExercises > 0) {
        return { error: `Failed to remove all exercise records. ${remainingExercises} records remain` };
      }
      
      return {};
      
    } catch (error) {
      return { error: `Failed to remove workout session: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Action: Deletes a workout session and all associated exercise records.
   * @requires sessionId exists
   * @effects removes session and all exercise records
   * @api POST /api/WorkoutTracking/deleteSession
   * @body {"sessionId": "string"}
   * @returns {} on success, {"error": "string"} on failure
   */
  async deleteSession({ sessionId }: { sessionId: SessionId }): Promise<Empty | { error: string }> {
    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    try {
      // Verify session exists
      const session = await this.workoutSessions.findOne({ sessionId });
      if (!session) {
        return { error: `Session with ID ${sessionId} not found` };
      }

      // Remove all exercise records for this session
      await this.exerciseRecords.deleteMany({ sessionId });
      
      // Remove the workout session
      const sessionResult = await this.workoutSessions.deleteOne({ sessionId });
      
      if (sessionResult.deletedCount === 0) {
        return { error: "Session was not found during deletion" };
      }

      return {};
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to delete session: ${errorMessage}` };
    }
  }

  /**
   * Action: Gets suggested workouts based on muscle group balance and recent training history.
   * @effects returns suggested exercises for complementary muscle groups
   */
  async getSuggestedWorkouts({ 
    user, 
    limit = 5,
    lookbackDays = 7
  }: { 
    user: User; 
    limit?: number;
    lookbackDays?: number;
  }): Promise<{ 
    suggestions: { 
      muscleGroup: MuscleGroup; 
      reason: string; 
      priority: 'high' | 'medium' | 'low';
    }[] 
  } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (limit <= 0) {
      return { error: "Limit must be greater than 0" };
    }

    if (lookbackDays <= 0) {
      return { error: "Lookback days must be greater than 0" };
    }

    try {
      // Get recent workout sessions (last lookbackDays days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const recentSessions = await this.workoutSessions.find({
        user,
        date: { $gte: cutoffDateStr }
      }).toArray();

      if (recentSessions.length === 0) {
        // No recent workouts - suggest a balanced full-body workout
        return {
          suggestions: [
            { muscleGroup: "chest" as MuscleGroup, reason: "No recent workouts - start with chest exercises", priority: "high" as const },
            { muscleGroup: "back" as MuscleGroup, reason: "No recent workouts - include back exercises", priority: "high" as const },
            { muscleGroup: "legs" as MuscleGroup, reason: "No recent workouts - add leg exercises", priority: "high" as const },
            { muscleGroup: "shoulders" as MuscleGroup, reason: "No recent workouts - include shoulder exercises", priority: "medium" as const },
            { muscleGroup: "arms" as MuscleGroup, reason: "No recent workouts - add arm exercises", priority: "low" as const }
          ].slice(0, limit)
        };
      }

      // Get exercise records for recent sessions
      const sessionIds = recentSessions.map(s => s.sessionId);
      const recentExercises = await this.exerciseRecords.find({
        sessionId: { $in: sessionIds }
      }).toArray();

      // Analyze muscle group frequency in recent workouts
      const muscleGroupFrequency = this.analyzeMuscleGroupFrequency(recentExercises);
      
      // Get current week's volume for balance analysis
      const currentWeekStart = this.getWeekStart(new Date().toISOString());
      const weeklyVolumes = await this.weeklyVolume.find({
        user,
        weekStart: currentWeekStart
      }).toArray();

      // Create suggestions based on frequency and volume analysis
      const suggestions = this.generateWorkoutSuggestions(muscleGroupFrequency, weeklyVolumes, limit);

      return { suggestions };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to get suggested workouts: ${errorMessage}` };
    }
  }

  /**
   * Helper: Analyzes muscle group frequency in recent exercise records
   */
  private analyzeMuscleGroupFrequency(exerciseRecords: ExerciseRecordDoc[]): Map<MuscleGroup, number> {
    const frequency = new Map<MuscleGroup, number>();
    
    // Initialize all major muscle groups
    const allMuscleGroups: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core"];
    allMuscleGroups.forEach(group => frequency.set(group, 0));

    // Count frequency for each exercise (simplified mapping)
    exerciseRecords.forEach(record => {
      const muscleGroups = this.getMuscleGroupsForExercise(record.exercise);
      muscleGroups.forEach(group => {
        frequency.set(group, (frequency.get(group) || 0) + 1);
      });
    });

    return frequency;
  }

  /**
   * Helper: Maps exercise IDs to muscle groups (simplified implementation)
   */
  private getMuscleGroupsForExercise(exercise: Exercise): MuscleGroup[] {
    // This is a simplified mapping - in a real implementation, 
    // you'd query the ExerciseCatalog concept for this information
    const exerciseToMuscleGroups: Record<string, MuscleGroup[]> = {
      "benchpress": ["chest", "shoulders", "arms"],
      "inclinebench": ["chest", "shoulders", "arms"],
      "squat": ["legs", "core"],
      "deadlift": ["back", "legs", "core"],
      "pullups": ["back", "arms"],
      "bentoverrow": ["back", "arms"],
      "bicepcurl": ["arms"],
      "tricepdip": ["arms"],
      "overheadpress": ["shoulders", "arms"],
      "lunges": ["legs"],
      "plank": ["core"],
      "pushups": ["chest", "shoulders", "arms"],
      "latpulldown": ["back", "arms"],
      "shoulderpress": ["shoulders", "arms"],
      "legpress": ["legs"],
      "calfraise": ["legs"]
    };

    return exerciseToMuscleGroups[exercise] || ["chest"]; // Default fallback
  }

  /**
   * Helper: Generates workout suggestions based on frequency and volume analysis
   */
  private generateWorkoutSuggestions(
    frequency: Map<MuscleGroup, number>, 
    weeklyVolumes: WeeklyVolumeDoc[], 
    limit: number
  ): { muscleGroup: MuscleGroup; reason: string; priority: 'high' | 'medium' | 'low' }[] {
    
    const suggestions: { muscleGroup: MuscleGroup; reason: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    // Create volume map for easy lookup
    const volumeMap = new Map<MuscleGroup, number>();
    weeklyVolumes.forEach(vol => volumeMap.set(vol.muscleGroup, vol.volume));

    // Calculate average volume for balance analysis
    const totalVolume = weeklyVolumes.reduce((sum, vol) => sum + vol.volume, 0);
    const averageVolume = weeklyVolumes.length > 0 ? totalVolume / weeklyVolumes.length : 0;

    // Define complementary muscle group pairs
    const complementaryPairs: Record<MuscleGroup, MuscleGroup[]> = {
      "chest": ["back"], // Push/pull balance
      "back": ["chest"], // Pull/push balance
      "legs": ["core"], // Lower body/core balance
      "shoulders": ["arms"], // Upper body balance
      "arms": ["shoulders"], // Upper body balance
      "core": ["legs"] // Core/lower body balance
    };

    // Analyze each muscle group
    const allMuscleGroups: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core"];
    
    allMuscleGroups.forEach(group => {
      const freq = frequency.get(group) || 0;
      const volume = volumeMap.get(group) || 0;
      
      // High priority: Not worked recently AND low volume
      if (freq === 0 && volume < averageVolume * 0.3) {
        suggestions.push({
          muscleGroup: group,
          reason: `Not worked in recent sessions and low weekly volume (${volume.toFixed(0)} vs avg ${averageVolume.toFixed(0)})`,
          priority: "high"
        });
      }
      // Medium priority: Low frequency OR low volume
      else if (freq <= 1 || volume < averageVolume * 0.5) {
        suggestions.push({
          muscleGroup: group,
          reason: `Under-trained: ${freq} recent sessions, ${volume.toFixed(0)} weekly volume`,
          priority: "medium"
        });
      }
      // Low priority: Complementary muscle groups for balance
      else {
        const complementaryGroups = complementaryPairs[group] || [];
        complementaryGroups.forEach(compGroup => {
          const compFreq = frequency.get(compGroup) || 0;
          if (compFreq > freq + 1) { // If complementary group is over-trained relative to this group
            suggestions.push({
              muscleGroup: group,
              reason: `Balance training: ${compGroup} is over-trained relative to ${group}`,
              priority: "low"
            });
          }
        });
      }
    });

    // Sort by priority and limit results
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, limit);
  }

  /**
   * Action: Gets suggested exercises for specific muscle groups with ExerciseCatalog integration.
   * @effects returns specific exercises for suggested muscle groups
   */
  async getSuggestedExercises({ 
    user, 
    muscleGroups, 
    limitPerGroup = 3,
    exerciseCatalog 
  }: { 
    user: User; 
    muscleGroups: MuscleGroup[]; 
    limitPerGroup?: number;
    exerciseCatalog: any; // ExerciseCatalogConcept instance
  }): Promise<{ 
    suggestions: { 
      muscleGroup: MuscleGroup; 
      exercises: { exerciseId: Exercise; name: string; equipment: string | null }[];
    }[] 
  } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!muscleGroups || muscleGroups.length === 0) {
      return { error: "At least one muscle group must be specified" };
    }

    if (!exerciseCatalog) {
      return { error: "ExerciseCatalog instance is required" };
    }

    try {
      const suggestions: { 
        muscleGroup: MuscleGroup; 
        exercises: { exerciseId: Exercise; name: string; equipment: string | null }[];
      }[] = [];

      for (const muscleGroup of muscleGroups) {
        // Get exercises for this muscle group from ExerciseCatalog
        const exerciseResult = await exerciseCatalog.searchExercises({ 
          muscleGroup,
          query: undefined // Get all exercises for this muscle group
        });

        // Limit exercises per group and format the response
        const limitedExercises = exerciseResult.exercises
          .slice(0, limitPerGroup)
          .map((exercise: any) => ({
            exerciseId: exercise.exerciseId as Exercise,
            name: exercise.name,
            equipment: exercise.equipment
          }));

        suggestions.push({
          muscleGroup,
          exercises: limitedExercises
        });
      }

      return { suggestions };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to get suggested exercises: ${errorMessage}` };
    }
  }

  /**
   * Action: Gets comprehensive workout suggestions with both muscle groups and specific exercises.
   * @effects returns complete workout suggestions with exercises
   */
  async getCompleteWorkoutSuggestions({ 
    user, 
    limit = 5,
    lookbackDays = 7,
    limitPerGroup = 3,
    exerciseCatalog 
  }: { 
    user: User; 
    limit?: number;
    lookbackDays?: number;
    limitPerGroup?: number;
    exerciseCatalog: any; // ExerciseCatalogConcept instance
  }): Promise<{ 
    suggestions: { 
      muscleGroup: MuscleGroup; 
      reason: string; 
      priority: 'high' | 'medium' | 'low';
      exercises: { exerciseId: Exercise; name: string; equipment: string | null }[];
    }[] 
  } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!exerciseCatalog) {
      return { error: "ExerciseCatalog instance is required" };
    }

    try {
      // First get muscle group suggestions
      const muscleGroupResult = await this.getSuggestedWorkouts({ 
        user, 
        limit, 
        lookbackDays 
      });

      if ('error' in muscleGroupResult) {
        return muscleGroupResult;
      }

      // Extract muscle groups from suggestions
      const muscleGroups = muscleGroupResult.suggestions.map(s => s.muscleGroup);

      // Get specific exercises for these muscle groups
      const exerciseResult = await this.getSuggestedExercises({ 
        user, 
        muscleGroups, 
        limitPerGroup, 
        exerciseCatalog 
      });

      if ('error' in exerciseResult) {
        return exerciseResult;
      }

      // Combine muscle group suggestions with specific exercises
      const completeSuggestions = muscleGroupResult.suggestions.map(muscleGroupSuggestion => {
        const exerciseSuggestion = exerciseResult.suggestions.find(
          es => es.muscleGroup === muscleGroupSuggestion.muscleGroup
        );

        return {
          muscleGroup: muscleGroupSuggestion.muscleGroup,
          reason: muscleGroupSuggestion.reason,
          priority: muscleGroupSuggestion.priority,
          exercises: exerciseSuggestion?.exercises || []
        };
      });

      return { suggestions: completeSuggestions };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to get complete workout suggestions: ${errorMessage}` };
    }
  }

  /**
   * Query: Gets all weekly volume records.
   */
  async _getAllWeeklyVolume(): Promise<WeeklyVolumeDoc[]> {
    return await this.weeklyVolume.find({}).toArray();
  }
}

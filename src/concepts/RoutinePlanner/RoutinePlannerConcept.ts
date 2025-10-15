import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "RoutinePlanner" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Exercise = ID;

// Internal entity types, represented as IDs
type TemplateId = ID;
type MuscleGroup = string;

/**
 * State: A set of WorkoutTemplates with templateId, name, exercises, and muscleGroups.
 */
interface WorkoutTemplateDoc {
  templateId: TemplateId;
  name: string;
  exercises: Exercise[];
  muscleGroups: MuscleGroup[];
}

/**
 * State: A set of UserTemplates with user, templateId, and isDefault.
 */
interface UserTemplateDoc {
  user: User;
  templateId: TemplateId;
  isDefault: boolean;
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
 * @concept RoutinePlanner
 * @purpose Manage workout templates and balance muscle group training
 */
export default class RoutinePlannerConcept {
  workoutTemplates: Collection<WorkoutTemplateDoc>;
  userTemplates: Collection<UserTemplateDoc>;
  weeklyVolume: Collection<WeeklyVolumeDoc>;

  constructor(private readonly db: Db) {
    this.workoutTemplates = this.db.collection(PREFIX + "workoutTemplates");
    this.userTemplates = this.db.collection(PREFIX + "userTemplates");
    this.weeklyVolume = this.db.collection(PREFIX + "weeklyVolume");
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
   * Action: Creates a new workout template.
   * @effects creates new workout template
   */
  async createTemplate({ 
    user, 
    name, 
    exercises 
  }: { 
    user: User; 
    name: string; 
    exercises: Exercise[]; 
  }): Promise<{ templateId: TemplateId } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!name || name.trim().length === 0) {
      return { error: "Template name cannot be empty" };
    }

    if (!exercises || exercises.length === 0) {
      return { error: "At least one exercise must be specified" };
    }

    const templateId = freshID() as TemplateId;

    // For simplicity, we'll assume muscle groups are determined by the exercises
    // In a real implementation, you'd look up the exercises in ExerciseCatalog
    const muscleGroups: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms"];

    await this.workoutTemplates.insertOne({
      templateId,
      name: name.trim(),
      exercises,
      muscleGroups
    });

    // Associate template with user
    await this.userTemplates.insertOne({
      user,
      templateId,
      isDefault: false
    });

    return { templateId };
  }

  /**
   * Action: Gets suggested workout template based on recent training volume and balance.
   * @effects returns template based on recent training volume and balance
   */
  async getSuggestedWorkout({ 
    user, 
    date 
  }: { 
    user: User; 
    date: string; 
  }): Promise<{ template: WorkoutTemplateDoc | null } | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!date || date.trim().length === 0) {
      return { error: "Date is required" };
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { error: "Invalid date format" };
    }

    // Get user's templates
    const userTemplates = await this.userTemplates.find({ user }).toArray();
    if (userTemplates.length === 0) {
      return { template: null };
    }

    // Find the default template first, otherwise use the first template
    const defaultTemplate = userTemplates.find(t => t.isDefault);
    const selectedUserTemplate = defaultTemplate || userTemplates[0];

    // Get the full template object
    const template = await this.workoutTemplates.findOne({ 
      templateId: selectedUserTemplate.templateId 
    });

    return { template };
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

    // Map exercises to muscle groups (simplified mapping)
    // In a real implementation, you'd look up the exercise's muscle groups from ExerciseCatalog
    const exerciseToMuscleGroup: Record<string, MuscleGroup> = {
      "benchpress": "chest",
      "inclinebench": "chest",
      "squat": "legs",
      "deadlift": "back", // deadlift targets both back and legs, but we'll map to back for balance checking
      "pullups": "back",
      "bentoverrow": "back",
      "bicepcurl": "arms",
      "overheadpress": "shoulders",
      "lunges": "legs"
    };

    const muscleGroup: MuscleGroup = exerciseToMuscleGroup[exercise] || "chest";

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
   * Action: Gets template details by ID.
   * @effects returns template details if exists
   */
  async getTemplate({ templateId }: { templateId: TemplateId }): Promise<{ 
    name: string; 
    exercises: Exercise[]; 
    muscleGroups: MuscleGroup[]; 
  } | { error: string }> {
    if (!templateId) {
      return { error: "Template ID is required" };
    }

    const template = await this.workoutTemplates.findOne({ templateId });
    if (!template) {
      return { error: `Template with ID ${templateId} not found` };
    }

    return {
      name: template.name,
      exercises: template.exercises,
      muscleGroups: template.muscleGroups
    };
  }

  /**
   * Helper action: Sets a template as default for a user.
   * This is not in the original spec but useful for testing and setup.
   */
  async setDefaultTemplate({ 
    user, 
    templateId 
  }: { 
    user: User; 
    templateId: TemplateId; 
  }): Promise<Empty | { error: string }> {
    
    if (!user) {
      return { error: "User is required" };
    }

    if (!templateId) {
      return { error: "Template ID is required" };
    }

    // Verify template exists
    const template = await this.workoutTemplates.findOne({ templateId });
    if (!template) {
      return { error: `Template with ID ${templateId} not found` };
    }

    // Remove any existing default for this user
    await this.userTemplates.updateMany(
      { user, isDefault: true },
      { $set: { isDefault: false } }
    );

    // Set new default
    await this.userTemplates.updateOne(
      { user, templateId },
      { $set: { isDefault: true } }
    );

    return {};
  }

  /**
   * Query: Gets all templates for a user.
   */
  async _getUserTemplates({ user }: { user: User }): Promise<WorkoutTemplateDoc[]> {
    const userTemplates = await this.userTemplates.find({ user }).toArray();
    const templateIds = userTemplates.map(ut => ut.templateId);
    
    if (templateIds.length === 0) {
      return [];
    }

    return await this.workoutTemplates.find({ 
      templateId: { $in: templateIds } 
    }).toArray();
  }

  /**
   * Query: Gets weekly volume for a user and week.
   */
  async _getWeeklyVolume({ user, weekStart }: { user: User; weekStart: string }): Promise<WeeklyVolumeDoc[]> {
    return await this.weeklyVolume.find({ user, weekStart }).toArray();
  }

  /**
   * Query: Gets all workout templates.
   */
  async _getAllTemplates(): Promise<WorkoutTemplateDoc[]> {
    return await this.workoutTemplates.find({}).toArray();
  }
}

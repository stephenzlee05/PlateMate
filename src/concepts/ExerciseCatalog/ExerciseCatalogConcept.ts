import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "ExerciseCatalog" + ".";

// Generic types for the concept's external dependencies
type Exercise = ID;

// Internal entity types, represented as IDs
type ExerciseId = ID;
type MuscleGroup = string;

/**
 * State: A set of Exercises with metadata.
 */
interface ExerciseDoc {
  exerciseId: ExerciseId;
  name: string;
  muscleGroups: MuscleGroup[];
  movementPattern: string;
  equipment: string | null;
  instructions: string | null;
}

/**
 * @concept ExerciseCatalog
 * @purpose Maintain database of exercises with metadata
 */
export default class ExerciseCatalogConcept {
  exercises: Collection<ExerciseDoc>;

  constructor(private readonly db: Db) {
    this.exercises = this.db.collection(PREFIX + "exercises");
  }

  /**
   * Action: Adds a new exercise to the catalog.
   * @effects adds new exercise to catalog
   */
  async addExercise({ 
    name, 
    muscleGroups, 
    movementPattern, 
    equipment, 
    instructions 
  }: { 
    name: string; 
    muscleGroups: MuscleGroup[]; 
    movementPattern: string; 
    equipment?: string | null; 
    instructions?: string | null; 
  }): Promise<{ exerciseId: ExerciseId } | { error: string }> {
    
    if (!name || name.trim().length === 0) {
      return { error: "Exercise name cannot be empty" };
    }

    if (!muscleGroups || muscleGroups.length === 0) {
      return { error: "At least one muscle group must be specified" };
    }

    if (!movementPattern || movementPattern.trim().length === 0) {
      return { error: "movement pattern cannot be empty" };
    }

    // Check if exercise with same name already exists
    const existingExercise = await this.exercises.findOne({ name: name.trim() });
    if (existingExercise) {
      return { error: `Exercise with name '${name}' already exists` };
    }

    const exerciseId = freshID() as ExerciseId;

    await this.exercises.insertOne({
      exerciseId,
      name: name.trim(),
      muscleGroups,
      movementPattern: movementPattern.trim(),
      equipment: equipment || null,
      instructions: instructions || null
    });

    return { exerciseId };
  }

  /**
   * Action: Searches for exercises matching criteria.
   * @effects returns exercise IDs matching search criteria
   */
  async searchExercises({ 
    query, 
    muscleGroup 
  }: { 
    query?: string; 
    muscleGroup?: MuscleGroup; 
  }): Promise<{ exercises: ExerciseDoc[] }> {
    
    const filter: any = {};

    // Add text search if query provided
    if (query && query.trim().length > 0) {
      filter.$or = [
        { name: { $regex: query.trim(), $options: "i" } },
        { movementPattern: { $regex: query.trim(), $options: "i" } },
        { equipment: { $regex: query.trim(), $options: "i" } }
      ];
    }

    // Add muscle group filter if provided
    if (muscleGroup) {
      filter.muscleGroups = { $in: [muscleGroup] };
    }

    const exercises = await this.exercises.find(filter).toArray();
    return { exercises };
  }

  /**
   * Action: Gets exercise details by ID.
   * @effects returns exercise details
   */
  async getExercise({ exerciseId }: { exerciseId: Exercise }): Promise<{ 
    exercise: ExerciseDoc;
  } | { error: string }> {
    const exercise = await this.exercises.findOne({ exerciseId });
    if (!exercise) {
      return { error: `Exercise with ID ${exerciseId} not found` };
    }

    return {
      exercise
    };
  }

  /**
   * Action: Recommends exercises for a specific muscle group.
   * @effects returns recommended exercises for muscle group
   */
  async recommendExercises({ 
    muscleGroup, 
    limit 
  }: { 
    muscleGroup: MuscleGroup; 
    limit: number; 
  }): Promise<{ exerciseIds: ExerciseId[] } | { error: string }> {
    
    if (!muscleGroup) {
      return { error: "Muscle group is required" };
    }

    if (limit <= 0) {
      return { error: "Limit must be greater than 0" };
    }

    const exercises = await this.exercises.find({ 
      muscleGroups: { $in: [muscleGroup] } 
    }).limit(limit).toArray();

    return { exerciseIds: exercises.map(e => e.exerciseId) };
  }

  /**
   * Action: Gets exercises by movement pattern.
   * @effects returns exercises matching movement pattern
   */
  async getExercisesByMovementPattern({ 
    movementPattern 
  }: { 
    movementPattern: string; 
  }): Promise<{ exerciseIds: ExerciseId[] } | { error: string }> {
    
    if (!movementPattern) {
      return { error: "Movement pattern is required" };
    }

    const exercises = await this.exercises.find({ movementPattern }).toArray();
    return { exerciseIds: exercises.map(e => e.exerciseId) };
  }

  /**
   * Query: Gets all exercises.
   */
  async _getAllExercises(): Promise<{ exercises: ExerciseDoc[] }> {
    const exercises = await this.exercises.find({}).toArray();
    return { exercises };
  }

  /**
   * Query: Gets exercises by muscle group.
   */
  async _getExercisesByMuscleGroup({ muscleGroup }: { muscleGroup: MuscleGroup }): Promise<ExerciseDoc[]> {
    return await this.exercises.find({ muscleGroups: { $in: [muscleGroup] } }).toArray();
  }

  /**
   * Query: Gets exercises by movement pattern.
   */
  async _getExercisesByMovementPattern({ movementPattern }: { movementPattern: string }): Promise<ExerciseDoc[]> {
    return await this.exercises.find({ movementPattern }).toArray();
  }

  /**
   * Query: Gets exercises by equipment.
   */
  async _getExercisesByEquipment({ equipment }: { equipment: string }): Promise<ExerciseDoc[]> {
    return await this.exercises.find({ equipment }).toArray();
  }
}

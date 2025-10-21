---
timestamp: 'Mon Oct 20 2025 15:54:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251020_155454.b2f443ed.md]]'
content_id: 084aae9bdd6021f32b314d0b4352c9f7d5e691c5e4d4f5b5d495536735fb162c
---

# file: src/concepts/ExerciseCatalog/ExerciseCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "ExerciseCatalog" + ".";

// Generic types of this concept
type Exercise = ID; // Represents an external identifier for an exercise item
type Category = ID; // Represents an internal identifier for a category

/**
 * a set of Exercises with
 *   an exerciseID Exercise
 *   a name String
 *   a description String
 *   a category Category
 *   a tags set of String
 */
interface CatalogExercise {
  _id: Exercise;
  name: string;
  description: string;
  category: Category;
  tags: string[];
}

/**
 * a set of Categories with
 *   a categoryID Category
 *   a name String
 */
interface CatalogCategory {
  _id: Category;
  name: string;
}

export default class ExerciseCatalogConcept {
  private exercises: Collection<CatalogExercise>;
  private categories: Collection<CatalogCategory>;

  constructor(private readonly db: Db) {
    this.exercises = this.db.collection(PREFIX + "exercises");
    this.categories = this.db.collection(PREFIX + "categories");
  }

  /**
   * addCategory (name: String): (category: Category)
   *
   * **requires** no Category with the given `name` already exists
   *
   * **effects** creates a new Category `c`; sets the name of `c` to `name`; returns `c` as `category`
   */
  async addCategory({
    name,
  }: {
    name: string;
  }): Promise<{ category: Category } | { error: string }> {
    const existingCategory = await this.categories.findOne({ name });
    if (existingCategory) {
      return { error: `Category with name '${name}' already exists.` };
    }

    const newCategory: CatalogCategory = {
      _id: freshID() as Category,
      name,
    };
    await this.categories.insertOne(newCategory);
    return { category: newCategory._id };
  }

  /**
   * addExercise (name: String, description: String, category: Category, tags: set of String): (exercise: Exercise)
   *
   * **requires** no Exercise with the given `name` already exists; the `category` exists
   *
   * **effects** creates a new Exercise `e`; sets its `name`, `description`, `category`, and `tags`; returns `e` as `exercise`
   */
  async addExercise({
    name,
    description,
    category,
    tags,
  }: {
    name: string;
    description: string;
    category: Category;
    tags: string[];
  }): Promise<{ exercise: Exercise } | { error: string }> {
    const existingExercise = await this.exercises.findOne({ name });
    if (existingExercise) {
      return { error: `Exercise with name '${name}' already exists.` };
    }

    const categoryExists = await this.categories.findOne({ _id: category });
    if (!categoryExists) {
      return { error: `Category with ID '${category}' does not exist.` };
    }

    const newExercise: CatalogExercise = {
      _id: freshID() as Exercise,
      name,
      description,
      category,
      tags,
    };
    await this.exercises.insertOne(newExercise);
    return { exercise: newExercise._id };
  }

  /**
   * updateExercise (exercise: Exercise, name?: String, description?: String, category?: Category, tags?: set of String): Empty | {error: String}
   *
   * **requires** the `exercise` exists; if `category` is provided, it must exist
   *
   * **effects** updates the specified fields of the `exercise`
   */
  async updateExercise({
    exercise,
    name,
    description,
    category,
    tags,
  }: {
    exercise: Exercise;
    name?: string;
    description?: string;
    category?: Category;
    tags?: string[];
  }): Promise<Empty | { error: string }> {
    const existingExercise = await this.exercises.findOne({ _id: exercise });
    if (!existingExercise) {
      return { error: `Exercise with ID '${exercise}' not found.` };
    }

    if (category) {
      const categoryExists = await this.categories.findOne({ _id: category });
      if (!categoryExists) {
        return { error: `Category with ID '${category}' does not exist.` };
      }
    }

    // If a new name is provided, check for uniqueness if it's different from current name
    if (name && name !== existingExercise.name) {
        const nameConflict = await this.exercises.findOne({ name });
        if (nameConflict) {
            return { error: `Another exercise with name '${name}' already exists.` };
        }
    }


    const updateFields: Partial<CatalogExercise> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) updateFields.tags = tags;

    if (Object.keys(updateFields).length === 0) {
      return {}; // No fields to update
    }

    const result = await this.exercises.updateOne(
      { _id: exercise },
      { $set: updateFields },
    );

    if (result.matchedCount === 0) {
      return { error: `Failed to update exercise '${exercise}'.` };
    }
    return {};
  }

  /**
   * removeExercise (exercise: Exercise): Empty | {error: String}
   *
   * **requires** the `exercise` exists
   *
   * **effects** removes the `exercise` from the catalog
   */
  async removeExercise({
    exercise,
  }: {
    exercise: Exercise;
  }): Promise<Empty | { error: string }> {
    const result = await this.exercises.deleteOne({ _id: exercise });
    if (result.deletedCount === 0) {
      return { error: `Exercise with ID '${exercise}' not found.` };
    }
    return {};
  }

  /**
   * _getExercise (exercise: Exercise): (exerciseDetails: {exerciseID: Exercise, name: String, description: String, category: Category, tags: set of String}[])
   *
   * **effects** returns the details of the specified `exercise` as a single-element array, or an empty array if not found
   */
  async _getExercise({
    exercise,
  }: {
    exercise: Exercise;
  }): Promise<CatalogExercise[]> {
    const foundExercise = await this.exercises.findOne({ _id: exercise });
    if (foundExercise) {
      return [
        {
          exerciseID: foundExercise._id,
          name: foundExercise.name,
          description: foundExercise.description,
          category: foundExercise.category,
          tags: foundExercise.tags,
        },
      ];
    }
    return [];
  }

  /**
   * _listExercises (): (exercises: {exerciseID: Exercise, name: String, category: Category}[])
   *
   * **effects** returns a list of all exercises with their IDs, names, and categories
   */
  async _listExercises(): Promise<
    { exerciseID: Exercise; name: string; category: Category }[]
  > {
    const exercises = await this.exercises
      .find({}, { projection: { _id: 1, name: 1, category: 1 } })
      .toArray();
    return exercises.map((e) => ({
      exerciseID: e._id,
      name: e.name,
      category: e.category,
    }));
  }

  /**
   * _searchExercises (query: String, category?: Category, tags?: set of String): (exercises: {exerciseID: Exercise, name: String, category: Category}[])
   *
   * **effects** returns a list of exercises matching the query in their name or description, optionally filtered by category and tags
   */
  async _searchExercises({
    query,
    category,
    tags,
  }: {
    query: string;
    category?: Category;
    tags?: string[];
  }): Promise<
    { exerciseID: Exercise; name: string; category: Category }[]
  > {
    const filter: Record<string, unknown> = {};

    // Search by name or description (case-insensitive)
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const exercises = await this.exercises
      .find(filter, { projection: { _id: 1, name: 1, category: 1 } })
      .toArray();

    return exercises.map((e) => ({
      exerciseID: e._id,
      name: e.name,
      category: e.category,
    }));
  }

  /**
   * _getCategories (): (categories: {categoryID: Category, name: String}[])
   *
   * **effects** returns a list of all available categories
   */
  async _getCategories(): Promise<{ categoryID: Category; name: string }[]> {
    const categories = await this.categories
      .find({}, { projection: { _id: 1, name: 1 } })
      .toArray();
    return categories.map((c) => ({ categoryID: c._id, name: c.name }));
  }
}
```

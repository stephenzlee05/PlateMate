---
timestamp: 'Sun Oct 12 2025 23:04:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_230435.5970746a.md]]'
content_id: ad8c55c8611891177112485418df4008a52dcbf14968ee76509b599dc2e730e1
---

# concept: ExerciseCatalog

**concept** ExerciseCatalog \[Exercise]

**purpose** manage a comprehensive and searchable collection of defined exercises, providing details and categorizations for each.

**principle** after an administrator adds a new exercise with a name, description, and category, users can browse the catalog and find this exercise by its name or by filtering on its category.

**state**
  a set of Exercises with
    an exerciseID Exercise
    a name String
    a description String
    a category Category
    a tags set of String
  a set of Categories with
    a categoryID Category
    a name String

**actions**
  addCategory (name: String): (category: Category)
    **requires** no Category with the given `name` already exists
    **effects** creates a new Category `c`; sets the name of `c` to `name`; returns `c` as `category`

  addExercise (name: String, description: String, category: Category, tags: set of String): (exercise: Exercise)
    **requires** no Exercise with the given `name` already exists; the `category` exists
    **effects** creates a new Exercise `e`; sets its `name`, `description`, `category`, and `tags`; returns `e` as `exercise`

  updateExercise (exercise: Exercise, name?: String, description?: String, category?: Category, tags?: set of String): Empty | {error: String}
    **requires** the `exercise` exists; if `category` is provided, it must exist
    **effects** updates the specified fields of the `exercise`

  removeExercise (exercise: Exercise): Empty | {error: String}
    **requires** the `exercise` exists
    **effects** removes the `exercise` from the catalog

**queries**
  \_getExercise (exercise: Exercise): (exerciseDetails: {exerciseID: Exercise, name: String, description: String, category: Category, tags: set of String}\[])
    **effects** returns the details of the specified `exercise` as a single-element array, or an empty array if not found

  \_listExercises (): (exercises: {exerciseID: Exercise, name: String, category: Category}\[])
    **effects** returns a list of all exercises with their IDs, names, and categories

  \_searchExercises (query: String, category?: Category, tags?: set of String): (exercises: {exerciseID: Exercise, name: String, category: Category}\[])
    **effects** returns a list of exercises matching the query in their name or description, optionally filtered by category and tags

  \_getCategories (): (categories: {categoryID: Category, name: String}\[])
    **effects** returns a list of all available categories

***

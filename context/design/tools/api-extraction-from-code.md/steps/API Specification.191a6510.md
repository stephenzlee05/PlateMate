---
timestamp: 'Sun Oct 12 2025 23:08:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_230836.abd6bbab.md]]'
content_id: 191a651018023ec4fd5820c14f3c3ec3a7b6fda3d415f09671c13cbefef34185
---

# API Specification: ExerciseCatalog Concept

**Purpose:** maintain a catalog of exercises and their properties, allowing them to be retrieved by category or name

***

## API Endpoints

### POST /api/ExerciseCatalog/createCategory

**Description:** Creates a new exercise category.

**Requirements:**

* no Category with the given `name` already exists

**Effects:**

* creates a new Category `c`
* sets the name of `c` to `name`
* returns `c` as `category`

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "category": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExerciseCatalog/createExercise

**Description:** Creates a new exercise with its properties and associated categories.

**Requirements:**

* no Exercise with the given `name` already exists
* `primaryCategory` exists
* all `relatedCategories` exist

**Effects:**

* creates a new Exercise `e`
* sets the name of `e` to `name`, description to `description`, primaryCategory to `primaryCategory`, and relatedCategories to `relatedCategories`
* returns `e` as `exercise`

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "primaryCategory": "string",
  "relatedCategories": ["string"]
}
```

**Success Response Body (Action):**

```json
{
  "exercise": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExerciseCatalog/\_getExerciseByName

**Description:** Retrieves an exercise by its name.

**Requirements:**

* an Exercise with the given `name` exists

**Effects:**

* returns the Exercise with the given `name`

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "exercise": "string",
    "description": "string",
    "primaryCategory": "string",
    "relatedCategories": ["string"]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExerciseCatalog/\_getExercisesByCategory

**Description:** Retrieves all exercises associated with a given category.

**Requirements:**

* `category` exists

**Effects:**

* returns all Exercises whose `primaryCategory` is `category` or is in `relatedCategories`

**Request Body:**

```json
{
  "category": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "exercise": "string",
    "name": "string",
    "description": "string",
    "primaryCategory": "string",
    "relatedCategories": ["string"]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExerciseCatalog/\_getAllCategories

**Description:** Retrieves all existing exercise categories.

**Requirements:**

* true

**Effects:**

* returns all existing Categories

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
[
  {
    "category": "string",
    "name": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExerciseCatalog/\_getAllExercises

**Description:** Retrieves all existing exercises.

**Requirements:**

* true

**Effects:**

* returns all existing Exercises

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
[
  {
    "exercise": "string",
    "name": "string",
    "description": "string",
    "primaryCategory": "string",
    "relatedCategories": ["string"]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

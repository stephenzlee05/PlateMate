---
timestamp: 'Mon Oct 20 2025 15:55:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251020_155530.8ea4b448.md]]'
content_id: eb2922c6550f8b8727e2ae23f911c4b4ce3bca415c7945577244c7beae1c1ebc
---

# response:

Here is the API specification for the `ExerciseCatalogConcept` backend, followed by instructions to start the server and its expected output.

***

## API Specification for ExerciseCatalogConcept

The `ExerciseCatalogConcept` is exposed via a RESTful API at the base URL `/api/exercisecatalog`.

### Concepts and Types:

* `Exercise`: Represents a unique identifier for an exercise (e.g., `exercise:uuid-123`). Treated as a `String` in API requests/responses.
* `Category`: Represents a unique identifier for an exercise category (e.g., `category:uuid-456`). Treated as a `String` in API requests/responses.

***

### Actions (Mutating Operations)

#### 1. Add Category

* **Concept Action:** `addCategory (name: String): (category: Category) | {error: String}`
* **HTTP Method:** `POST`
* **Endpoint:** `/api/exercisecatalog/categories`
* **Purpose:** Creates a new exercise category.
* **Request Body (JSON):**
  ```json
  {
      "name": "Cardio"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
      "category": "category:uuid-12345"
  }
  ```
* **Error Response (200 OK with error payload):**
  ```json
  {
      "error": "Category with name 'Cardio' already exists."
  }
  ```

#### 2. Add Exercise

* **Concept Action:** `addExercise (name: String, description: String, category: Category, tags: set of String): (exercise: Exercise) | {error: String}`
* **HTTP Method:** `POST`
* **Endpoint:** `/api/exercisecatalog/exercises`
* **Purpose:** Adds a new exercise to the catalog.
* **Request Body (JSON):**
  ```json
  {
      "name": "Push-ups",
      "description": "A classic bodyweight exercise.",
      "category": "category:uuid-12345",
      "tags": ["bodyweight", "chest", "triceps"]
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
      "exercise": "exercise:uuid-67890"
  }
  ```
* **Error Response (200 OK with error payload):**
  ```json
  {
      "error": "Exercise with name 'Push-ups' already exists."
  }
  ```
  Or:
  ```json
  {
      "error": "Category with ID 'category:non-existent' does not exist."
  }
  ```

#### 3. Update Exercise

* **Concept Action:** `updateExercise (exercise: Exercise, name?: String, description?: String, category?: Category, tags?: set of String): Empty | {error: String}`
* **HTTP Method:** `PUT`
* **Endpoint:** `/api/exercisecatalog/exercises/{exerciseId}`
  * Replace `{exerciseId}` with the actual `Exercise` ID (e.g., `exercise:uuid-67890`).
* **Purpose:** Updates one or more fields of an existing exercise.
* **Request Body (JSON):**
  ```json
  {
      "description": "An effective bodyweight exercise for chest and triceps strength.",
      "tags": ["bodyweight", "strength", "chest"]
  }
  ```
  (Fields are optional, provide only those to be updated)
* **Success Response (200 OK):**
  ```json
  {}
  ```
* **Error Response (200 OK with error payload):**
  ```json
  {
      "error": "Exercise with ID 'exercise:non-existent' not found."
  }
  ```
  Or:
  ```json
  {
      "error": "Category with ID 'category:non-existent' does not exist."
  }
  ```
  Or:
  ```json
  {
      "error": "Another exercise with name 'New Name' already exists."
  }
  ```

#### 4. Remove Exercise

* **Concept Action:** `removeExercise (exercise: Exercise): Empty | {error: String}`
* **HTTP Method:** `DELETE`
* **Endpoint:** `/api/exercisecatalog/exercises/{exerciseId}`
  * Replace `{exerciseId}` with the actual `Exercise` ID (e.g., `exercise:uuid-67890`).
* **Purpose:** Removes an exercise from the catalog.
* **Request Body (JSON):** None
* **Success Response (200 OK):**
  ```json
  {}
  ```
* **Error Response (200 OK with error payload):**
  ```json
  {
      "error": "Exercise with ID 'exercise:non-existent' not found."
  }
  ```

***

### Queries (Read-only Operations)

#### 1. Get Exercise Details

* **Concept Query:** `_getExercise (exercise: Exercise): (exerciseDetails: {exerciseID: Exercise, name: String, description: String, category: Category, tags: set of String}[])`
* **HTTP Method:** `GET`
* **Endpoint:** `/api/exercisecatalog/exercises/{exerciseId}`
  * Replace `{exerciseId}` with the actual `Exercise` ID (e.g., `exercise:uuid-67890`).
* **Purpose:** Retrieves the full details of a specific exercise.
* **Request Parameters:** None
* **Success Response (200 OK):**
  ```json
  [
      {
          "exerciseID": "exercise:uuid-67890",
          "name": "Push-ups",
          "description": "An effective bodyweight exercise for chest and triceps strength.",
          "category": "category:uuid-12345",
          "tags": ["bodyweight", "strength", "chest"]
      }
  ]
  ```
* **Not Found Response (200 OK):**
  ```json
  []
  ```

#### 2. List All Exercises

* **Concept Query:** `_listExercises (): (exercises: {exerciseID: Exercise, name: String, category: Category}[])`
* **HTTP Method:** `GET`
* **Endpoint:** `/api/exercisecatalog/exercises`
* **Purpose:** Retrieves a list of all exercises with basic information.
* **Request Parameters:** None
* **Success Response (200 OK):**
  ```json
  [
      {
          "exerciseID": "exercise:uuid-67890",
          "name": "Push-ups",
          "category": "category:uuid-12345"
      },
      {
          "exerciseID": "exercise:uuid-abcdef",
          "name": "Squats",
          "category": "category:uuid-12345"
      }
  ]
  ```

#### 3. Search Exercises

* **Concept Query:** `_searchExercises (query: String, category?: Category, tags?: set of String): (exercises: {exerciseID: Exercise, name: String, category: Category}[])`
* **HTTP Method:** `GET`
* **Endpoint:** `/api/exercisecatalog/exercises/search`
* **Purpose:** Searches exercises by name or description, with optional filtering by category and tags.
* **Query Parameters:**
  * `query` (String, required): Text to search in exercise `name` or `description`.
  * `category` (Category, optional): Filter by a specific category ID.
  * `tags` (String, optional): Comma-separated list of tags to filter by (e.g., `tags=bodyweight,strength`).
* **Example Request:** `GET /api/exercisecatalog/exercises/search?query=push&category=category:uuid-12345&tags=strength`
* **Success Response (200 OK):**
  ```json
  [
      {
          "exerciseID": "exercise:uuid-67890",
          "name": "Push-ups",
          "category": "category:uuid-12345"
      }
  ]
  ```

#### 4. Get All Categories

* **Concept Query:** `_getCategories (): (categories: {categoryID: Category, name: String}[])`
* **HTTP Method:** `GET`
* **Endpoint:** `/api/exercisecatalog/categories`
* **Purpose:** Retrieves a list of all defined exercise categories.
* **Request Parameters:** None
* **Success Response (200 OK):**
  ```json
  [
      {
          "categoryID": "category:uuid-12345",
          "name": "Cardio"
      },
      {
          "categoryID": "category:uuid-67890",
          "name": "Strength"
      }
  ]
  ```

***

## Starting the Backend

To start the backend server for your concepts, execute the following command in your console:

```bash
deno task concepts
```

### Expected Server Output:

Once executed, the Deno server will start and typically report the URL it's listening on. You should see output similar to this:

```
# Example .env file content (replace with your MongoDB connection string)
# MONGO_URI=mongodb://localhost:27017/my_concepts_db
# 
# If running without .env, ensure MONGO_URI is set in your environment.

Task concepts deno run --allow-net --allow-read --allow-sys --allow-env src/concept_server.ts --port 8000 --baseUrl /api
listening on http://localhost:8000/
```

**Note the URL:** `http://localhost:8000` is the base URL for accessing your API. All the endpoints described above would be relative to this base URL (e.g., `http://localhost:8000/api/exercisecatalog/categories`).

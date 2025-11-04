---
timestamp: 'Mon Nov 03 2025 21:30:30 GMT-0500 (Eastern Standard Time)'
parent: '[[..\20251103_213030.7767b0c5.md]]'
content_id: 14abfb6be23dadfd558b76fc0fa4811fd393ab9cb6f485dc290d739f19781dcf
---

# response:

This document describes a lightweight TypeScript DSL for defining "synchronizations," which are essentially declarative rules that define cause-and-effect relationships within an application. These synchronizations connect actions and queries on "concepts" (the building blocks of your application logic) to create reactive behavior.

Here's a breakdown of the key concepts and how to implement synchronizations:

## 1. What are Synchronizations?

* **Declarative Rules:** Synchronizations are a direct mapping from a specification language (`.sync`) into a TypeScript DSL. They define "when X happens, and Y is true, then Z should happen."
* **Independent:** Each synchronization (`.sync.ts` file) is declared independently.
* **Location:** Files named `filename.sync.ts` are placed under `src/syncs/`.
* **Imports:** Use `@engine` for core sync utilities (`actions`, `Sync`, `Frames`) and `@concepts` to import your application's defined concepts.

## 2. Basic Structure of a Synchronization

Each synchronization is an exported `const` function that returns an object with `when`, `then`, and optionally `where` clauses.

```typescript
export const MySync: Sync = ({ /* variables */ }) => ({
    when: actions(
        // [Concept.action, inputPattern, outputPattern]
    ),
    where: async (frames) => {
        // Filter and enrich frames
    },
    then: actions(
        // [Concept.action, inputPattern]
    ),
});
```

### Key Components:

* **`Sync` Type:** `Sync` is a type imported from `@engine` that ensures the correct structure.
* **Variables:** Declared by destructuring the function's input (e.g., `({ count, user })`). These variables become `Symbol`s within the synchronization logic and are used to bind values from actions or queries.
* **`actions` Helper:** A utility from `@engine` that simplifies defining action patterns for `when` and `then` clauses.

## 3. The `when` Clause

* **Triggering Events:** Specifies the action patterns that must occur (or have occurred in the causal `flow`) for the synchronization to activate.
* **Syntax:** An array of `[Concept.action, inputPattern, outputPattern]`.
  * `Concept.action`: The specific action being matched (e.g., `Button.clicked`).
  * `inputPattern`: An object matching the input parameters of the action (e.g., `{ kind: "increment_counter", user }`). Parameters not specified are ignored.
  * `outputPattern`: An object matching the output parameters of the action (e.g., `{ request }`).
* **Multiple `when` Actions:** When multiple actions are specified, they must all match within the same **flow** (a direct causal chain of actions). This is crucial for handling request-response patterns.
* **Flow Semantics:** The engine preserves "flow" as actions with direct causal relation, allowing you to match a request to its corresponding response actions.

## 4. The `then` Clause

* **Resulting Actions:** Specifies the actions to be executed when the `when` and `where` conditions are met.
* **Syntax:** An array of `[Concept.action, inputPattern]`.
  * `Concept.action`: The action to be invoked.
  * `inputPattern`: An object defining the parameters for the action. These parameters can use variables bound in the `when` or `where` clauses (e.g., `{ message: "Reached 10", to: user }`).
* **Iteration:** If the `where` clause produces multiple "frames," the `then` clause actions will fire once for *each* frame, with the specific bindings of that frame.

## 5. The `where` Clause (Optional)

* **Filtering and Enriching Frames:** A powerful clause for querying concept state, filtering matches, and adding new bindings to the "frames."
* **`async` Function:** It's an `async` function that takes `Frames` (an array-like object representing the current set of bindings) and returns `Frames`.
* **`Frames` Object:**
  * An extension of `Array`, so all standard array methods (`map`, `filter`, etc.) can be used.
  * Each `Frame` is `Record<symbol, unknown>`, where `symbol` is the variable name. Access values using `$[variable]` (e.g., `$[count]`).
* **`frames.query()` Method:**
  * `await frames.query(Concept._query, inputPattern, outputPattern)`:
    * **`await` is crucial:** Queries are asynchronous.
    * `Concept._query`: The specific query function (e.g., `Counter._getCount`).
    * `inputPattern`: Matches input parameters to the query, using existing frame bindings (e.g., `{ target: post }`).
    * `outputPattern`: Binds the query's output to new variables in the frames (e.g., `{ count }` to bind the output `count` to the `count` variable).
  * **Iteration from Queries:** Queries can return *multiple* results. `frames.query` will generate a new frame for each result, effectively providing iteration.
* **`frames.filter()` Method:** Used to apply custom logic to filter frames based on their bound values.
* **`frames.collectAs()` Method:**
  * `frames.collectAs([variables_to_collect], as_variable)`:
  * Collects specified variables from multiple frames into an array of objects.
  * Groups these collected results by any *uncollected* variables, creating a new `as_variable` binding in the resulting frame(s).
  * Useful for aggregating results for a single response object (e.g., a JSON array).

## 6. Pattern Matching Details

* **Partial Matching:** You only need to specify the parameters you care about in your patterns. Omitted parameters are ignored.
* **Aliasing:** You can alias parameter names to different variable names (e.g., `author: user` means the `author` parameter takes the value of the `user` variable).
* **Mutual Exclusivity:** For output patterns (e.g., `(question)` vs. `(error)`), you generally need separate synchronizations to match on mutually exclusive outcomes, as a single pattern will try to match *all* specified outputs.

## 7. Common Pitfalls

* **Zero Matches in `where`:** If a `where` clause results in `frames.length === 0`, the `then` clause will *not* fire.
  * **Solution:** Explicitly check for empty frames and return a default `Frames` object with necessary bindings if a response is always expected (e.g., an empty array for results). Remember to preserve the `originalFrame` for the `then` clause.
* **Missing `actionId` in `then` Clause:**
  * Occurs if the `where` function doesn't correctly return a set of `Frames` (e.g., forgetting `async` or `await`, or losing original bindings when creating new frames).
  * Ensure all `frames.query` calls are `await`ed.
  * If constructing a new frame, ensure all necessary bindings for the `then` clause are present.
* **Incorrect Patterns:** The most common debugging issue. Always verify that your `inputPattern` and `outputPattern` match the concept's action/query specifications exactly, including parameter names and types.
* **`Requesting.respond` expects flat returns:** Do not use nested objects in the `then` clause for `Requesting.respond`. If complex objects are needed, formulate them in the `where` clause (e.g., as JSON strings) and bind them to a single variable.

In essence, synchronizations provide a powerful, declarative, and event-driven way to orchestrate complex logic by defining how concepts react to each other's actions and state changes, with robust support for querying, filtering, and data transformation using `Frames`.

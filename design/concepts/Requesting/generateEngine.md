[@syncs](syncs.md)
[@architecture](../../background/implementing-synchronizations.md)
[@syncsRead](src/syncs/README.md)
[@api](api-specification.md)

# prompt: Generate src/syncs/progression.sync.ts with request/response syncs for updateProgression createProgressionRule
# response:

Okay, here are the TypeScript synchronization files for `updateProgressionRule` and `createProgressionRule`, following the request/response pattern as described in the documentation.

First, let's assume your `Progression` concept and the `Requesting` concept are structured something like this (you'd adjust based on your actual concept definitions):

```typescript
// src/concepts/progression.ts (Conceptual representation for these syncs)
export const Progression = {
  // Actions
  createProgressionRule: Symbol("Progression.createProgressionRule"),
  updateProgressionRule: Symbol("Progression.updateProgressionRule"),
};

// src/concepts/requesting.ts (Conceptual representation)
export const Requesting = {
  request: Symbol("Requesting.request"),
  respond: Symbol("Requesting.respond"),
};

// And the generated @concepts import would include them:
// export * as Progression from "./progression.ts";
// export * as Requesting from "./requesting.ts";
```

---

### `src/syncs/progression/createProgressionRule.sync.ts`

This file handles the creation of a new progression rule.

```typescript
// src/syncs/progression/createProgressionRule.sync.ts

import { actions, Sync } from "@engine";
import { Progression, Requesting } from "@concepts"; // Assuming these are defined and available

/**
 * Synchronization: CreateProgressionRuleRequest
 * Description: Triggers the Progression.createProgressionRule action when a matching HTTP request comes in.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules", name, description, stages) : (request)
 * then
 *   Progression.createProgressionRule (name, description, stages)
 */
export const CreateProgressionRuleRequest: Sync = ({
  request,
  name,
  description,
  stages,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/progression/rules", name, description, stages },
    { request },
  ]),
  then: actions([Progression.createProgressionRule, { name, description, stages }]),
});

/**
 * Synchronization: CreateProgressionRuleResponse
 * Description: Responds to the original request when Progression.createProgressionRule completes successfully.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules") : (request)
 *   Progression.createProgressionRule () : (rule)
 * then
 *   Requesting.respond (request, rule)
 */
export const CreateProgressionRuleResponse: Sync = ({ request, rule }) => ({
  when: actions(
    [Requesting.request, { path: "/progression/rules" }, { request }],
    [Progression.createProgressionRule, {}, { rule }], // rule is the successful output
  ),
  then: actions([Requesting.respond, { request, rule }]),
});

/**
 * Synchronization: CreateProgressionRuleResponseError
 * Description: Responds to the original request with an error if Progression.createProgressionRule fails.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules") : (request)
 *   Progression.createProgressionRule () : (error)
 * then
 *   Requesting.respond (request, error)
 */
export const CreateProgressionRuleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/progression/rules" }, { request }],
    [Progression.createProgressionRule, {}, { error }], // error is the failure output
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```

---

### `src/syncs/progression/updateProgressionRule.sync.ts`

This file handles updating an existing progression rule.

```typescript
// src/syncs/progression/updateProgressionRule.sync.ts

import { actions, Sync } from "@engine";
import { Progression, Requesting } from "@concepts"; // Assuming these are defined and available

/**
 * Synchronization: UpdateProgressionRuleRequest
 * Description: Triggers the Progression.updateProgressionRule action when a matching HTTP request comes in.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules/:ruleId", rule, name?, description?, stages?) : (request)
 * then
 *   Progression.updateProgressionRule (rule, name, description, stages)
 *
 * Note: Assumes `rule` (ruleId) is extracted from the path by the Requesting concept.
 *       name, description, stages are optional update fields.
 */
export const UpdateProgressionRuleRequest: Sync = ({
  request,
  rule, // Assumed to be extracted from path, e.g., by middleware
  name,
  description,
  stages,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/progression/rules/:ruleId", rule, name, description, stages },
    { request },
  ]),
  then: actions([Progression.updateProgressionRule, { rule, name, description, stages }]),
});

/**
 * Synchronization: UpdateProgressionRuleResponse
 * Description: Responds to the original request when Progression.updateProgressionRule completes successfully.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules/:ruleId") : (request)
 *   Progression.updateProgressionRule () : (updatedRule)
 * then
 *   Requesting.respond (request, updatedRule)
 */
export const UpdateProgressionRuleResponse: Sync = ({ request, updatedRule }) => ({
  when: actions(
    [Requesting.request, { path: "/progression/rules/:ruleId" }, { request }],
    [Progression.updateProgressionRule, {}, { updatedRule }], // updatedRule is the successful output
  ),
  then: actions([Requesting.respond, { request, updatedRule }]),
});

/**
 * Synchronization: UpdateProgressionRuleResponseError
 * Description: Responds to the original request with an error if Progression.updateProgressionRule fails.
 *
 * Specification:
 * when
 *   Requesting.request (path: "/progression/rules/:ruleId") : (request)
 *   Progression.updateProgressionRule () : (error)
 * then
 *   Requesting.respond (request, error)
 */
export const UpdateProgressionRuleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/progression/rules/:ruleId" }, { request }],
    [Progression.updateProgressionRule, {}, { error }], // error is the failure output
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```

---

**Explanation of Design Choices:**

1.  **File Naming and Structure:** `src/syncs/progression/createProgressionRule.sync.ts` and `src/syncs/progression/updateProgressionRule.sync.ts` follow the recommended naming convention and are grouped under a `progression` directory for organization.
2.  **Imports:** `@engine` provides `actions` and `Sync`. `@concepts` provides `Progression` and `Requesting`.
3.  **Variable Destructuring:** Each `Sync` function destructures the variables it needs (`request`, `name`, `description`, `stages`, `rule`, `updatedRule`, `error`). These variables are then used as symbols in the `actions` patterns.
4.  **Request Handlers (`...Request`):**
    *   They match on a `Requesting.request` with a specific `path` (e.g., `/progression/rules` for creation, `/progression/rules/:ruleId` for update).
    *   Input parameters (`name`, `description`, `stages`, `rule`) are extracted from the request's payload/path.
    *   The output of `Requesting.request` (`request`) is captured to bind the `request` variable.
    *   The `then` clause directly calls the corresponding `Progression` action (`createProgressionRule` or `updateProgressionRule`) with the extracted parameters.
5.  **Success Responses (`...Response`):**
    *   They use multiple `when` clauses to match both the original `Requesting.request` (identified by `path` and captured `request` variable) AND the successful completion of the `Progression` action.
    *   The successful output of the `Progression` action (`rule` for creation, `updatedRule` for update) is captured.
    *   The `then` clause calls `Requesting.respond` using the captured `request` and the successful output.
6.  **Error Responses (`...ResponseError`):**
    *   Similar to success responses, they match the original `Requesting.request` AND the failure of the `Progression` action.
    *   The `error` output of the `Progression` action is captured.
    *   The `then` clause calls `Requesting.respond` with the captured `request` and the `error`.
7.  **Optional Parameters for Update:** For `updateProgressionRule`, `name`, `description`, and `stages` are considered optional. If these variables are `undefined` in the incoming request, they simply won't be part of the pattern, and the `Progression.updateProgressionRule` action will be called without them, implicitly handled by the concept's action definition.
8.  **`rule` for Update:** It's assumed that the `rule` (ID) for updating is provided in the request path (e.g., `/progression/rules/rule_id_123`) and extracted by the `Requesting` concept or some middleware before the synchronization engine processes the `Requesting.request`.
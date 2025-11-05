# PlateMate Final Design Document

## Overview

PlateMate is a fitness tracking application built using concept design principles. The system consists of five core concepts: **WorkoutTracking**, **ProgressionEngine**, **RoutinePlanner**, **UserManagement**, and **ExerciseCatalog**, orchestrated through synchronizations to deliver intelligent workout tracking, automatic progression suggestions, and balanced routine planning.

---

## Major Changes from Assignment 2 (Initial Concept Design)

### 1. Enhanced Data Validation and Error Handling

**Original Design**: Basic pre/post conditions specified in concept actions.

**Final Implementation**:
- Comprehensive input validation across all concepts
- Parameter existence checks, range validation, and format validation
- Descriptive error messages for validation failures
- Generic error messages for security-sensitive operations
- Date format validation using ISO standards
- Session existence validation before exercise recording

**Impact**: Improved data integrity and user experience with clear feedback.

### 2. Extended Functionality Beyond Specifications

**Original Design**: Minimal action sets focused on core functionality.

**Final Implementation**:
- **Helper Actions**: `createProgressionRule` (ProgressionEngine), `setDefaultTemplate` (RoutinePlanner)
- **Debug Queries**: `_getUserSessions`, `_getSessionRecords`, `_getUserRecords` (WorkoutTracking)
- **Session Management**: `getSessionInfo`, `deleteSession`, `removeWorkoutSession` (WorkoutTracking)
- **Enhanced Retrieval**: `getUser` with full preference data (UserManagement)
- **Partial Updates**: `updatePreferences` supports individual field updates

**Rationale**: Support for testing, debugging, and future extensibility.

### 3. Improved Data Structure Design

**Original Design**: Basic state modeling with minimal metadata.

**Final Implementation**:
- **Temporal Tracking**: Added `recordedAt` timestamps to ExerciseRecordDoc for proper ordering
- **Normalization**: Separated user data from preferences into distinct collections (UserManagement)
- **Session Metadata**: Added human-readable `name` field to WorkoutSessionDoc
- **Enhanced Aggregation**: Improved MongoDB aggregation pipelines for efficient data retrieval
- **Flexible Metadata**: ExerciseCatalog supports multiple muscle groups per exercise

**Impact**: Better data modeling enables sophisticated queries and features.

### 4. Advanced Algorithm Implementation

**Original Design**: Simple progression and balance detection logic.

**Final Implementation**:

**ProgressionEngine**:
- Multi-factor progression algorithm considering session count, target thresholds, and performance
- Deload detection based on configurable percentage thresholds (default 15%)
- First-time exercise handling with baseline establishment
- Descriptive reasoning for each weight suggestion

**RoutinePlanner**:
- Statistical balance analysis comparing each muscle group against average volume
- Configurable imbalance threshold (currently 50% of average)
- Monday-based week calculation for consistent volume tracking
- Volume calculation: `sets × reps × weight` with automatic accumulation

**ExerciseCatalog**:
- Multi-field search across name, movement pattern, and equipment
- Case-insensitive regex queries with `$or` operator
- Flexible filtering by muscle group

**Impact**: More intelligent algorithms provide better user experience and safety.

### 5. Database Query Optimization

**Original Design**: Basic state queries specified.

**Final Implementation**:
- MongoDB aggregation pipelines with `$lookup` for efficient joins
- Proper sorting by both session date and recorded timestamp
- Limit parameters for history queries to manage performance
- Indexing considerations documented for frequently queried fields

**Example**: `getLastWeight` and `getWorkoutHistory` use complex aggregation to join workoutSessions and exerciseRecords collections efficiently.

---

## Major Changes from Assignment 4b (Visual Design Phase)

### 1. Enhanced Session Management for Frontend

**Original Design**: Sessions identified only by ID and date.

**Final Implementation**:
- **Human-Readable Names**: `startSession` now generates and returns session names (e.g., "Monday Oct 12, 2024 at 2:30 PM")
- **Session Information Endpoint**: `getSessionInfo` retrieves complete session details for UI display
- **Name Generation**: Automatic formatting using date and time for user-friendly identification

**Rationale**: Frontend needs recognizable session names for display and navigation.

### 2. Session Deletion Capabilities

**Original Design**: No deletion functionality specified.

**Final Implementation**:
- **Multiple Deletion Methods**: 
  - `deleteSession`: Standard deletion removing session and all exercise records
  - `removeWorkoutSession`: With user ownership validation
  - `removeWorkoutSessionRobust`: Comprehensive error handling and verification
- **Cascading Deletes**: All associated exercise records automatically removed
- **Data Integrity**: Validation ensures only valid sessions can be deleted

**Impact**: Complete CRUD operations enable proper workout session management in the UI.

### 3. Extended Workout Tracking Functionality

**Original Design**: Basic recording and retrieval actions.

**Final Implementation**:
- **Enhanced Return Types**: Actions return both data and error states for better frontend error handling
- **Comprehensive Data Access**: New endpoints for retrieving session details and managing workout data
- **Validation Integration**: All new endpoints include comprehensive validation

**Impact**: Frontend can provide better user experience with complete data access and error handling.

### 4. Requesting Concept Enhancements

**Original Design**: Basic request/response handling.

**Final Implementation**:
- **Request Body Sanitization**: Handles DOM elements, proxy objects, and Trusted Types objects
- **Graceful Error Handling**: Empty JSON bodies, invalid JSON, and timeout scenarios handled
- **Improved Logging**: Detailed request/response logging for debugging
- **Passthrough Route Verification**: Automatic detection of unverified concept action routes

**Impact**: More robust API handling supports frontend integration with various edge cases.

---

## Architecture Decisions

### Synchronization Design
- Concepts remain independent while working together through synchronizations
- ID-based references maintain loose coupling
- Clear integration points through `src/syncs/*.sync.ts` files

### Data Flow
1. **Workout Recording**: `recordExercise` → triggers progression updates and volume tracking
2. **Progression Application**: Weight suggestions calculated from historical data + user preferences
3. **Balance Checking**: Weekly volume tracking enables workout recommendations

### Technology Choices
- **MongoDB**: Flexible document model supports concept state requirements
- **Deno + TypeScript**: Type-safe implementation with modern tooling
- **Hono**: Lightweight web framework for Requesting concept HTTP server

---

## Key Insights from Implementation

1. **MongoDB Aggregation Complexity**: Complex joins required careful pipeline design but enable efficient data retrieval
2. **Progression Algorithm Design**: Multi-factor algorithms require careful consideration of edge cases and user safety
3. **Week Calculation**: Monday-based week boundaries ensure consistency across time zones
4. **Balance Detection**: Statistical approaches require tuning based on user feedback
5. **Error Handling Strategy**: Descriptive messages for validation, generic messages for security

# RoutinePlanner Concept - Design Changes and Issues

## Overview
The RoutinePlanner concept was implemented to manage workout templates and balance muscle group training as specified in Assignment 2. This concept implements the "Balanced Routine Planner" feature of the PlateMate application.

## Changes Made from Assignment 2 Specification

### 1. Enhanced Template Management
- **Added `setDefaultTemplate` action** for managing user template preferences
- **Improved template creation** with better validation and error handling
- **Enhanced template retrieval** with user-specific template filtering
- **Added template ownership** tracking through user associations

### 2. Advanced Volume Tracking
- **Implemented weekly volume calculation** using sets × reps × weight formula
- **Added automatic week calculation** with Monday-based week start logic
- **Enhanced volume accumulation** for multiple exercises in the same week
- **Improved volume querying** with efficient aggregation

### 3. Sophisticated Balance Checking
- **Implemented imbalance detection** based on volume distribution analysis
- **Added configurable imbalance threshold** (currently 50% of average volume)
- **Enhanced balance reporting** with specific muscle group identification
- **Improved balance algorithms** for more accurate recommendations

## Issues Encountered and Resolutions

### 1. Week Calculation Complexity
**Issue**: Determining consistent week boundaries for volume tracking
**Resolution**: Implemented Monday-based week calculation:
- Used JavaScript Date manipulation to find Monday of each week
- Ensured consistent week boundaries across different time zones
- Added validation for date format consistency

### 2. Volume Calculation Accuracy
**Issue**: Accurately calculating and accumulating volume across multiple exercises
**Resolution**: Implemented comprehensive volume tracking:
- Used MongoDB `$inc` operator for atomic volume updates
- Added `$setOnInsert` for initial volume record creation
- Implemented proper volume aggregation across muscle groups

### 3. Template-Exercise Integration
**Issue**: Linking workout templates with exercise metadata for muscle group analysis
**Resolution**: Created simplified muscle group assignment:
- Used placeholder muscle groups for demonstration
- Added comments indicating where ExerciseCatalog integration would occur
- Implemented flexible template structure for future enhancements

### 4. Balance Detection Algorithm
**Issue**: Determining meaningful muscle group imbalances
**Resolution**: Implemented statistical balance analysis:
- Calculate average volume across all muscle groups
- Identify groups with significantly lower volume (configurable threshold)
- Provide actionable imbalance reports

## Technical Implementation Details

### Database Collections
- `RoutinePlanner.workoutTemplates`: Stores workout template definitions
- `RoutinePlanner.userTemplates`: Manages user-template associations and defaults
- `RoutinePlanner.weeklyVolume`: Tracks weekly training volume by muscle group

### Key Features
- **Template Management**: Create, store, and retrieve workout templates
- **Volume Tracking**: Monitor weekly training volume across muscle groups
- **Balance Analysis**: Detect and report muscle group imbalances
- **Smart Suggestions**: Recommend workouts based on training balance

### Balance Detection Algorithm
1. **Volume Collection**: Gather all muscle group volumes for the week
2. **Average Calculation**: Compute average volume across all groups
3. **Imbalance Detection**: Identify groups below threshold (50% of average)
4. **Recommendation Generation**: Suggest focus areas for balanced training

### Testing Results
All tests passed successfully, including:
- Template creation and validation
- Default template management
- Workout suggestion algorithms
- Volume tracking and accumulation
- Balance detection and reporting
- Error handling for invalid inputs

## Future Considerations
1. **ExerciseCatalog Integration**: Link templates with actual exercise metadata
2. **Advanced Balance Algorithms**: More sophisticated imbalance detection
3. **Template Sharing**: Allow users to share templates with others
4. **Periodization**: Implement training periodization features
5. **Recovery Integration**: Consider recovery metrics in balance calculations

## Integration Points
This concept integrates with:
- **WorkoutTracking**: Consumes workout data for volume calculations
- **ExerciseCatalog**: References exercise metadata for muscle group analysis
- **UserManagement**: Uses user IDs for template ownership and preferences
- **ProgressionEngine**: May influence template selection based on progression needs

## Configuration Examples
```typescript
// Example workout template
{
  templateId: "template-123",
  name: "Upper Body Strength",
  exercises: ["bench-press", "pull-ups", "overhead-press"],
  muscleGroups: ["chest", "back", "shoulders"]
}

// Example volume tracking
{
  user: "user-456",
  muscleGroup: "chest",
  weekStart: "2024-01-01",
  volume: 15000 // sets × reps × weight
}
```

## Balance Detection Logic
The balance detection algorithm works by:
1. Collecting all muscle group volumes for a given week
2. Calculating the average volume across all groups
3. Identifying groups with volume below 50% of the average
4. Returning a list of imbalanced muscle groups for user attention

This helps users maintain balanced training and avoid overuse injuries while ensuring comprehensive muscle development.

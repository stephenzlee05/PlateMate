# UserManagement Concept - Design Changes and Issues

## Overview
The UserManagement concept was implemented to manage user accounts and preferences as specified in Assignment 2. This concept provides the foundation for user authentication and personalization features in the PlateMate application.

## Changes Made from Assignment 2 Specification

### 1. Enhanced User Data Structure
- **Separated user data from preferences** into distinct collections for better normalization
- **Added comprehensive user validation** including duplicate username and email checks
- **Implemented referential integrity** between users and preferences collections
- **Enhanced preference management** with partial update capabilities

### 2. Improved Preference Handling
- **Added partial preference updates** allowing users to update individual preference fields
- **Implemented default preference values** for new users (5 lb increment, lbs units, notifications enabled)
- **Enhanced preference validation** with proper error handling
- **Added preference retrieval** with user context

### 3. Extended User Management
- **Added comprehensive user retrieval** with full user and preference data
- **Implemented proper error handling** for non-existent users
- **Enhanced data consistency** through proper collection relationships
- **Added validation for all user operations**

## Issues Encountered and Resolutions

### 1. Data Normalization vs. Denormalization
**Issue**: Deciding between embedding preferences in user documents vs. separate collections
**Resolution**: Chose separate collections for better:
- Data consistency and integrity
- Preference update efficiency
- Future extensibility
- Query performance for preference-specific operations

### 2. Unique Constraint Enforcement
**Issue**: Ensuring username and email uniqueness without database-level constraints
**Resolution**: Implemented application-level uniqueness checks:
- Added explicit queries to check for existing usernames
- Implemented email uniqueness validation
- Provided clear error messages for duplicate entries
- Ensured atomic operations where possible

### 3. Preference Update Complexity
**Issue**: Handling partial preference updates without overwriting existing data
**Resolution**: Implemented selective update mechanism:
- Built update object dynamically based on provided fields
- Used MongoDB `$set` operator for partial updates
- Added validation to ensure at least one field is provided
- Maintained data integrity through proper error handling

### 4. User-Preference Relationship Management
**Issue**: Maintaining referential integrity between users and preferences
**Resolution**: Implemented proper relationship management:
- Created preferences first, then users with preference references
- Added validation to ensure preferences exist before user creation
- Implemented proper cleanup and error handling
- Used consistent ID management across collections

## Technical Implementation Details

### Database Collections
- `UserManagement.users`: Stores user account information
- `UserManagement.userPreferences`: Stores user-specific preferences and settings

### Key Features
- **User Registration**: Create new users with automatic preference initialization
- **Preference Management**: Update individual or multiple preference fields
- **User Retrieval**: Get complete user information including preferences
- **Data Validation**: Comprehensive validation for all user operations

### Default Preferences
New users are automatically assigned default preferences:
- `defaultIncrement`: 5 (5 lb weight increments)
- `units`: "lbs" (pounds as default unit)
- `notifications`: true (notifications enabled by default)

### Testing Results
All tests passed successfully, including:
- User creation with duplicate prevention
- Preference updates (full and partial)
- User retrieval with preference data
- Error handling for invalid operations
- Data consistency validation

## Future Considerations
1. **Authentication Integration**: Add password hashing and authentication tokens
2. **Profile Management**: Extended user profile fields (name, age, goals, etc.)
3. **Privacy Settings**: More granular privacy and notification controls
4. **User Preferences**: Additional preference categories (themes, units, etc.)
5. **Account Recovery**: Password reset and account recovery features

## Integration Points
This concept integrates with:
- **WorkoutTracking**: Provides user IDs for workout session ownership
- **ProgressionEngine**: Supplies user preferences for progression calculations
- **RoutinePlanner**: Uses user IDs for template ownership and volume tracking
- **ExerciseCatalog**: May use user preferences for exercise recommendations

## Data Flow Examples
```typescript
// User creation flow
1. Validate username and email uniqueness
2. Create user preferences with defaults
3. Create user record with preference reference
4. Return user ID

// Preference update flow
1. Validate user exists
2. Build partial update object
3. Update preferences collection
4. Return success/error status
```

## Security Considerations
1. **Input Validation**: All user inputs are validated and sanitized
2. **Error Messages**: Generic error messages to prevent information leakage
3. **Data Consistency**: Proper transaction handling for related operations
4. **Future Authentication**: Prepared for password hashing and token management

## Configuration Examples
```typescript
// Default user preferences
{
  userId: "user-123",
  defaultIncrement: 5,
  units: "lbs",
  notifications: true
}

// User document structure
{
  userId: "user-123",
  username: "fitness_enthusiast",
  email: "user@example.com",
  preferences: "pref-123" // Reference to preferences collection
}
```

## Error Handling
The concept implements comprehensive error handling for:
- Duplicate username/email prevention
- Invalid user ID references
- Missing preference data
- Partial update validation
- Data consistency issues

This ensures robust user management with clear error reporting and data integrity maintenance.

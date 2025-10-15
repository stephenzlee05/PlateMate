# UserManagement Specification

## Concept Overview

**Purpose**: manage user accounts and preferences

**Principle**: each user has unique identity and customizable settings

## State

- **Users**: a set with
  - userId: String
  - username: String
  - email: String
  - preferences: String (reference to UserPreferences)

- **UserPreferences**: a set with
  - preferencesId: String
  - userId: User
  - defaultIncrement: Number
  - units: String
  - notifications: Boolean

## Actions

### createUser
```typescript
createUser(username: string, email: string): string
```
- **Requires**: username and email are unique
- **Effect**: creates new user
- **Returns**: userId

### getUser
```typescript
getUser(userId: string): { userId: string; username: string; email: string } | null
```
- **Effect**: returns user basic info if exists
- **Returns**: user basic info or null

### getUserPreferencesId
```typescript
getUserPreferencesId(userId: string): string | null
```
- **Effect**: returns preferences ID if user exists
- **Returns**: preferencesId or null

### createDefaultPreferences
```typescript
createDefaultPreferences(userId: string): string
```
- **Effect**: creates new user preferences with defaults
- **Returns**: preferencesId

### updatePreferences
```typescript
updatePreferences(preferencesId: string, preferences: { defaultIncrement?: number; units?: string; notifications?: boolean }): void
```
- **Requires**: preferences exist
- **Effect**: updates user preferences

### getPreferences
```typescript
getPreferences(preferencesId: string): { defaultIncrement: number; units: string; notifications: boolean } | null
```
- **Effect**: returns preferences if exists
- **Returns**: preferences object or null

### getPreferencesByUser
```typescript
getPreferencesByUser(userId: string): string | null
```
- **Effect**: returns preferences ID if exists
- **Returns**: preferencesId or null

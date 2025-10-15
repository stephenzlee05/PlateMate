---
timestamp: 'Sun Oct 12 2025 23:05:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251012_230522.2fb1fc5b.md]]'
content_id: 423039503857c5ddd72f1fd2398dddd622329ceef9a4707a04cd36996728b663
---

# response:

```typescript
// file: src/UserManagement/UserManagementConcept.ts
import { Collection, Db, FindOptions, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * Concept: UserManagement
 * Purpose: manage user accounts and preferences
 * Principle: each user has unique identity and customizable settings
 */

// Declare collection prefix, use concept name
const PREFIX = "UserManagement" + ".";

// Generic types of this concept (none explicitly defined in the spec as type parameters, but IDs are generic)
type UserId = ID;
type UserPreferencesId = ID;

/**
 * State: Users
 * a set with
 *   userId: String
 *   username: String
 *   email: String
 *   preferences: String (reference to UserPreferences)
 */
interface UserDocument {
  _id: UserId; // The actual userId
  username: string;
  email: string;
  preferencesId: UserPreferencesId; // Reference to UserPreferences
}

/**
 * State: UserPreferences
 * a set with
 *   preferencesId: String
 *   userId: User
 *   defaultIncrement: Number
 *   units: String
 *   notifications: Boolean
 */
interface UserPreferencesDocument {
  _id: UserPreferencesId; // The actual preferencesId
  userId: UserId;
  defaultIncrement: number;
  units: string;
  notifications: boolean;
}

// Interface for User basic info to be returned by getUser
interface UserInfo {
  userId: UserId;
  username: string;
  email: string;
}

// Default values for new user preferences
const DEFAULT_PREFERENCES = {
  defaultIncrement: 1,
  units: "metric", // Or "imperial", "standard"
  notifications: true,
};

export default class UserManagementConcept {
  private users: Collection<UserDocument>;
  private userPreferences: Collection<UserPreferencesDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.userPreferences = this.db.collection(PREFIX + "userPreferences");
  }

  /**
   * createUser(username: string, email: string): { userId: UserId } | { error: string }
   *
   * **requires** username and email are unique
   *
   * **effects** creates new user and associated default preferences; links user to preferences; returns userId
   */
  async createUser({
    username,
    email,
  }: {
    username: string;
    email: string;
  }): Promise<{ userId: UserId } | { error: string }> {
    // Check uniqueness for username
    const existingUserByUsername = await this.users.findOne({ username });
    if (existingUserByUsername) {
      return { error: "Username already exists" };
    }

    // Check uniqueness for email
    const existingUserByEmail = await this.users.findOne({ email });
    if (existingUserByEmail) {
      return { error: "Email already exists" };
    }

    const newUserId = freshID() as UserId;
    const newUserPreferencesId = freshID() as UserPreferencesId;

    // Create default preferences for the new user
    await this.userPreferences.insertOne({
      _id: newUserPreferencesId,
      userId: newUserId,
      ...DEFAULT_PREFERENCES,
    });

    // Create the new user, linking to the preferences
    await this.users.insertOne({
      _id: newUserId,
      username,
      email,
      preferencesId: newUserPreferencesId,
    });

    return { userId: newUserId };
  }

  /**
   * getUser(userId: UserId): UserInfo | null
   *
   * **effects** returns user basic info if exists
   *
   * **returns** user basic info or null
   */
  async getUser({
    userId,
  }: {
    userId: UserId;
  }): Promise<UserInfo | null> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return null;
    }
    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * getUserPreferencesId(userId: UserId): { preferencesId: UserPreferencesId } | null
   *
   * **effects** returns preferences ID if user exists
   *
   * **returns** preferencesId or null
   */
  async getUserPreferencesId({
    userId,
  }: {
    userId: UserId;
  }): Promise<{ preferencesId: UserPreferencesId } | null> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return null;
    }
    return { preferencesId: user.preferencesId };
  }

  /**
   * createDefaultPreferences(userId: UserId): { preferencesId: UserPreferencesId } | { error: string }
   *
   * **effects** creates new user preferences with defaults for the given userId; returns preferencesId
   *             (Note: This does not update the user's reference to preferences, only creates new preferences.)
   *
   * **returns** preferencesId or error if user does not exist
   */
  async createDefaultPreferences({
    userId,
  }: {
    userId: UserId;
  }): Promise<{ preferencesId: UserPreferencesId } | { error: string }> {
    const userExists = await this.users.findOne({ _id: userId });
    if (!userExists) {
      return { error: "User does not exist" };
    }

    const newPreferencesId = freshID() as UserPreferencesId;

    await this.userPreferences.insertOne({
      _id: newPreferencesId,
      userId: userId,
      ...DEFAULT_PREFERENCES,
    });

    return { preferencesId: newPreferencesId };
  }

  /**
   * updatePreferences(preferencesId: UserPreferencesId, preferences: { defaultIncrement?: number; units?: string; notifications?: boolean }): Empty | { error: string }
   *
   * **requires** preferences exist
   *
   * **effects** updates user preferences
   *
   * **returns** Empty on success or error object
   */
  async updatePreferences(
    { preferencesId, preferences }: {
      preferencesId: UserPreferencesId;
      preferences: {
        defaultIncrement?: number;
        units?: string;
        notifications?: boolean;
      };
    },
  ): Promise<Empty | { error: string }> {
    const result = await this.userPreferences.updateOne(
      { _id: preferencesId },
      { $set: preferences },
    );

    if (result.matchedCount === 0) {
      return { error: "User preferences not found" };
    }

    return {};
  }

  /**
   * getPreferences(preferencesId: UserPreferencesId): UserPreferencesDocument | null
   *
   * **effects** returns preferences if exists
   *
   * **returns** preferences object or null
   */
  async getPreferences({
    preferencesId,
  }: {
    preferencesId: UserPreferencesId;
  }): Promise<
    { defaultIncrement: number; units: string; notifications: boolean } | null
  > {
    const prefs = await this.userPreferences.findOne({ _id: preferencesId });
    if (!prefs) {
      return null;
    }
    // Return only the specified fields, excluding _id and userId
    return {
      defaultIncrement: prefs.defaultIncrement,
      units: prefs.units,
      notifications: prefs.notifications,
    };
  }

  /**
   * getPreferencesByUser(userId: UserId): { preferencesId: UserPreferencesId } | null
   *
   * **effects** returns preferences ID if user exists
   *
   * **returns** preferencesId or null
   */
  async getPreferencesByUser({
    userId,
  }: {
    userId: UserId;
  }): Promise<{ preferencesId: UserPreferencesId } | null> {
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return null;
    }
    return { preferencesId: user.preferencesId };
  }
}
```

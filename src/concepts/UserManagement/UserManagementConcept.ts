import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "UserManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID;

// Internal entity types, represented as IDs
type UserId = ID;
type PreferencesId = ID;

/**
 * State: A set of Users with userId, username, email, and preferences.
 */
interface UserDoc {
  userId: UserId;
  username: string;
  email: string;
  preferences: UserId; // Reference to UserPreferences
}

/**
 * State: A set of UserPreferences with default settings.
 */
interface UserPreferencesDoc {
  preferencesId: PreferencesId;
  userId: User;
  defaultIncrement: number;
  units: string;
  notifications: boolean;
}


/**
 * @concept UserManagement
 * @purpose Manage user accounts and preferences
 */
export default class UserManagementConcept {
  users: Collection<UserDoc>;
  userPreferences: Collection<UserPreferencesDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.userPreferences = this.db.collection(PREFIX + "userPreferences");
  }

  /**
   * Action: Creates a new user with default preferences.
   * @requires username and email are unique
   * @effects creates new user and default preferences
   */
  async createUser({ username, email }: { username: string; email: string }): Promise<{ userId: UserId } | { error: string }> {
    // Check if username already exists
    const existingUserByUsername = await this.users.findOne({ username });
    if (existingUserByUsername) {
      return { error: `Username '${username}' already exists` };
    }

    // Check if email already exists
    const existingUserByEmail = await this.users.findOne({ email });
    if (existingUserByEmail) {
      return { error: `Email '${email}' already exists` };
    }

    const userId = freshID() as UserId;
    const preferencesId = freshID() as PreferencesId;

    // Create user preferences first
    await this.userPreferences.insertOne({
      preferencesId,
      userId,
      defaultIncrement: 5, // Default 5 lb increment
      units: "lbs", // Default to pounds
      notifications: true
    });

    // Create user
    await this.users.insertOne({
      userId,
      username,
      email,
      preferences: preferencesId
    });

    return { userId };
  }


  /**
   * Action: Gets user basic information with preferences.
   * @effects returns user info with preferences if exists
   */
  async getUser({ userId }: { userId: User }): Promise<{ 
    user: { 
      userId: UserId; 
      username: string; 
      email: string; 
      preferences: { 
        defaultIncrement: number; 
        units: string; 
        notifications: boolean; 
      } 
    } 
  } | { error: string }> {
    const user = await this.users.findOne({ userId });
    if (!user) {
      return { error: `User with ID ${userId} not found` };
    }

    // Get user preferences
    const preferences = await this.userPreferences.findOne({ userId });
    if (!preferences) {
      return { error: `Preferences not found for user ${userId}` };
    }

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        preferences: {
          defaultIncrement: preferences.defaultIncrement,
          units: preferences.units,
          notifications: preferences.notifications
        }
      }
    };
  }

  /**
   * Action: Gets user's preferences ID.
   * @effects returns preferences ID if user exists
   */
  async getUserPreferencesId({ userId }: { userId: User }): Promise<{ preferencesId: UserId } | { error: string }> {
    const user = await this.users.findOne({ userId });
    if (!user) {
      return { error: `User with ID ${userId} not found` };
    }

    return { preferencesId: user.preferences };
  }


  /**
   * Action: Creates default preferences for a new user.
   * @effects creates new user preferences with defaults
   */
  async createDefaultPreferences({ userId }: { userId: User }): Promise<{ preferencesId: PreferencesId } | { error: string }> {
    if (!userId) {
      return { error: "User ID is required" };
    }

    // Check if preferences already exist for this user
    const existingPreferences = await this.userPreferences.findOne({ userId });
    if (existingPreferences) {
      return { error: `Preferences already exist for user ${userId}` };
    }

    const preferencesId = freshID() as PreferencesId;

    await this.userPreferences.insertOne({
      preferencesId,
      userId,
      defaultIncrement: 5, // Default 5 lb increment
      units: "lbs", // Default to pounds
      notifications: true
    });

    return { preferencesId };
  }

  /**
   * Action: Updates user preferences by userId.
   * @requires user exists
   * @effects updates user preferences
   */
  async updatePreferences({ 
    userId, 
    preferences 
  }: { 
    userId: User; 
    preferences: { defaultIncrement?: number; units?: string; notifications?: boolean } 
  }): Promise<Empty | { error: string }> {
    if (!userId) {
      return { error: "User ID is required" };
    }

    const updateData: Partial<UserPreferencesDoc> = {};
    if (preferences.defaultIncrement !== undefined) {
      updateData.defaultIncrement = preferences.defaultIncrement;
    }
    if (preferences.units !== undefined) {
      updateData.units = preferences.units;
    }
    if (preferences.notifications !== undefined) {
      updateData.notifications = preferences.notifications;
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "No valid preferences provided to update" };
    }

    const result = await this.userPreferences.updateOne(
      { userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return { error: "User preferences not found" };
    }

    return {};
  }

  /**
   * Action: Updates user preferences by preferencesId.
   * @requires preferences exist
   * @effects updates user preferences
   */
  async updatePreferencesById({ 
    preferencesId, 
    preferences 
  }: { 
    preferencesId: PreferencesId; 
    preferences: { defaultIncrement?: number; units?: string; notifications?: boolean } 
  }): Promise<Empty | { error: string }> {
    if (!preferencesId) {
      return { error: "Preferences ID is required" };
    }

    const updateData: Partial<UserPreferencesDoc> = {};
    if (preferences.defaultIncrement !== undefined) {
      updateData.defaultIncrement = preferences.defaultIncrement;
    }
    if (preferences.units !== undefined) {
      updateData.units = preferences.units;
    }
    if (preferences.notifications !== undefined) {
      updateData.notifications = preferences.notifications;
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "No valid preferences provided to update" };
    }

    const result = await this.userPreferences.updateOne(
      { preferencesId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return { error: "User preferences not found" };
    }

    return {};
  }

  /**
   * Action: Gets user preferences by ID.
   * @effects returns preferences if exists
   */
  async getPreferences({ preferencesId }: { preferencesId: PreferencesId }): Promise<{ 
    defaultIncrement: number; 
    units: string; 
    notifications: boolean; 
  } | { error: string }> {
    if (!preferencesId) {
      return { error: "Preferences ID is required" };
    }

    const preferences = await this.userPreferences.findOne({ preferencesId });
    if (!preferences) {
      return { error: `Preferences with ID ${preferencesId} not found` };
    }

    return {
      defaultIncrement: preferences.defaultIncrement,
      units: preferences.units,
      notifications: preferences.notifications
    };
  }

  /**
   * Action: Gets user preferences by user ID.
   * @effects returns preferences ID if exists
   */
  async getPreferencesByUser({ userId }: { userId: User }): Promise<{ preferencesId: PreferencesId } | { error: string }> {
    if (!userId) {
      return { error: "User ID is required" };
    }

    const preferences = await this.userPreferences.findOne({ userId });
    if (!preferences) {
      return { error: `Preferences not found for user ${userId}` };
    }

    return { preferencesId: preferences.preferencesId };
  }

  /**
   * Query: Gets all users.
   */
  async _getAllUsers(): Promise<UserDoc[]> {
    return await this.users.find({}).toArray();
  }

  /**
   * Query: Gets all user preferences.
   */
  async _getAllPreferences(): Promise<UserPreferencesDoc[]> {
    return await this.userPreferences.find({}).toArray();
  }

  /**
   * Query: Gets preferences for a specific user.
   */
  async _getUserPreferences({ userId }: { userId: User }): Promise<UserPreferencesDoc[]> {
    const preferences = await this.userPreferences.findOne({ userId });
    return preferences ? [preferences] : [];
  }
}

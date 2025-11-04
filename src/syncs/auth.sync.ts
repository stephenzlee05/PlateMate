/**
 * Authentication synchronizations
 * 
 * This file is currently empty. User validation is handled inline
 * in the where clauses of request syncs in other files (users.sync.ts,
 * workouts.sync.ts, etc.).
 * 
 * If you need a reusable authentication sync in the future, you can
 * add it here. Note that syncs matching on UserManagement.getUser
 * must have a then clause, or they will cause errors when getUser
 * is called from within where clauses.
 */

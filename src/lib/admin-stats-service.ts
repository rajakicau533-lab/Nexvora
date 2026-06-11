/**
 * @fileOverview Admin Statistics Service
 * Provides utility functions to calculate and aggregate data for the admin panel.
 */

/**
 * Calculates the total sum of coins from a collection of user documents.
 * It handles potential string values and null/undefined fields safely.
 * 
 * @param users - Array of user document data from Firestore.
 * @returns Total number of coins currently held by all users.
 */
export function calculateTotalUserCoins(users: any[] | null | undefined): number {
  if (!users || !Array.isArray(users)) return 0;
  
  return users.reduce((sum, user) => {
    // Ensuring the field is treated as a number
    const userBalance = typeof user.coins === 'number' ? user.coins : Number(user.coins) || 0;
    return sum + userBalance;
  }, 0);
}

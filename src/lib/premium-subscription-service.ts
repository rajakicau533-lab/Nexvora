/**
 * @fileOverview Premium Subscription Service
 * Handles purchasing and validation logic for time-limited premium access.
 */

import { 
  Firestore, 
  doc, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  increment,
  Timestamp 
} from 'firebase/firestore';

export async function buyPremiumPlan(
  db: Firestore, 
  userId: string, 
  plan: { id: string; label: string; cost: number; days: number },
  currentCoins: number
) {
  if (currentCoins < plan.cost) {
    throw new Error(`Saldo koin tidak cukup. Butuh ${plan.cost} koin.`);
  }

  const userRef = doc(db, "users", userId);
  
  // Calculate expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

  // 1. Deduct Coins & Update Subscription
  await updateDoc(userRef, {
    coins: increment(-plan.cost),
    premiumSubscription: {
      active: true,
      tier: "Premium",
      activatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      planId: plan.id
    }
  });

  // 2. Log Transaction
  await addDoc(collection(db, "coin_transactions"), {
    userId,
    amount: -plan.cost,
    type: "purchase",
    description: `Aktivasi Premium: ${plan.label}`,
    createdAt: serverTimestamp()
  });

  return { success: true, expiresAt };
}

export function isPremiumActive(subscription: any): boolean {
  if (!subscription || !subscription.active || !subscription.expiresAt) return false;
  
  const expiryDate = subscription.expiresAt.toDate ? subscription.expiresAt.toDate() : new Date(subscription.expiresAt);
  return expiryDate > new Date();
}

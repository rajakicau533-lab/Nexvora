/**
 * @fileOverview Referral Reward Service
 * Handles the administrative action of sending coin rewards to referral owners.
 */

import { 
  Firestore, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  increment, 
  collection 
} from 'firebase/firestore';

/**
 * Sends a 5-coin reward to the inviter and updates the referral record status.
 * Performed as an atomic transaction for data integrity.
 */
export async function sendReferralReward(
  db: Firestore, 
  recordId: string, 
  ownerUid: string, 
  adminEmail: string
) {
  const recordRef = doc(db, "referral_history", recordId);
  const ownerRef = doc(db, "users", ownerUid);

  return runTransaction(db, async (transaction) => {
    const recordSnap = await transaction.get(recordRef);
    if (!recordSnap.exists()) throw new Error("Data referral tidak ditemukan.");
    
    const recordData = recordSnap.data();
    if (recordData.rewardSent) throw new Error("Reward sudah pernah dikirim untuk user ini.");

    const ownerSnap = await transaction.get(ownerRef);
    if (!ownerSnap.exists()) throw new Error("Akun pemilik referral tidak ditemukan.");

    // 1. Update status in referral_history
    transaction.update(recordRef, {
      rewardSent: true,
      rewardSentAt: serverTimestamp(),
      rewardSentBy: adminEmail,
      status: "SUDAH DIKIRIM"
    });

    // 2. Add 5 coins to the inviter
    transaction.update(ownerRef, {
      coins: increment(5),
      updatedAt: serverTimestamp()
    });

    // 3. Log coin transaction for the owner
    const txRef = doc(collection(db, "coin_transactions"));
    transaction.set(txRef, {
      userId: ownerUid,
      amount: 5,
      type: "topup",
      description: `Referral Reward: ${recordData.referredEmail || 'User Invited'}`,
      createdAt: serverTimestamp()
    });

    // 4. Log admin activity
    const logRef = doc(collection(db, "activity_logs"));
    transaction.set(logRef, {
      type: "admin",
      action: "SEND_REFERRAL_REWARD",
      userId: "system",
      userEmail: adminEmail,
      details: `Berhasil mengirim 5 koin reward ke ${ownerSnap.data().email} (Referral: ${recordData.referredEmail})`,
      timestamp: serverTimestamp()
    });
  });
}

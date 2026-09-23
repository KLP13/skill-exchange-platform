export type CreditTransactionType = "earned" | "spent";

export interface CreditTransaction {
  id: string;
  userId: string; // The user ID who owns this transaction
  type: CreditTransactionType;
  amount: number; // Positive (+10) for earned/teaching, Negative (-5) for spent/learning
  description: string;
  date: string;
  sessionId?: string;
  participantName?: string;
  role?: "mentor" | "learner";
}

export const DEFAULT_STARTING_BALANCE = 40;

export const INITIAL_USER_CREDITS: Record<string, number> = {};


export const initialTransactions: CreditTransaction[] = [];

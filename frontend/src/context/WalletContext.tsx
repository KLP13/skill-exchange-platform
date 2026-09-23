import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  INITIAL_USER_CREDITS,
  DEFAULT_STARTING_BALANCE,
  initialTransactions,
} from "@/data/credits";
import type { CreditTransaction, CreditTransactionType } from "@/data/credits";
import type { Session } from "@/data/sessions";

export interface WalletContextType {
  userInitialBalances: Record<string, number>;
  allTransactions: CreditTransaction[];
  getUserBalance: (userId: string | undefined) => number;
  getUserTransactions: (userId: string | undefined) => CreditTransaction[];
  getUserTotalEarned: (userId: string | undefined) => number;
  getUserTotalSpent: (userId: string | undefined) => number;
  hasUserTransactionForSession: (
    userId: string,
    sessionId: string,
    type: CreditTransactionType
  ) => boolean;
  canAffordBooking: (cost?: number, userId?: string) => boolean;
  addTransaction: (
    tx: Omit<CreditTransaction, "id"> & { id?: string }
  ) => CreditTransaction | null;
  completeSessionAndProcessCredits: (
    session: Session
  ) => { success: boolean; error?: string };
  setCustomBalanceForTesting: (userId: string, newBalance: number) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

import { walletApi } from "@/services/walletApi";

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();
  const [userInitialBalances, setUserInitialBalances] = useState<
    Record<string, number>
  >(INITIAL_USER_CREDITS);
  const [transactions, setTransactions] =
    useState<CreditTransaction[]>(initialTransactions);

  useEffect(() => {
    if (authUser?.id) {
      walletApi
        .getWallet()
        .then((walletData) => {
          if (walletData) {
            setUserInitialBalances((prev) => ({
              ...prev,
              [authUser.id]: walletData.balance,
            }));
            if (walletData.transactions && walletData.transactions.length > 0) {
              setTransactions((prev) => {
                const existingOthers = prev.filter((t) => t.userId !== authUser.id);
                return [...walletData.transactions, ...existingOthers];
              });
            }
          }
        })
        .catch(() => {
          setUserInitialBalances((prev) => ({
            ...prev,
            [authUser.id]:
              authUser.credits !== undefined
                ? authUser.credits
                : (prev[authUser.id] ?? DEFAULT_STARTING_BALANCE),
          }));
        });
    }
  }, [authUser]);

  const getUserTransactions = (
    userId: string | undefined
  ): CreditTransaction[] => {
    if (!userId) return [];
    return transactions.filter((t) => t.userId === String(userId));
  };

  const getUserBalance = (userId: string | undefined): number => {
    if (!userId) return DEFAULT_STARTING_BALANCE;
    if (userInitialBalances[userId] !== undefined) {
      return userInitialBalances[userId];
    }
    if (authUser && authUser.id === userId && authUser.credits !== undefined) {
      return authUser.credits;
    }
    return DEFAULT_STARTING_BALANCE;
  };

  const getUserTotalEarned = (userId: string | undefined): number => {
    if (!userId) return 0;
    return getUserTransactions(userId)
      .filter((t) => t.amount > 0 && !t.description.toLowerCase().includes("signup") && !t.description.toLowerCase().includes("welcome"))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getUserTotalSpent = (userId: string | undefined): number => {
    if (!userId) return 0;
    return getUserTransactions(userId)
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const hasUserTransactionForSession = (
    userId: string,
    sessionId: string,
    type: CreditTransactionType
  ): boolean => {
    return transactions.some(
      (t) =>
        t.userId === String(userId) &&
        t.sessionId === sessionId &&
        t.type === type
    );
  };

  const canAffordBooking = (
    cost: number = 5,
    userId?: string
  ): boolean => {
    const targetUserId = userId || authUser?.id;
    return getUserBalance(targetUserId) >= cost;
  };

  const addTransaction = (
    tx: Omit<CreditTransaction, "id"> & { id?: string }
  ): CreditTransaction | null => {
    const targetUserId = tx.userId || authUser?.id || "student";

    // 1. Prevent duplicate transactions for the same userId + sessionId + type
    if (
      tx.sessionId &&
      hasUserTransactionForSession(targetUserId, tx.sessionId, tx.type)
    ) {
      return null;
    }

    // 2. Prevent negative balance on spent transactions
    if (tx.type === "spent" && getUserBalance(targetUserId) < Math.abs(tx.amount)) {
      return null;
    }

    const newTx: CreditTransaction = {
      id:
        tx.id ||
        `tx-${targetUserId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date:
        tx.date ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      sessionId: tx.sessionId,
      participantName: tx.participantName,
      role: tx.role,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setUserInitialBalances((prev) => ({
      ...prev,
      [targetUserId]: Math.max(0, (prev[targetUserId] ?? DEFAULT_STARTING_BALANCE) + newTx.amount),
    }));
    return newTx;
  };

  // Complete session: updates BOTH the learner wallet (-5) and mentor wallet (+10) simultaneously
  const completeSessionAndProcessCredits = (
    session: Session
  ): { success: boolean; error?: string } => {
    const learnerId = session.learnerId || "chidvi";
    const mentorId = session.mentorId || "1";

    const learnerAlreadyProcessed = hasUserTransactionForSession(
      learnerId,
      session.id,
      "spent"
    );
    const mentorAlreadyProcessed = hasUserTransactionForSession(
      mentorId,
      session.id,
      "earned"
    );

    // If both transactions have already been processed, operation is idempotent
    if (learnerAlreadyProcessed && mentorAlreadyProcessed) {
      return { success: true };
    }

    // Validate learner can afford 5 credits if not processed yet
    if (!learnerAlreadyProcessed && getUserBalance(learnerId) < 5) {
      return {
        success: false,
        error: `Insufficient credits for learner (${session.learnerName || learnerId}). At least 5 credits are required.`,
      };
    }

    const newTransactionsToAdd: CreditTransaction[] = [];
    const nowFormatted = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // 1. Learner transaction (-5 credits)
    if (!learnerAlreadyProcessed) {
      newTransactionsToAdd.push({
        id: `tx-learner-${session.id}`,
        userId: learnerId,
        sessionId: session.id,
        type: "spent",
        amount: -5,
        description: `Learning session — ${session.topic}`,
        participantName: `with ${session.mentor}`,
        role: "learner",
        date: nowFormatted,
      });
    }

    // 2. Mentor transaction (+10 credits)
    if (!mentorAlreadyProcessed) {
      newTransactionsToAdd.push({
        id: `tx-mentor-${session.id}`,
        userId: mentorId,
        sessionId: session.id,
        type: "earned",
        amount: 10,
        description: `Teaching reward — ${session.topic}`,
        participantName: `with ${session.learnerName || "Learner"}`,
        role: "mentor",
        date: nowFormatted,
      });
    }

    setTransactions((prev) => [...newTransactionsToAdd, ...prev]);
    setUserInitialBalances((prev) => ({
      ...prev,
      ...(!learnerAlreadyProcessed ? { [learnerId]: Math.max(0, (prev[learnerId] ?? DEFAULT_STARTING_BALANCE) - 5) } : {}),
      ...(!mentorAlreadyProcessed ? { [mentorId]: (prev[mentorId] ?? DEFAULT_STARTING_BALANCE) + 10 } : {}),
    }));
    return { success: true };
  };

  const setCustomBalanceForTesting = (userId: string, newBalance: number) => {
    setUserInitialBalances((prev) => ({
      ...prev,
      [userId]: newBalance,
    }));
  };

  return (
    <WalletContext.Provider
      value={{
        userInitialBalances,
        allTransactions: transactions,
        getUserBalance,
        getUserTransactions,
        getUserTotalEarned,
        getUserTotalSpent,
        hasUserTransactionForSession,
        canAffordBooking,
        addTransaction,
        completeSessionAndProcessCredits,
        setCustomBalanceForTesting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

import { Request, Response } from "express";
import pool from "../../config/db";

export async function getWallet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Ensure wallet exists
    let walletRes = await pool.query<{ id: string; balance: number }>(
      `SELECT id, balance FROM wallets WHERE user_id = $1`,
      [userId]
    );

    if (walletRes.rows.length === 0) {
      walletRes = await pool.query<{ id: string; balance: number }>(
        `INSERT INTO wallets (user_id, balance) VALUES ($1, 40) RETURNING id, balance`,
        [userId]
      );
      // Initial bonus transaction
      await pool.query(
        `INSERT INTO credit_transactions (user_id, wallet_id, amount, transaction_type, description)
         VALUES ($1, $2, 40, 'INITIAL_SIGNUP_BONUS', 'Initial welcome bonus on joining SkillSwap (+40 credits)')`,
        [userId, walletRes.rows[0].id]
      );
    }

    const currentBalance = walletRes.rows[0].balance;

    // Fetch transactions
    const txRes = await pool.query(
      `SELECT 
        id,
        amount,
        transaction_type,
        description,
        created_at
       FROM credit_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    );

    const transactions = txRes.rows.map((tx) => ({
      id: tx.id,
      userId,
      type: tx.amount > 0 ? "earned" : "spent",
      amount: tx.amount,
      description: tx.description,
      date: new Date(tx.created_at).toISOString().split("T")[0],
    }));

    const totalEarned = transactions
      .filter((t) => t.amount > 0 && !t.description.toLowerCase().includes("signup") && !t.description.toLowerCase().includes("welcome"))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    res.json({
      success: true,
      data: {
        balance: currentBalance,
        totalEarned,
        totalSpent,
        transactions,
      },
    });
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet information.",
    });
  }
}

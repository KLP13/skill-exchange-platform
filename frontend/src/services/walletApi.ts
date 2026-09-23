import api from "./api";
import type { CreditTransaction } from "@/data/credits";

export interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: CreditTransaction[];
}

export const walletApi = {
  async getWallet(): Promise<WalletData> {
    const res = await api.get<{ success: boolean; data: WalletData }>("/wallet");
    return res.data.data;
  },
};

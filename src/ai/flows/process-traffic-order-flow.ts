'use server';
/**
 * @fileOverview Genkit flow for communicating with IndoSMM API.
 * 
 * - processTrafficOrder: Sends a traffic order to the provider.
 * - checkProviderBalance: Checks the current balance of the SMM account.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OrderInputSchema = z.object({
  apiUrl: z.string(),
  apiKey: z.string(),
  serviceId: z.string(),
  link: z.string().url(),
  quantity: z.number(),
});

const BalanceInputSchema = z.object({
  apiUrl: z.string(),
  apiKey: z.string(),
});

export async function processTrafficOrder(input: z.infer<typeof OrderInputSchema>) {
  return processTrafficOrderFlow(input);
}

export async function checkProviderBalance(input: z.infer<typeof BalanceInputSchema>) {
  return checkProviderBalanceFlow(input);
}

const processTrafficOrderFlow = ai.defineFlow(
  {
    name: 'processTrafficOrderFlow',
    inputSchema: OrderInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      orderId: z.string().optional(),
      error: z.string().optional(),
      rawResponse: z.any().optional(),
      debugInfo: z.any().optional(),
    }),
  },
  async (input) => {
    const { apiUrl, apiKey, serviceId, link, quantity } = input;
    const cleanUrl = apiUrl.trim();

    try {
      if (!cleanUrl.startsWith('http')) {
        throw new Error("API URL tidak valid. Harus dimulai dengan http:// atau https://");
      }

      const params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('action', 'add');
      params.append('service', serviceId);
      params.append('link', link);
      params.append('quantity', quantity.toString());

      const response = await fetch(cleanUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Nexvora/2.5',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout for better reliability
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: `Provider mengirim respon non-JSON (HTML/Text). Status: ${response.status}`,
          debugInfo: { status: response.status, body: responseText.slice(0, 500) }
        };
      }

      if (data.order) {
        return {
          success: true,
          orderId: data.order.toString(),
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Provider menolak pesanan tanpa alasan spesifik.',
          rawResponse: data,
        };
      }
    } catch (err: any) {
      console.error('API_FETCH_CRITICAL_ERROR:', err);
      return {
        success: false,
        error: `Koneksi gagal (Network Error): ${err.message || 'fetch failed'}`,
        debugInfo: { cause: err.cause, stack: err.stack }
      };
    }
  }
);

const checkProviderBalanceFlow = ai.defineFlow(
  {
    name: 'checkProviderBalanceFlow',
    inputSchema: BalanceInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      balance: z.string().optional(),
      currency: z.string().optional(),
      error: z.string().optional(),
      debugInfo: z.any().optional(),
    }),
  },
  async (input) => {
    const { apiUrl, apiKey } = input;
    const cleanUrl = apiUrl.trim();

    try {
      if (!cleanUrl.startsWith('http')) {
        throw new Error("API URL harus dimulai dengan http:// atau https://");
      }

      const params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('action', 'balance');

      const response = await fetch(cleanUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Nexvora/2.5',
        },
        signal: AbortSignal.timeout(20000), // 20s timeout
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { 
          success: false, 
          error: `Respon provider bukan JSON. Status: ${response.status}. Pastikan URL API benar (akhiran /api/v2).`,
          debugInfo: responseText.slice(0, 500)
        };
      }

      if (data.balance) {
        return {
          success: true,
          balance: data.balance,
          currency: data.currency || 'IDR',
        };
      } else {
        return {
          success: false,
          error: data.error || 'Gagal mengambil saldo dari provider.',
          debugInfo: data
        };
      }
    } catch (err: any) {
      console.error("BALANCE_FETCH_ERROR:", err);
      return { 
        success: false, 
        error: `Fetch gagal: ${err.message || 'Koneksi ke host ditolak'}`,
        debugInfo: err.stack
      };
    }
  }
);
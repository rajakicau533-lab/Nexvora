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

    console.log("--- TRAFFIC ORDER REQUEST ---");
    console.log("Endpoint:", cleanUrl);
    console.log("Service ID:", serviceId);
    console.log("Link:", link);

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

      // Using a reasonable timeout and User-Agent to avoid fetch failed/blocked
      const response = await fetch(cleanUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Nexvora-Booster/2.5 (NextJS; Node; +https://nexvora.com)',
        },
        signal: AbortSignal.timeout(20000), // 20s timeout
      });

      const responseText = await response.text();
      console.log("Provider Status:", response.status);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Provider JSON:", data);
      } catch (e) {
        console.error("Provider Response is not JSON:", responseText);
        return {
          success: false,
          error: `Provider mengirim respon non-JSON. Status: ${response.status}`,
          debugInfo: { status: response.status, body: responseText }
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
        error: `Koneksi ke provider gagal: ${err.message || 'Network error'}`,
        debugInfo: { error: err.message, stack: err.stack }
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
          'User-Agent': 'Nexvora-Booster/2.5',
        },
        signal: AbortSignal.timeout(15000),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { 
          success: false, 
          error: `Respon provider bukan JSON. Pastikan URL API benar (akhiran /api/v2).` 
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
      return { success: false, error: `fetch failed: ${err.message}` };
    }
  }
);

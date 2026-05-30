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
    }),
  },
  async (input) => {
    const { apiUrl, apiKey, serviceId, link, quantity } = input;

    try {
      const params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('action', 'add');
      params.append('service', serviceId);
      params.append('link', link);
      params.append('quantity', quantity.toString());

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      console.log('API_RESPONSE:', data);

      if (data.order) {
        return {
          success: true,
          orderId: data.order.toString(),
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Provider returned an unknown error.',
          rawResponse: data,
        };
      }
    } catch (err: any) {
      console.error('API_FETCH_ERROR:', err);
      return {
        success: false,
        error: err.message || 'Failed to connect to provider API.',
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
    }),
  },
  async (input) => {
    try {
      const params = new URLSearchParams();
      params.append('key', input.apiKey);
      params.append('action', 'balance');

      const response = await fetch(input.apiUrl, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      if (data.balance) {
        return {
          success: true,
          balance: data.balance,
          currency: data.currency || 'IDR',
        };
      } else {
        return {
          success: false,
          error: data.error || 'Could not fetch balance.',
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);

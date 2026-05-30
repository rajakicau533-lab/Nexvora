'use server';
/**
 * @fileOverview Genkit flow for communicating with SMM.ID API.
 * 
 * - processTrafficOrder: Sends a traffic order to the provider.
 * - checkProviderBalance: Checks the current balance or tests connectivity.
 * - getProviderServices: Lists available services from provider.
 * - checkOrderStatus: Verifies the status of a specific order.
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

const ConnectionInputSchema = z.object({
  apiUrl: z.string(),
  apiKey: z.string(),
});

const StatusInputSchema = z.object({
  apiUrl: z.string(),
  apiKey: z.string(),
  orderId: z.string(),
});

export async function processTrafficOrder(input: z.infer<typeof OrderInputSchema>) {
  return processTrafficOrderFlow(input);
}

export async function checkProviderBalance(input: z.infer<typeof ConnectionInputSchema>) {
  return checkProviderBalanceFlow(input);
}

export async function getProviderServices(input: z.infer<typeof ConnectionInputSchema>) {
  return getProviderServicesFlow(input);
}

export async function checkOrderStatus(input: z.infer<typeof StatusInputSchema>) {
  return checkOrderStatusFlow(input);
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
    const endpoint = apiUrl.trim();

    try {
      const params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('action', 'add');
      params.append('service', serviceId);
      params.append('link', link);
      params.append('quantity', quantity.toString());

      const response = await fetch(endpoint, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(30000), 
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: `Provider Response non-JSON. Status: ${response.status}`,
          debugInfo: { body: responseText.slice(0, 500) }
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
          error: data.error || 'Provider rejected the request.',
          rawResponse: data,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Network Error: ${err.message || 'connection failed'}`,
      };
    }
  }
);

const checkProviderBalanceFlow = ai.defineFlow(
  {
    name: 'checkProviderBalanceFlow',
    inputSchema: ConnectionInputSchema,
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
    
    try {
      const params = new URLSearchParams();
      params.append('key', apiKey);
      params.append('action', 'balance');

      const response = await fetch(apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(20000),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { 
          success: false, 
          error: `Not a JSON response.`,
          debugInfo: responseText 
        };
      }

      if (data.balance) {
        return {
          success: true,
          balance: data.balance,
          currency: data.currency || 'IDR',
          debugInfo: data
        };
      } else {
        return {
          success: false,
          error: data.error || 'API Key valid but balance field missing.',
          debugInfo: data
        };
      }
    } catch (err: any) {
      return { 
        success: false, 
        error: `Fetch Error: ${err.message}`,
      };
    }
  }
);

const getProviderServicesFlow = ai.defineFlow(
  {
    name: 'getProviderServicesFlow',
    inputSchema: ConnectionInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      services: z.any().optional(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const params = new URLSearchParams();
      params.append('key', input.apiKey);
      params.append('action', 'services');

      const response = await fetch(input.apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      const data = await response.json();
      return { success: true, services: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);

const checkOrderStatusFlow = ai.defineFlow(
  {
    name: 'checkOrderStatusFlow',
    inputSchema: StatusInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      status: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      const params = new URLSearchParams();
      params.append('key', input.apiKey);
      params.append('action', 'status');
      params.append('order', input.orderId);

      const response = await fetch(input.apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(20000),
      });

      const data = await response.json();
      
      if (data.status) {
        return { success: true, status: data.status };
      } else {
        return { success: false, error: data.error || 'Status not found' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);
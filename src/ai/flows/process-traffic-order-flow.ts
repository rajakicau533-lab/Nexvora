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
    
    if (!apiUrl || !apiKey || apiKey.trim() === "") {
      return {
        success: false,
        error: "Konfigurasi API (URL/Key) belum lengkap di sistem."
      };
    }

    // Clean URL: ensure no trailing spaces and proper protocol
    const endpoint = apiUrl.trim();

    try {
      const params = new URLSearchParams();
      params.append('key', apiKey.trim());
      params.append('action', 'add');
      params.append('service', serviceId.trim());
      params.append('link', link.trim());
      params.append('quantity', quantity.toString());

      // Use a standard fetch without AbortSignal.timeout for better compatibility in older Node runtimes
      const response = await fetch(endpoint, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'NexvoraStudio/1.0',
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return {
          success: false,
          error: `Respon server tidak valid. Status: ${response.status}`,
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
        let errorMsg = data.error || 'Provider menolak permintaan.';
        
        // Accurate Error Mapping
        if (errorMsg.toLowerCase().includes("not enough funds")) {
          errorMsg = "Layanan sedang dalam pemeliharaan (Restocking). Mohon coba beberapa saat lagi.";
        } else if (errorMsg.toLowerCase().includes("invalid api key")) {
          errorMsg = "Konfigurasi API Key tidak valid atau IP server belum di-whitelist oleh provider.";
        } else if (errorMsg.toLowerCase().includes("service not found")) {
          errorMsg = "ID Layanan (" + serviceId + ") tidak ditemukan atau sudah dinonaktifkan oleh provider.";
        } else if (errorMsg.toLowerCase().includes("incorrect link")) {
          errorMsg = "Format link tidak sesuai dengan syarat layanan provider.";
        }

        return {
          success: false,
          error: errorMsg,
          rawResponse: data,
        };
      }
    } catch (err: any) {
      console.error("Fetch Error in Flow:", err);
      return {
        success: false,
        error: `Kesalahan Jaringan: ${err.message || 'Gagal terhubung ke provider'}`,
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
    
    if (!apiUrl || !apiKey || apiKey.trim() === "") {
       return { success: false, error: "API Key kosong." };
    }

    try {
      const params = new URLSearchParams();
      params.append('key', apiKey.trim());
      params.append('action', 'balance');

      const response = await fetch(apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NexvoraStudio/1.0',
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { 
          success: false, 
          error: `Bukan respon JSON valid.`,
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
          error: data.error || 'Gagal mengambil saldo.',
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
      params.append('key', input.apiKey.trim());
      params.append('action', 'services');

      const response = await fetch(input.apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NexvoraStudio/1.0',
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
      params.append('key', input.apiKey.trim());
      params.append('action', 'status');
      params.append('order', input.orderId);

      const response = await fetch(input.apiUrl.trim(), {
        method: 'POST',
        body: params,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NexvoraStudio/1.0',
        }
      });

      const data = await response.json();
      
      if (data.status) {
        return { success: true, status: data.status };
      } else {
        return { success: false, error: data.error || 'Status tidak ditemukan' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
);
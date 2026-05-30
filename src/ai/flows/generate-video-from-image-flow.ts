'use server';
/**
 * @fileOverview A Genkit flow that generates a short video from an uploaded image and an optional text prompt.
 *
 * - generateVideoFromImage - A function that handles the video generation process.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {MediaPart} from 'genkit';
import type node_fetch from 'node-fetch'; // Importing type for node-fetch

const GenerateVideoFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  promptText: z
    .string()
    .optional()
    .describe(
      'An optional text prompt to guide the video generation, e.g., "make the subject in the photo move".'
    ),
  aspectRatio: z
    .enum(['1:1', '4:5', '9:16', '16:9'])
    .default('16:9')
    .describe('The desired aspect ratio for the generated video.'),
});
export type GenerateVideoFromImageInput = z.infer<
  typeof GenerateVideoFromImageInputSchema
>;

const GenerateVideoFromImageOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe('The generated video as a base64 encoded data URI.'),
});
export type GenerateVideoFromImageOutput = z.infer<
  typeof GenerateVideoFromImageOutputSchema
>;

/**
 * Helper function to download a video from a URL and convert it to a base64 data URI.
 * This is necessary because Veo models return temporary URLs that require an API key for access,
 * which cannot be directly exposed to the client.
 */
async function videoUrlToBase64DataUri(video: MediaPart): Promise<string> {
  const fetch = (await import('node-fetch')).default as typeof node_fetch;

  // Ensure GEMINI_API_KEY is available in the environment.
  // In a production Next.js app, this should be accessed via a server-side API route
  // or a secure method that doesn't expose the key directly to the browser.
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in the environment variables.');
  }

  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );

  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video from the provided URL.');
  }

  const arrayBuffer = await videoDownloadResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = video.media?.contentType || 'video/mp4'; // Default to video/mp4 if not specified
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function generateVideoFromImage(
  input: GenerateVideoFromImageInput
): Promise<GenerateVideoFromImageOutput> {
  return generateVideoFromImageFlow(input);
}

const generateVideoFromImageFlow = ai.defineFlow(
  {
    name: 'generateVideoFromImageFlow',
    inputSchema: GenerateVideoFromImageInputSchema,
    outputSchema: GenerateVideoFromImageOutputSchema,
  },
  async (input) => {
    const {photoDataUri, promptText, aspectRatio} = input;

    // Veo 2 model supports 9:16 and 16:9. For 1:1 and 4:5, we'll default to 16:9.
    let modelAspectRatio: '9:16' | '16:9';
    if (aspectRatio === '9:16') {
      modelAspectRatio = '9:16';
    } else {
      modelAspectRatio = '16:9';
    }

    const promptParts = [
      {media: {url: photoDataUri}},
      {text: promptText || 'generate a short video based on this image'},
    ];

    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'), // Using Veo 2 for broader aspect ratio support
      prompt: promptParts,
      config: {
        durationSeconds: 8, // Max duration for Veo 2 models is 8 seconds
        aspectRatio: modelAspectRatio,
        personGeneration: 'allow_adult', // Default to allowing adult figures
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    // Poll the operation status until it completes
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again to avoid excessive polling
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error(
        `Failed to generate video: ${operation.error.message || 'Unknown error.'}`
      );
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video media in the operation output.');
    }

    // Download the video and convert to base64 data URI for client-side use
    const videoDataUri = await videoUrlToBase64DataUri(video);

    return {
      videoDataUri,
    };
  }
);

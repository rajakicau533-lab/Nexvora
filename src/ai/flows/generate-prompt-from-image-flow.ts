'use server';
/**
 * @fileOverview A Genkit flow for generating a descriptive text prompt from an input image.
 *
 * - generatePromptFromImage - A function that handles the image-to-prompt generation process.
 * - GeneratePromptFromImageInput - The input type for the generatePromptFromImage function.
 * - GeneratePromptFromImageOutput - The return type for the generatePromptFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePromptFromImageInput = z.infer<
  typeof GeneratePromptFromImageInputSchema
>;

const GeneratePromptFromImageOutputSchema = z.object({
  prompt: z.string().describe('A descriptive text prompt generated from the image.'),
});
export type GeneratePromptFromImageOutput = z.infer<
  typeof GeneratePromptFromImageOutputSchema
>;

export async function generatePromptFromImage(
  input: GeneratePromptFromImageInput
): Promise<GeneratePromptFromImageOutput> {
  return generatePromptFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptFromImagePrompt',
  input: {schema: GeneratePromptFromImageInputSchema},
  output: {schema: GeneratePromptFromImageOutputSchema},
  prompt: `You are an AI assistant that analyzes images and generates concise, descriptive text prompts from them.

Your task is to examine the provided image and create a short, vivid prompt that captures the essence, key elements, style, and mood of the image. The prompt should be suitable for use in a text-to-image AI model to recreate a similar image.

Image: {{media url=imageDataUri}}`,
});

const generatePromptFromImageFlow = ai.defineFlow(
  {
    name: 'generatePromptFromImageFlow',
    inputSchema: GeneratePromptFromImageInputSchema,
    outputSchema: GeneratePromptFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

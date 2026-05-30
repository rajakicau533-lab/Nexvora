'use server';
/**
 * @fileOverview A Genkit flow that generates multiple images from a text description.
 *
 * - generateImageFromText - A function that generates images based on a text prompt and aspect ratio.
 * - GenerateImageFromTextInput - The input type for the generateImageFromText function.
 * - GenerateImageFromTextOutput - The return type for the generateImageFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateImageFromTextInputSchema = z.object({
  prompt: z.string().describe('A detailed text description to generate images from.'),
  aspectRatio: z
    .enum(['1:1', '4:5', '9:16', '16:9'])
    .default('16:9')
    .describe('The desired aspect ratio for the generated images.'),
  numImages: z
    .number()
    .min(1)
    .max(6)
    .default(1)
    .describe('The number of unique images to generate (between 1 and 6).'),
});
export type GenerateImageFromTextInput = z.infer<typeof GenerateImageFromTextInputSchema>;

// Output Schema
const GenerateImageFromTextOutputSchema = z.object({
  images: z.array(z.object({url: z.string().describe('The URL of the generated image.')})),
});
export type GenerateImageFromTextOutput = z.infer<typeof GenerateImageFromTextOutputSchema>;

/**
 * Generates multiple unique images based on a text description and desired aspect ratio.
 * @param input - The input containing the text prompt, aspect ratio, and number of images.
 * @returns An object containing an array of generated image URLs.
 */
export async function generateImageFromText(
  input: GenerateImageFromTextInput
): Promise<GenerateImageFromTextOutput> {
  return generateImageFromTextFlow(input);
}

// Flow definition
const generateImageFromTextFlow = ai.defineFlow(
  {
    name: 'generateImageFromTextFlow',
    inputSchema: GenerateImageFromTextInputSchema,
    outputSchema: GenerateImageFromTextOutputSchema,
  },
  async input => {
    const generatedImages: {url: string}[] = [];
    const numImagesToGenerate = input.numImages || 1;

    for (let i = 0; i < numImagesToGenerate; i++) {
      // The imagen-4.0-fast-generate-001 model directly takes a text prompt.
      // Aspect ratio guidance is included in the prompt text itself as there's no direct config parameter.
      // Added a phrase to encourage unique generation for multiple images.
      const {media} = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Generate a unique image, distinct from others generated for this request, based on the following description: "${input.prompt}". The image should aim for an aspect ratio of ${input.aspectRatio}.`,
      });

      if (media && media.url) {
        generatedImages.push({url: media.url});
      } else {
        console.warn(`Failed to generate image for iteration ${i + 1}.`);
      }
    }

    return {images: generatedImages};
  }
);

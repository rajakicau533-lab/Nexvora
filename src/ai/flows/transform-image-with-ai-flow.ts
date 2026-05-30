'use server';
/**
 * @fileOverview This file defines a Genkit flow for transforming an image using an AI model.
 *
 * - transformImageWithAI - A function that handles the image transformation process.
 * - TransformImageWithAIInput - The input type for the transformImageWithAI function.
 * - TransformImageWithAIOutput - The return type for the transformImageWithAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransformImageWithAIInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('A text prompt describing the desired transformation or new image.'),
  aspectRatio: z
    .enum(['1:1', '4:5', '9:16', '16:9'])
    .describe('The desired aspect ratio for the output image. Must be one of 1:1, 4:5, 9:16, or 16:9.'),
});
export type TransformImageWithAIInput = z.infer<typeof TransformImageWithAIInputSchema>;

const TransformImageWithAIOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The transformed image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TransformImageWithAIOutput = z.infer<typeof TransformImageWithAIOutputSchema>;

export async function transformImageWithAI(input: TransformImageWithAIInput): Promise<TransformImageWithAIOutput> {
  return transformImageWithAIFlow(input);
}

const transformImageWithAIPrompt = ai.definePrompt({
  name: 'transformImageWithAIPrompt',
  input: { schema: TransformImageWithAIInputSchema },
  output: { schema: TransformImageWithAIOutputSchema },
  prompt: `You are an expert image editor and generator.

Transform the provided image based on the user's prompt. The output image should maintain the aspect ratio of {{{aspectRatio}}}.

Prompt: {{{prompt}}}
Image: {{media url=imageDataUri}}`,
});

const transformImageWithAIFlow = ai.defineFlow(
  {
    name: 'transformImageWithAIFlow',
    inputSchema: TransformImageWithAIInputSchema,
    outputSchema: TransformImageWithAIOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [
        { media: { url: input.imageDataUri } },
        { text: `Transform this image with the following instructions: ${input.prompt}. Maintain the aspect ratio of ${input.aspectRatio}.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const generatedImage = output?.media?.[0]?.url;

    if (!generatedImage) {
      throw new Error('Failed to generate image.');
    }

    return { imageDataUri: generatedImage };
  }
);

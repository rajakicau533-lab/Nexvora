import { config } from 'dotenv';
config();

import '@/ai/flows/generate-prompt-from-image-flow.ts';
import '@/ai/flows/transform-image-with-ai-flow.ts';
import '@/ai/flows/generate-image-from-text-flow.ts';
import '@/ai/flows/generate-video-from-image-flow.ts';
import '@/ai/flows/process-traffic-order-flow.ts';

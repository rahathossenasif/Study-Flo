import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw Object.assign(
      new Error('Gemini API key is not configured. Please check Settings > Secrets.'),
      { status: 500 }
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 0;
      const isTransient = status === 503 || status === 502 || status === 504;
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
    }
  }
  throw lastError;
}

function sendApiError(res: Response, err: unknown, fallbackMessage: string) {
  const rawMessage = err instanceof Error ? err.message : fallbackMessage;
  const status =
    typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status?: number }).status === 'number'
      ? (err as { status: number }).status
      : 500;

  let friendly = rawMessage || fallbackMessage;
  if (status === 403 || rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('API_KEY_INVALID')) {
    friendly = 'Gemini API key authentication failed. Please check your API key in Settings > Secrets.';
  } else if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    friendly = 'Rate limit reached for the AI Study Assistant. Please wait a moment and try again.';
  }

  res.status(status >= 400 && status < 600 ? status : 500).json({ error: friendly });
}

async function createAppServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Summarize User Notes or Syllabus Chapters
  app.post('/api/ai/summarize', async (req: Request, res: Response) => {
    try {
      const sourceType = req.body?.sourceType === 'syllabus' ? 'syllabus' : 'note';
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : 'Study Content';
      const subjectName = typeof req.body?.subjectName === 'string' ? req.body.subjectName.trim() : 'General';
      const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

      if (!content) {
        res.status(400).json({ error: 'Please select a note or syllabus chapter with content before summarizing.' });
        return;
      }

      const language = req.body?.language === 'en' ? 'en' : 'bn';
      const langDirective =
        language === 'bn'
          ? ' Write the ENTIRE output (summary, every keyTakeaways item, and every keyTerms term & definition) in clear, natural, student-friendly Bangla (বাংলা script). Keep essential mathematical symbols or technical acronyms intact where helpful, with Bangla explanations.'
          : ' Write the output in clear, natural English.';

      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Source Type: ${sourceType}\nSubject: ${subjectName}\nTitle: ${title}\nOutput Language: ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}\n\nContent:\n${content.slice(0, 8000)}`,
          config: {
            systemInstruction:
              (sourceType === 'syllabus'
                ? 'You are STUDYFLO AI, a concise academic study assistant. Summarize this syllabus chapter or subject into a clear revision roadmap. Return a 2-3 sentence overview of how the topics connect, 3 to 5 high-yield study takeaways, and 2 to 4 essential terms or principles to master.'
                : 'You are STUDYFLO AI, a concise academic study assistant. Summarize the student note clearly without fluff. Return a 2-3 sentence summary, 3 to 5 high-yield key takeaways, and 2 to 4 key terms with crisp one-sentence definitions.') +
              langDirective,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'Concise 2-3 sentence overview.' },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 5 clear study takeaways.',
                },
                keyTerms: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                    required: ['term', 'definition'],
                  },
                  description: '2 to 4 essential terms or formulas.',
                },
              },
              required: ['summary', 'keyTakeaways', 'keyTerms'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      sendApiError(res, err, 'Failed to summarize content.');
    }
  });

  // 4. Context-Aware Study Tutor Chat
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
      const sourceTitle = typeof req.body?.sourceTitle === 'string' ? req.body.sourceTitle.trim() : 'Study Material';
      const subjectName = typeof req.body?.subjectName === 'string' ? req.body.subjectName.trim() : 'General';
      const contextText = typeof req.body?.contextText === 'string' ? req.body.contextText.trim() : '';
      const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];

      if (!message) {
        res.status(400).json({ error: 'Please enter a question for the AI Study Assistant.' });
        return;
      }

      const trimmedHistory = rawHistory
        .slice(-8)
        .filter(
          (h: unknown): h is { role: 'user' | 'assistant'; text: string } =>
            typeof h === 'object' &&
            h !== null &&
            ('role' in h) &&
            ('text' in h) &&
            ((h as { role: string }).role === 'user' || (h as { role: string }).role === 'assistant') &&
            typeof (h as { text: unknown }).text === 'string'
        )
        .map((h: { role: 'user' | 'assistant'; text: string }) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text.slice(0, 1200)}`)
        .join('\n');

      const language = req.body?.language === 'bn' ? 'bn' : 'en';
      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            `Subject: ${subjectName}`,
            `Selected Material: ${sourceTitle}`,
            contextText ? `Reference Context:\n${contextText.slice(0, 6000)}` : '',
            trimmedHistory ? `Recent Conversation:\n${trimmedHistory}` : '',
            `Student Question: ${message}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
          config: {
            systemInstruction:
              'You are STUDYFLO AI, an encouraging, concise academic tutor. Ground your answer in the selected student note or syllabus material when relevant. Keep answers clear, structured with short paragraphs or bullet points, and directly actionable for studying.' +
              (language === 'bn'
                ? ' Respond in clear, natural Bangla (বাংলা) unless the student explicitly asks for English.'
                : ''),
          },
        })
      );

      const reply = (response.text ?? '').trim();
      if (!reply) {
        res.status(502).json({ error: 'The AI assistant returned an empty response. Please try again.' });
        return;
      }
      res.json({ reply });
    } catch (err) {
      sendApiError(res, err, 'Failed to get response from AI Study Assistant.');
    }
  });

  // 2. Generate Practice Questions from Notes or Syllabus Topics
  app.post('/api/ai/practice-questions', async (req: Request, res: Response) => {
    try {
      const sourceType = req.body?.sourceType === 'syllabus' ? 'syllabus' : 'note';
      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : 'Study Topic';
      const subjectName = typeof req.body?.subjectName === 'string' ? req.body.subjectName.trim() : 'General';
      const contextText = typeof req.body?.contextText === 'string' ? req.body.contextText.trim() : '';
      const count = Math.max(2, Math.min(6, Number(req.body?.count) || 4));
      const difficulty = ['foundational', 'exam', 'challenge'].includes(req.body?.difficulty)
        ? req.body.difficulty
        : 'exam';

      if (!contextText && !title) {
        res.status(400).json({ error: 'Provide a note or syllabus topic to generate practice questions.' });
        return;
      }

      const language = req.body?.language === 'bn' ? 'bn' : 'en';
      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Source Type: ${sourceType}\nSubject: ${subjectName}\nTopic / Title: ${title}\nDifficulty: ${difficulty}\nNumber of Questions: ${count}\nOutput Language: ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}\n\nStudy Material:\n${contextText.slice(0, 8000)}`,
          config: {
            systemInstruction:
              'You are STUDYFLO AI, an academic quiz generator. Create well-crafted multiple-choice practice questions grounded in the provided study material or syllabus topics. Each question must have exactly 4 distinct options, a valid 0-based correctIndex, a brief explanation of why the answer is correct, and a concise flashcardAnswer suitable for spaced-repetition flashcards.' +
              (language === 'bn'
                ? ' Write all questions, options, explanations, and flashcard answers in clear, natural Bangla (বাংলা).'
                : ''),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topicTitle: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      flashcardAnswer: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctIndex', 'explanation', 'flashcardAnswer'],
                  },
                },
              },
              required: ['topicTitle', 'questions'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      sendApiError(res, err, 'Failed to generate practice questions.');
    }
  });

  // 3. Explain Complex Concepts Briefly
  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    try {
      const concept = typeof req.body?.concept === 'string' ? req.body.concept.trim() : '';
      const subjectName = typeof req.body?.subjectName === 'string' ? req.body.subjectName.trim() : '';
      const contextText = typeof req.body?.contextText === 'string' ? req.body.contextText.trim() : '';
      const depth = ['brief', 'intuitive', 'step-by-step'].includes(req.body?.depth)
        ? req.body.depth
        : 'brief';

      if (!concept) {
        res.status(400).json({ error: 'Please enter a concept or topic to explain.' });
        return;
      }

      const language = req.body?.language === 'bn' ? 'bn' : 'en';
      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Concept to Explain: ${concept}\n${subjectName ? `Subject: ${subjectName}\n` : ''}Explanation Style: ${depth}\nOutput Language: ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}\n${contextText ? `Additional Context:\n${contextText.slice(0, 4000)}` : ''}`,
          config: {
            systemInstruction:
              'You are STUDYFLO AI, an expert tutor. Provide a crisp, accessible explanation tailored for students. Keep briefExplanation to 2-4 clear sentences, provide one memorable real-world analogy, one concrete worked example or formula application, and one common mistake to avoid.' +
              (language === 'bn'
                ? ' Write the entire explanation, analogy, worked example, and common mistake in clear, natural Bangla (বাংলা).'
                : ''),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                concept: { type: Type.STRING },
                briefExplanation: { type: Type.STRING },
                analogy: { type: Type.STRING },
                example: { type: Type.STRING },
                commonMistake: { type: Type.STRING },
              },
              required: ['concept', 'briefExplanation', 'analogy', 'example', 'commonMistake'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      sendApiError(res, err, 'Failed to explain concept.');
    }
  });

  // Download full STUDYFLO source code as a .zip archive
  app.get('/api/download-zip', (_req: Request, res: Response) => {
    const zipPath = path.resolve(__dirname, 'STUDYFLO-app.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'Zip archive not found.' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.download(zipPath, 'STUDYFLO-app.zip');
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`STUDYFLO server running on http://0.0.0.0:${port}`);
  });
}

createAppServer().catch((err) => {
  console.error('Failed to start STUDYFLO server:', err);
  process.exit(1);
});

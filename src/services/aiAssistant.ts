export interface NoteSummaryResponse {
  summary: string;
  keyTakeaways: string[];
  keyTerms: {
    term: string;
    definition: string;
  }[];
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  flashcardAnswer: string;
}

export interface PracticeQuestionsResponse {
  topicTitle: string;
  questions: PracticeQuestion[];
}

export interface ConceptExplanationResponse {
  concept: string;
  briefExplanation: string;
  analogy: string;
  example: string;
  commonMistake: string;
}

function buildOfflineSummary(params: {
  sourceType?: 'note' | 'syllabus';
  title: string;
  subjectName: string;
  content: string;
  language?: 'en' | 'bn';
}): NoteSummaryResponse {
  const isBangla = (params.language ?? 'bn') === 'bn';
  const cleanedLines = params.content
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').replace(/^\[[ xX]\]\s*/, '').trim())
    .filter((line) => line.length > 8);

  const sentences = params.content
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const summaryText =
    sentences.slice(0, 2).join(' ') ||
    (isBangla
      ? `“${params.title}” (${params.subjectName})-এর অফলাইন সারাংশ। আরও বিস্তারিত AI সারাংশের জন্য ইন্টারনেটে যুক্ত হোন।`
      : `Offline summary of "${params.title}" (${params.subjectName}). Reconnect to the internet for deeper Gemini AI analysis.`);

  const keyTakeaways =
    cleanedLines.length > 0
      ? cleanedLines.slice(0, 5)
      : [
          isBangla
            ? `${params.title}-এর মূল ধারণা ও গুরুত্বপূর্ণ পয়েন্টগুলো রিভিশন দিন।`
            : `Review core concepts under ${params.title}.`,
        ];

  const keyTerms = cleanedLines
    .filter((line) => line.includes(':') || line.includes('—') || line.includes('='))
    .slice(0, 4)
    .map((line) => {
      const [rawTerm, ...rest] = line.split(/[:—=]/);
      return {
        term: rawTerm.trim().slice(0, 48) || params.title,
        definition: rest.join(' ').trim() || line,
      };
    });

  return {
    summary: isBangla ? `[অফলাইন সারাংশ] ${summaryText}` : `[Offline Mode] ${summaryText}`,
    keyTakeaways,
    keyTerms:
      keyTerms.length > 0
        ? keyTerms
        : [
            {
              term: params.title,
              definition: isBangla
                ? `${params.subjectName} বিষয়ের অধীনে অফলাইনে সংরক্ষিত।`
                : `Stored offline under ${params.subjectName}. Connect online for full AI definitions.`,
            },
          ],
  };
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(
      'You are offline. Core STUDYFLO tools (Timer, Syllabus, Notes, Flashcards, Daily Goals) work 100% offline — reconnect for cloud AI.'
    );
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'No internet connection detected. Your notes, syllabus, timer, and flashcards remain fully available offline.'
    );
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof payload?.error === 'string' && payload.error.trim().length > 0
        ? payload.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function requestNoteSummary(params: {
  sourceType?: 'note' | 'syllabus';
  title: string;
  subjectName: string;
  content: string;
  language?: 'en' | 'bn';
}): Promise<NoteSummaryResponse> {
  const payload = { ...params, language: params.language ?? 'bn' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return buildOfflineSummary(payload);
  }
  try {
    return await postJson<NoteSummaryResponse>('/api/ai/summarize', payload);
  } catch (err) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return buildOfflineSummary(payload);
    }
    throw err;
  }
}

export function requestPracticeQuestions(params: {
  sourceType: 'note' | 'syllabus';
  title: string;
  subjectName: string;
  contextText: string;
  count?: number;
  difficulty?: 'foundational' | 'exam' | 'challenge';
  language?: 'en' | 'bn';
}): Promise<PracticeQuestionsResponse> {
  return postJson<PracticeQuestionsResponse>('/api/ai/practice-questions', params);
}

export function requestConceptExplanation(params: {
  concept: string;
  subjectName?: string;
  contextText?: string;
  depth?: 'brief' | 'intuitive' | 'step-by-step';
  language?: 'en' | 'bn';
}): Promise<ConceptExplanationResponse> {
  return postJson<ConceptExplanationResponse>('/api/ai/explain', params);
}

export interface StudyChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export function requestStudyChat(params: {
  message: string;
  history: StudyChatTurn[];
  sourceTitle: string;
  subjectName: string;
  contextText: string;
  language?: 'en' | 'bn';
}): Promise<{ reply: string }> {
  return postJson<{ reply: string }>('/api/ai/chat', params);
}

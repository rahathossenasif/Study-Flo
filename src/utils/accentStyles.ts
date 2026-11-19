import { SubjectAccent, NoteTint, PriorityLevel } from '../types/studyflow';

export const SUBJECT_ACCENTS: Record<
  SubjectAccent,
  {
    bg: string;
    softBg: string;
    text: string;
    bar: string;
    ring: string;
    hex: string;
  }
> = {
  purple: {
    bg: 'bg-[#7C3AED]',
    softBg: 'bg-[#7C3AED]/15 dark:bg-[#7C3AED]/20',
    text: 'text-[#7C3AED] dark:text-[#A78BFA]',
    bar: 'from-[#7C3AED] to-[#A855F7]',
    ring: 'stroke-[#7C3AED]',
    hex: '#7C3AED',
  },
  cyan: {
    bg: 'bg-[#06B6D4]',
    softBg: 'bg-[#06B6D4]/15 dark:bg-[#06B6D4]/20',
    text: 'text-[#0891B2] dark:text-[#22D3EE]',
    bar: 'from-[#06B6D4] to-[#3B82F6]',
    ring: 'stroke-[#06B6D4]',
    hex: '#06B6D4',
  },
  blue: {
    bg: 'bg-[#3B82F6]',
    softBg: 'bg-[#3B82F6]/15 dark:bg-[#3B82F6]/20',
    text: 'text-[#2563EB] dark:text-[#60A5FA]',
    bar: 'from-[#3B82F6] to-[#6366F1]',
    ring: 'stroke-[#3B82F6]',
    hex: '#3B82F6',
  },
  amber: {
    bg: 'bg-[#F59E0B]',
    softBg: 'bg-[#F59E0B]/15 dark:bg-[#F59E0B]/20',
    text: 'text-[#D97706] dark:text-[#FBBF24]',
    bar: 'from-[#F59E0B] to-[#F97316]',
    ring: 'stroke-[#F59E0B]',
    hex: '#F59E0B',
  },
  emerald: {
    bg: 'bg-[#10B981]',
    softBg: 'bg-[#10B981]/15 dark:bg-[#10B981]/20',
    text: 'text-[#059669] dark:text-[#34D399]',
    bar: 'from-[#10B981] to-[#06B6D4]',
    ring: 'stroke-[#10B981]',
    hex: '#10B981',
  },
  rose: {
    bg: 'bg-[#F43F5E]',
    softBg: 'bg-[#F43F5E]/15 dark:bg-[#F43F5E]/20',
    text: 'text-[#E11D48] dark:text-[#FB7185]',
    bar: 'from-[#F43F5E] to-[#A855F7]',
    ring: 'stroke-[#F43F5E]',
    hex: '#F43F5E',
  },
};

export const NOTE_TINTS: Record<
  NoteTint,
  {
    cardClass: string;
    titleClass: string;
    bodyClass: string;
    metaClass: string;
    swatch: string;
  }
> = {
  amber: {
    cardClass:
      'bg-gradient-to-br from-[#FFFBEB] via-[#FFF8E6] to-white dark:from-[#2C2111] dark:via-[#1E1719] dark:to-[#18131E] border-amber-200/75 dark:border-amber-500/25 shadow-[0_4px_18px_-6px_rgba(217,119,6,0.12)] dark:shadow-none',
    titleClass: 'text-amber-950 dark:text-amber-100',
    bodyClass: 'text-amber-950/75 dark:text-amber-100/75',
    metaClass: 'text-amber-700/90 dark:text-amber-300/75',
    swatch: '#F59E0B',
  },
  indigo: {
    cardClass:
      'bg-gradient-to-br from-[#EEF2FF] via-[#F5F7FF] to-white dark:from-[#161B3B] dark:via-[#121530] dark:to-[#101226] border-indigo-200/75 dark:border-indigo-400/25 shadow-[0_4px_18px_-6px_rgba(79,70,229,0.11)] dark:shadow-none',
    titleClass: 'text-indigo-950 dark:text-indigo-100',
    bodyClass: 'text-slate-700 dark:text-slate-300',
    metaClass: 'text-indigo-600/90 dark:text-indigo-300/80',
    swatch: '#6366F1',
  },
  purple: {
    cardClass:
      'bg-gradient-to-br from-[#F5F3FF] via-[#FAF7FF] to-white dark:from-[#211338] dark:via-[#18122E] dark:to-[#111124] border-purple-200/75 dark:border-purple-400/25 shadow-[0_4px_18px_-6px_rgba(124,58,237,0.12)] dark:shadow-none',
    titleClass: 'text-purple-950 dark:text-purple-100',
    bodyClass: 'text-slate-700 dark:text-slate-300',
    metaClass: 'text-purple-700/90 dark:text-purple-300/80',
    swatch: '#7C3AED',
  },
  cyan: {
    cardClass:
      'bg-gradient-to-br from-[#ECFEFF] via-[#F2FCFF] to-white dark:from-[#0E2433] dark:via-[#0F1B2C] dark:to-[#101325] border-cyan-200/75 dark:border-cyan-400/25 shadow-[0_4px_18px_-6px_rgba(6,182,212,0.12)] dark:shadow-none',
    titleClass: 'text-cyan-950 dark:text-cyan-100',
    bodyClass: 'text-slate-700 dark:text-slate-300',
    metaClass: 'text-cyan-700/90 dark:text-cyan-300/80',
    swatch: '#06B6D4',
  },
  emerald: {
    cardClass:
      'bg-gradient-to-br from-[#ECFDF5] via-[#F3FDF8] to-white dark:from-[#102624] dark:via-[#101B23] dark:to-[#111224] border-emerald-200/75 dark:border-emerald-400/25 shadow-[0_4px_18px_-6px_rgba(16,185,129,0.12)] dark:shadow-none',
    titleClass: 'text-emerald-950 dark:text-emerald-100',
    bodyClass: 'text-slate-700 dark:text-slate-300',
    metaClass: 'text-emerald-700/90 dark:text-emerald-300/80',
    swatch: '#10B981',
  },
};

export const PRIORITY_LABEL: Record<PriorityLevel, { text: string; colorClass: string }> = {
  high: { text: 'High priority', colorClass: 'text-rose-600 dark:text-rose-400' },
  medium: { text: 'Medium priority', colorClass: 'text-amber-600 dark:text-amber-400' },
  low: { text: 'Low priority', colorClass: 'text-slate-500 dark:text-slate-400' },
};

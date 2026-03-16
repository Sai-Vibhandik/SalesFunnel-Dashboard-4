import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStageColor(stage) {
  const colors = {
    onboarding: 'bg-blue-100 text-blue-800',
    marketResearch: 'bg-purple-100 text-purple-800',
    offerEngineering: 'bg-orange-100 text-orange-800',
    trafficStrategy: 'bg-green-100 text-green-800',
    landingPage: 'bg-pink-100 text-pink-800',
    creativeStrategy: 'bg-indigo-100 text-indigo-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}

export function getStageName(stageKey) {
  const names = {
    onboarding: 'Customer Onboarding',
    marketResearch: 'Market Research',
    offerEngineering: 'Offer Engineering',
    trafficStrategy: 'Traffic Strategy',
    landingPage: 'Landing Page & Lead Capture',
    creativeStrategy: 'Creative Strategy Execution',
  };
  return names[stageKey] || stageKey;
}

export function calculateProgress(stages) {
  if (!stages) return 0;
  const stageKeys = Object.keys(stages);
  const completedStages = stageKeys.filter(key => stages[key]?.isCompleted).length;
  return Math.round((completedStages / stageKeys.length) * 100);
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getProgressColor(progress) {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const STAGE_ORDER = [
  'onboarding',
  'marketResearch',
  'offerEngineering',
  'trafficStrategy',
  'landingPage',
  'creativeStrategy',
];

export const STAGE_LABELS = {
  onboarding: 'Onboarding',
  marketResearch: 'Market Research',
  offerEngineering: 'Offer Engineering',
  trafficStrategy: 'Traffic Strategy',
  landingPage: 'Landing Page',
  creativeStrategy: 'Creative Strategy',
};
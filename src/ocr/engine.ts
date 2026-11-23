import Tesseract from 'tesseract.js';
import { formatLanguageSpec, languageLabel } from '../lib/languages';
import type { OcrDocument } from '../types';
import { mapRecognition } from './mapResult';
import { progressFraction, progressLabel } from './progress';

const CACHE_PATH = 'devistic-ocr';

export interface EngineProgress {
  label: string;
  fraction: number;
}

type Worker = Tesseract.Worker;

let worker: Worker | null = null;
let loadedLanguage: string | null = null;
let starting: Promise<void> | null = null;
let onLog: (status: string, progress: number) => void = () => {};

export async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  language: string,
  onProgress: (update: EngineProgress) => void,
): Promise<OcrDocument> {
  const spec = formatLanguageSpec(language);
  const label = languageLabel(spec);
  onLog = (status, progress) => {
    onProgress({ label: progressLabel(status, label), fraction: progressFraction(progress) });
  };
  try {
    const instance = await ensureWorker(spec);
    const result = await instance.recognize(canvas, {}, { text: true, blocks: true });
    return mapRecognition(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR failed';
    if (/fetch|network|load|download|worker/i.test(message)) {
      throw new Error(`Could not download the OCR engine or the ${label} language data. Check your connection and try again. The image was not uploaded.`);
    }
    throw error instanceof Error ? error : new Error('OCR failed.');
  }
}

async function ensureWorker(language: string): Promise<Worker> {
  if (worker && loadedLanguage === language) return worker;
  if (worker && loadedLanguage !== language) {
    onLog('loading language traineddata', 0);
    await worker.reinitialize(language);
    await applyParameters(worker);
    loadedLanguage = language;
    return worker;
  }
  if (!starting) {
    starting = (async () => {
      const created = await Tesseract.createWorker(language, Tesseract.OEM.LSTM_ONLY, {
        cachePath: CACHE_PATH,
        logger: (message) => onLog(message.status, message.progress),
      });
      await applyParameters(created);
      worker = created;
      loadedLanguage = language;
    })();
  }
  try {
    await starting;
  } catch (error) {
    starting = null;
    worker = null;
    loadedLanguage = null;
    throw error;
  }
  if (!worker) throw new Error('The OCR engine did not start.');
  return worker;
}

function applyParameters(instance: Worker): Promise<unknown> {
  return instance.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: '1',
  });
}

export async function terminateEngine(): Promise<void> {
  const current = worker;
  worker = null;
  loadedLanguage = null;
  starting = null;
  if (!current) return;
  try {
    await current.terminate();
  } catch {
    /* The worker may already have stopped. */
  }
}

export const LANGUAGE_CACHE_PREFIX = `${CACHE_PATH}/`;

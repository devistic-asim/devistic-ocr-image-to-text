import { useEffect, useRef, useState } from 'react';
import { Controls } from './components/Controls';
import { DropZone } from './components/DropZone';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { Preview } from './components/Preview';
import { PrivacyNotice } from './components/PrivacyNotice';
import { QueueList } from './components/QueueList';
import { ResultPanel } from './components/ResultPanel';
import { clearLanguageCache, clearOwnStorage } from './lib/cache';
import { downloadText, historyAsText, resultJson, resultMarkdown, safeBaseName } from './lib/export';
import { languageLabel } from './lib/languages';
import { preserveLayout, reflowText, weightedConfidence } from './lib/layout';
import { loadHtmlImage, renderProcessed, thumbnailDataUrl } from './lib/preprocess';
import {
  HISTORY_LIMIT,
  NOTICE_KEY,
  THEME_KEY,
  defaultBundle,
  loadBundle,
  mergeBundles,
  parseBundle,
  parseTheme,
  saveBundle,
  serializeBundle,
  type DataBundle,
  type HistoryEntry,
  type OutputMode,
  type Settings,
  type ThemeMode,
} from './lib/storage';
import { recognizeCanvas, terminateEngine } from './ocr/engine';
import type { CropRect, QueueItem, Recognition } from './types';

const QUEUE_LIMIT = 20;

export default function App() {
  const stored = useRef(loadBundle(localStorage)).current;
  const [theme, setTheme] = useState<ThemeMode>(() => parseTheme(localStorage.getItem(THEME_KEY) ?? stored.theme));
  const [settings, setSettings] = useState<Settings>(stored.settings);
  const [history, setHistory] = useState<HistoryEntry[]>(stored.history);
  const [noticeOn, setNoticeOn] = useState(() => localStorage.getItem(NOTICE_KEY) !== '1');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archive, setArchive] = useState<HistoryEntry | null>(null);
  const [running, setRunning] = useState(false);
  const [cropEditing, setCropEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const itemsRef = useRef(items);
  const settingsRef = useRef(settings);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const addFilesRef = useRef<(files: File[]) => void>(() => {});
  itemsRef.current = items;
  settingsRef.current = settings;

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const shown = archive ? historyItem(archive) : selected;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.themeMode = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1220' : '#F5F9FC');
    };
    apply();
    localStorage.setItem(THEME_KEY, theme);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const bundle: DataBundle = { ...defaultBundle(), theme, settings, history, exportedAt: new Date().toISOString() };
    saveBundle(localStorage, bundle);
  }, [theme, settings, history]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 7000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = filesFromList(event.clipboardData?.files);
      if (files.length === 0) return;
      event.preventDefault();
      addFilesRef.current(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files');
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const leave = () => {
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        setDragging(false);
      }
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      addFilesRef.current(filesFromList(event.dataTransfer?.files));
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  useEffect(() => () => {
    for (const item of itemsRef.current) {
      if (item.revoke) URL.revokeObjectURL(item.sourceUrl);
    }
    void terminateEngine();
  }, []);

  const previewToken = selected
    ? [
      selected.id,
      selected.sourceUrl,
      selected.rotation,
      selected.skew,
      selected.crop?.x ?? '',
      selected.crop?.y ?? '',
      selected.crop?.w ?? '',
      selected.crop?.h ?? '',
      settings.grayscale,
      settings.contrast,
      cropEditing,
    ].join(':')
    : '';

  useEffect(() => {
    if (!previewToken) return;
    const item = itemsRef.current.find((entry) => entry.id === selectedId);
    if (!item) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const image = await loadHtmlImage(item.sourceUrl);
          if (cancelled) return;
          const options = settingsRef.current;
          const canvas = renderProcessed(image, image.naturalWidth, image.naturalHeight, {
            grayscale: options.grayscale,
            contrast: options.contrast,
            rotation: item.rotation,
            skew: item.skew,
            crop: item.crop,
            applyCrop: !previewToken.endsWith(':true'),
          });
          const previewUrl = canvas.toDataURL('image/jpeg', 0.86);
          if (cancelled) return;
          setItems((current) => current.map((entry) => (
            entry.id === item.id && entry.status !== 'running'
              ? { ...entry, previewUrl }
              : entry
          )));
        } catch (error) {
          if (cancelled) return;
          const text = error instanceof Error ? error.message : 'Could not read that image.';
          setItems((current) => current.map((entry) => (
            entry.id === item.id ? { ...entry, status: 'error', error: text, progressLabel: 'Failed' } : entry
          )));
        }
      })();
    }, 90);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [previewToken, selectedId]);

  function addFiles(files: File[]) {
    const images = files.filter(isImage);
    if (images.length === 0) {
      setMessage('Use a PNG, JPEG, WEBP, GIF, or BMP.');
      return;
    }
    const room = QUEUE_LIMIT - itemsRef.current.length;
    const accepted = images.slice(0, Math.max(0, room));
    if (accepted.length === 0) {
      setMessage(`The queue holds ${QUEUE_LIMIT} images.`);
      return;
    }
    if (accepted.length < images.length) setMessage(`The queue holds ${QUEUE_LIMIT} images.`);
    const next = accepted.map<QueueItem>((file) => ({
      id: crypto.randomUUID(),
      name: file.name || `pasted-${Date.now()}.png`,
      sourceUrl: URL.createObjectURL(file),
      revoke: true,
      rotation: 0,
      skew: 0,
      crop: null,
      status: 'ready',
      progress: 0,
      progressLabel: 'Ready',
    }));
    setItems((current) => [...current, ...next]);
    setSelectedId(next[0].id);
    setArchive(null);
    setCropEditing(false);
  }
  addFilesRef.current = addFiles;

  function removeItem(id: string) {
    setItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item?.revoke) URL.revokeObjectURL(item.sourceUrl);
      const next = current.filter((entry) => entry.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  async function extract(mode: 'all' | 'selected') {
    if (runningRef.current) return;
    const ids = mode === 'selected'
      ? [selectedId].filter((id): id is string => Boolean(id))
      : itemsRef.current.map((item) => item.id);
    if (ids.length === 0) {
      setMessage('Add an image first.');
      return;
    }
    runningRef.current = true;
    cancelRef.current = false;
    setRunning(true);
    setArchive(null);
    try {
      for (const id of ids) {
        if (cancelRef.current) break;
        const item = itemsRef.current.find((entry) => entry.id === id);
        if (!item) continue;
        const options = settingsRef.current;
        patch(id, { status: 'running', progress: 0, progressLabel: 'Starting', error: undefined });
        try {
          const image = await loadHtmlImage(item.sourceUrl);
          const canvas = renderProcessed(image, image.naturalWidth, image.naturalHeight, {
            grayscale: options.grayscale,
            contrast: options.contrast,
            rotation: item.rotation,
            skew: item.skew,
            crop: item.crop,
            applyCrop: true,
          });
          const documentResult = await recognizeCanvas(canvas, options.language, (update) => {
            patch(id, { progress: update.fraction, progressLabel: update.label });
          });
          if (cancelRef.current) {
            patch(id, { status: 'ready', progress: 0, progressLabel: 'Stopped' });
            break;
          }
          const layoutText = preserveLayout(documentResult.blocks) || documentResult.text;
          const plainText = reflowText(documentResult.blocks) || documentResult.text;
          const fromWords = weightedConfidence(documentResult.blocks);
          const confidence = fromWords > 0 ? fromWords : documentResult.confidence;
          const historyId = crypto.randomUUID();
          const recognition: Recognition = {
            layoutText,
            plainText,
            confidence,
            width: canvas.width,
            height: canvas.height,
            blocks: documentResult.blocks,
            language: options.language,
            grayscale: options.grayscale,
            contrast: options.contrast,
            rotation: item.rotation,
            skew: item.skew,
            crop: item.crop,
            historyId,
          };
          const previewUrl = canvas.toDataURL('image/jpeg', 0.86);
          patch(id, { status: 'done', progress: 1, progressLabel: 'Done', recognition, previewUrl, error: undefined });
          const entry: HistoryEntry = {
            id: historyId,
            createdAt: new Date().toISOString(),
            fileName: item.name,
            language: options.language,
            confidence,
            layoutText,
            plainText,
            preview: thumbnailDataUrl(canvas),
          };
          setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
          setSelectedId(id);
        } catch (error) {
          if (cancelRef.current) {
            patch(id, { status: 'ready', progress: 0, progressLabel: 'Stopped' });
            break;
          }
          const text = error instanceof Error ? error.message : 'OCR failed.';
          patch(id, { status: 'error', error: text, progressLabel: 'Failed' });
        }
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
      cancelRef.current = false;
    }
  }

  function patch(id: string, partial: Partial<QueueItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  }

  function updateSelected(partial: Partial<QueueItem>) {
    if (!selectedId) return;
    setArchive(null);
    patch(selectedId, partial);
  }

  async function paste() {
    if (!navigator.clipboard?.read) {
      setMessage('Press Ctrl+V or ⌘V. This browser does not support the Paste button.');
      return;
    }
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files: File[] = [];
      for (const clipboardItem of clipboardItems) {
        const type = clipboardItem.types.find((entry) => entry.startsWith('image/'));
        if (!type) continue;
        const blob = await clipboardItem.getType(type);
        const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
        files.push(new File([blob], `pasted-${Date.now()}.${extension}`, { type }));
      }
      if (files.length === 0) {
        setMessage('The clipboard has no image. Copy one, then press Ctrl+V or ⌘V.');
        return;
      }
      addFiles(files);
    } catch {
      setMessage('Clipboard access was blocked. Click the page and press Ctrl+V or ⌘V.');
    }
  }

  async function addSample() {
    const response = await fetch(`${import.meta.env.BASE_URL}samples/sample-page.png`);
    if (!response.ok) {
      setMessage('The sample image is missing.');
      return;
    }
    const blob = await response.blob();
    addFiles([new File([blob], 'sample-page.png', { type: 'image/png' })]);
  }

  async function addBilingualSample() {
    setSettings((current) => ({ ...current, language: 'urd+eng' }));
    const response = await fetch(`${import.meta.env.BASE_URL}samples/sample-bilingual.png`);
    if (!response.ok) {
      setMessage('The Urdu and English sample is missing.');
      return;
    }
    const blob = await response.blob();
    addFiles([new File([blob], 'sample-bilingual.png', { type: 'image/png' })]);
    setMessage('Urdu + English is selected. Extract text to read both scripts. The first run downloads both language files.');
  }

  function currentText(): string {
    if (!shown?.recognition) return '';
    return settings.outputMode === 'layout' ? shown.recognition.layoutText : shown.recognition.plainText;
  }

  async function copyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.querySelector<HTMLTextAreaElement>('#output textarea');
      area?.focus();
      area?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function download(kind: 'txt' | 'md' | 'json') {
    const recognition = shown?.recognition;
    if (!recognition || !shown) return;
    const base = safeBaseName(shown.name);
    if (kind === 'txt') {
      downloadText(`${base}.txt`, `${currentText()}\n`, 'text/plain;charset=utf-8');
      return;
    }
    if (kind === 'md') {
      downloadText(`${base}.md`, resultMarkdown({
        fileName: shown.name,
        language: recognition.language,
        confidence: recognition.confidence,
        layoutText: recognition.layoutText,
        plainText: recognition.plainText,
      }), 'text/markdown;charset=utf-8');
      return;
    }
    downloadText(`${base}.json`, resultJson({
      fileName: shown.name,
      language: recognition.language,
      confidence: recognition.confidence,
      width: recognition.width,
      height: recognition.height,
      layoutText: recognition.layoutText,
      plainText: recognition.plainText,
      blocks: recognition.blocks,
    }), 'application/json');
  }

  function editText(value: string) {
    const key = settings.outputMode === 'layout' ? 'layoutText' : 'plainText';
    if (archive) {
      const next = { ...archive, [key]: value };
      setArchive(next);
      setHistory((current) => current.map((entry) => (entry.id === archive.id ? next : entry)));
      return;
    }
    if (!selected?.recognition) return;
    const recognition = { ...selected.recognition, [key]: value };
    patch(selected.id, { recognition });
    setHistory((current) => current.map((entry) => (
      entry.id === recognition.historyId ? { ...entry, [key]: value } : entry
    )));
  }

  function exportJson() {
    const bundle: DataBundle = {
      ...defaultBundle(),
      theme,
      settings,
      history,
      exportedAt: new Date().toISOString(),
    };
    downloadText('devistic-ocr-data.json', serializeBundle(bundle), 'application/json');
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = parseBundle(String(reader.result ?? ''));
        const merged = mergeBundles({ ...defaultBundle(), theme, settings, history }, incoming);
        setTheme(merged.theme);
        setSettings(merged.settings);
        setHistory(merged.history);
        setMessage(`Imported ${incoming.history.length} saved result${incoming.history.length === 1 ? '' : 's'}.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not import that file.');
      }
    };
    reader.readAsText(file);
  }

  async function clearLocal() {
    await terminateEngine();
    clearOwnStorage(localStorage);
    await clearLanguageCache();
    setTheme('system');
    setSettings(defaultBundle().settings);
    setHistory([]);
    setArchive(null);
    setNoticeOn(true);
    setConfirmClear(false);
    setMessage('Local data cleared. Language files download again the next time you extract text.');
  }

  const stale = Boolean(shown?.recognition && selected && !archive && !processMatches(selected, settings));

  return (
    <div className="app">
      <Header theme={theme} onTheme={setTheme} />
      {noticeOn && (
        <PrivacyNotice onDismiss={() => {
          localStorage.setItem(NOTICE_KEY, '1');
          setNoticeOn(false);
        }} />
      )}
      <main className="page">
        <DropZone
          compact={items.length > 0}
          onBrowse={() => fileRef.current?.click()}
          onPaste={() => void paste()}
          onSample={() => void addSample()}
          onBilingualSample={() => void addBilingualSample()}
        />
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          multiple
          aria-label="Upload images"
          onChange={(event) => {
            addFiles([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
        <QueueList
          items={items}
          selectedId={archive ? null : selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setArchive(null);
            setCropEditing(false);
          }}
          onRemove={removeItem}
        />
        <Controls
          settings={settings}
          item={selected}
          running={running}
          onSettings={(patchSettings) => setSettings((current) => ({ ...current, ...patchSettings }))}
          onExtract={() => void extract('all')}
          onRerun={() => void extract('selected')}
          onStop={() => {
            cancelRef.current = true;
            void terminateEngine();
          }}
        />
        {message && <p className="message" role="status">{message}</p>}
        <div className="work">
          <Preview
            item={archive ? shown : selected}
            showBoxes={settings.showBoxes}
            boxesMatch={!archive && processMatches(selected, settings)}
            cropEditing={cropEditing && !archive}
            onRotate={(delta) => updateSelected({ rotation: (selected?.rotation ?? 0) + delta })}
            onResetRotation={() => updateSelected({ rotation: 0, skew: 0 })}
            onSkew={(skew) => updateSelected({ skew })}
            onCropEditing={setCropEditing}
            onCrop={(crop: CropRect | null) => updateSelected({ crop })}
            onCopyWord={(word) => void copyText(word)}
          />
          <ResultPanel
            item={shown}
            mode={settings.outputMode}
            copied={copied}
            onMode={(outputMode: OutputMode) => setSettings((current) => ({ ...current, outputMode }))}
            onChangeText={editText}
            onCopy={() => void copyText(currentText())}
            onDownload={download}
          />
        </div>
        {stale && (
          <p className="fine">Language or pre-processing changed. Re-run the selected image to refresh the text.</p>
        )}
        <details className="layout-help">
          <summary>How layout preservation works</summary>
          <div>
            <p>
              Tesseract returns more than a string. Each word has a box, and those words sit on lines, in paragraphs, in blocks.
              Layout mode turns the boxes back into text: it estimates a character width, then puts each word in the column
              <code> round((left − margin) / character width) </code>.
              Lines that share a vertical band stay on one row, so two columns keep the gap between them. A taller gap becomes a blank line.
              Indents stay as leading spaces.
            </p>
            <p>
              Plain mode does the opposite. It reads a full-width title first, then the left column from top to bottom, then the right column,
              and it joins wrapped lines into paragraphs. A hyphen at the end of a line is glued to the next line when that line starts with a letter.
            </p>
            <p>
              Right-to-left words are wrapped in Unicode isolates so the browser does not pull columns back together,
              including when a line mixes Urdu or Arabic with English. Plain text uses per-paragraph direction.
              The current languages are {languageLabel(settings.language)} ({settings.language}).
              Word boxes are colored by confidence: green from 85%, yellow from 70%, red below that.
            </p>
          </div>
        </details>
        <HistoryPanel
          entries={history}
          onOpen={(entry) => {
            setArchive(entry);
            setCropEditing(false);
          }}
          onRemove={(id) => {
            setHistory((current) => current.filter((entry) => entry.id !== id));
            if (archive?.id === id) setArchive(null);
          }}
          onExportJson={exportJson}
          onExportText={() => downloadText('devistic-ocr-history.txt', historyAsText(history), 'text/plain;charset=utf-8')}
          onImport={() => importRef.current?.click()}
        />
        <input
          ref={importRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          aria-label="Import JSON"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImportFile(file);
            event.target.value = '';
          }}
        />
      </main>
      <Footer
        confirming={confirmClear}
        onAskClear={() => setConfirmClear(true)}
        onCancelClear={() => setConfirmClear(false)}
        onClear={() => void clearLocal()}
      />
      {dragging && <div className="drop-overlay" role="status">Drop images to add them to the queue</div>}
      <p className="sr-only" aria-live="polite">{running ? selected?.progressLabel : message}</p>
    </div>
  );
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.name);
}

function filesFromList(list: FileList | undefined | null): File[] {
  return [...(list ?? [])].filter(isImage);
}

function processMatches(item: QueueItem | null, settings: Settings): boolean {
  const recognition = item?.recognition;
  if (!item || !recognition) return false;
  const sameCrop = (recognition.crop?.x ?? null) === (item.crop?.x ?? null)
    && (recognition.crop?.y ?? null) === (item.crop?.y ?? null)
    && (recognition.crop?.w ?? null) === (item.crop?.w ?? null)
    && (recognition.crop?.h ?? null) === (item.crop?.h ?? null);
  return recognition.language === settings.language
    && recognition.grayscale === settings.grayscale
    && Math.abs(recognition.contrast - settings.contrast) < 0.02
    && recognition.rotation === item.rotation
    && recognition.skew === item.skew
    && sameCrop;
}

function historyItem(entry: HistoryEntry): QueueItem {
  return {
    id: entry.id,
    name: entry.fileName,
    sourceUrl: entry.preview ?? '',
    revoke: false,
    rotation: 0,
    skew: 0,
    crop: null,
    status: 'done',
    progress: 1,
    progressLabel: 'Saved',
    previewUrl: entry.preview,
    recognition: {
      layoutText: entry.layoutText,
      plainText: entry.plainText,
      confidence: entry.confidence,
      width: 1,
      height: 1,
      blocks: [],
      language: entry.language,
      grayscale: false,
      contrast: 1,
      rotation: 0,
      skew: 0,
      crop: null,
      historyId: entry.id,
    },
  };
}

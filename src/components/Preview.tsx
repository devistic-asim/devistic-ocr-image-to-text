import { useRef, useState } from 'react';
import { normalizeCrop } from '../lib/preprocess';
import type { CropRect, QueueItem } from '../types';
import { Hint } from './Hint';

export function Preview({
  item,
  showBoxes,
  boxesMatch,
  cropEditing,
  onRotate,
  onResetRotation,
  onSkew,
  onCropEditing,
  onCrop,
  onCopyWord,
}: {
  item: QueueItem | null;
  showBoxes: boolean;
  boxesMatch: boolean;
  cropEditing: boolean;
  onRotate: (delta: number) => void;
  onResetRotation: () => void;
  onSkew: (value: number) => void;
  onCropEditing: (editing: boolean) => void;
  onCrop: (crop: CropRect | null) => void;
  onCopyWord: (word: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<CropRect | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  function pointer(event: React.PointerEvent): { x: number; y: number } | null {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  const crop = draft ?? (cropEditing ? item?.crop ?? null : null);
  const words = boxesMatch && showBoxes && !cropEditing ? flattenWords(item) : [];

  return (
    <section className="preview" aria-label="Image">
      <div className="tool-row">
        <button type="button" className="btn btn-ghost" onClick={() => onRotate(-90)} disabled={!item}>
          Rotate left
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onRotate(90)} disabled={!item}>
          Rotate right
        </button>
        <button type="button" className="btn btn-ghost" onClick={onResetRotation} disabled={!item}>
          Reset rotation
        </button>
        <Hint text="Quarter-turns fix a sideways photo. Straighten is for a page that is only a little tilted. Re-run after you change either one." />
      </div>
      <label className="field">
        <span>Straighten <strong>{item ? `${item.skew > 0 ? '+' : ''}${item.skew}°` : '0°'}</strong></span>
        <input
          type="range"
          name="straighten"
          min={-12}
          max={12}
          step={1}
          value={item?.skew ?? 0}
          disabled={!item}
          onChange={(event) => onSkew(Number(event.target.value))}
          aria-valuetext={`${item?.skew ?? 0} degrees`}
        />
      </label>
      <div className="tool-row">
        <button
          type="button"
          className="btn btn-ghost"
          aria-pressed={cropEditing}
          disabled={!item}
          onClick={() => onCropEditing(!cropEditing)}
        >
          {cropEditing ? 'Done cropping' : 'Crop'}
        </button>
        <button type="button" className="btn btn-ghost" disabled={!item?.crop} onClick={() => onCrop(null)}>
          Clear crop
        </button>
        <Hint text="Drag a rectangle on the image to ignore margins, or set the edges as percentages below. Crop is per image." />
      </div>
      {cropEditing && item && (
        <div className="crop-fields">
          <CropNumber label="Left" value={percent(item.crop?.x)} onChange={(value) => setEdge(item.crop, 'x', value, onCrop)} />
          <CropNumber label="Top" value={percent(item.crop?.y)} onChange={(value) => setEdge(item.crop, 'y', value, onCrop)} />
          <CropNumber label="Width" value={item.crop ? percent(item.crop.w) : 100} onChange={(value) => setEdge(item.crop, 'w', value, onCrop)} />
          <CropNumber label="Height" value={item.crop ? percent(item.crop.h) : 100} onChange={(value) => setEdge(item.crop, 'h', value, onCrop)} />
        </div>
      )}

      <div
        className={`frame ${cropEditing ? 'is-cropping' : ''}`}
        ref={frameRef}
        onPointerDown={(event) => {
          if (!cropEditing) return;
          const start = pointer(event);
          if (!start) return;
          drag.current = start;
          setDraft({ x: start.x, y: start.y, w: 0, h: 0 });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const point = pointer(event);
          if (!point) return;
          const next = normalizeCrop(drag.current.x, drag.current.y, point.x, point.y);
          setDraft(next ?? { x: drag.current.x, y: drag.current.y, w: 0, h: 0 });
        }}
        onPointerUp={(event) => {
          if (!drag.current) return;
          const point = pointer(event);
          const next = point ? normalizeCrop(drag.current.x, drag.current.y, point.x, point.y) : null;
          drag.current = null;
          setDraft(null);
          if (next) onCrop(next);
        }}
      >
        {item?.previewUrl ? (
          <img src={item.previewUrl} alt={item.name} />
        ) : (
          <p className="frame-empty">{item ? 'Preparing preview…' : 'Your image will show up here.'}</p>
        )}
        {crop && crop.w > 0 && crop.h > 0 && (
          <div
            className="crop-rect"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
          />
        )}
        {words.map((word, index) => (
          <button
            key={`${word.text}-${index}`}
            type="button"
            className={`word-box ${band(word.confidence)}`}
            style={{
              left: `${(word.bbox.x0 / word.width) * 100}%`,
              top: `${(word.bbox.y0 / word.height) * 100}%`,
              width: `${((word.bbox.x1 - word.bbox.x0) / word.width) * 100}%`,
              height: `${((word.bbox.y1 - word.bbox.y0) / word.height) * 100}%`,
            }}
            aria-label={`Copy ${word.text}, ${Math.round(word.confidence)} percent confidence`}
            onClick={() => onCopyWord(word.text)}
          />
        ))}
      </div>
      {item?.recognition && !boxesMatch && (
        <p className="fine">Pre-processing changed. Re-run to refresh the text and the boxes.</p>
      )}
    </section>
  );
}

function CropNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        name={`crop-${label.toLowerCase()}`}
        min={0}
        max={100}
        step={1}
        value={Math.round(value)}
        aria-label={`${label} percent`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function percent(value: number | undefined): number {
  return Math.round((value ?? 0) * 100);
}

function setEdge(
  crop: CropRect | null,
  edge: keyof CropRect,
  percentValue: number,
  onCrop: (crop: CropRect | null) => void,
) {
  const current = crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const next = { ...current, [edge]: Math.min(1, Math.max(0, percentValue / 100)) };
  if (next.x + next.w > 1) next.w = 1 - next.x;
  if (next.y + next.h > 1) next.h = 1 - next.y;
  if (next.w < 0.02 || next.h < 0.02) return;
  onCrop(next);
}

function band(confidence: number): string {
  if (confidence >= 85) return 'high';
  if (confidence >= 70) return 'mid';
  return 'low';
}

function flattenWords(item: QueueItem | null) {
  const recognition = item?.recognition;
  if (!recognition) return [];
  const words = [];
  for (const block of recognition.blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          words.push({ ...word, width: recognition.width, height: recognition.height });
        }
      }
    }
  }
  return words;
}

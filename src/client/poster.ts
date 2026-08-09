import { getCategoryName } from '../categories.js';
import type { Language, TranslateFn, Wish } from './types.js';

interface PosterOptions {
  language: Language;
  t: TranslateFn;
}

interface PosterResult {
  blob: Blob;
  filename: string;
}

function wrapPosterText(
  context: CanvasRenderingContext2D,
  value: string | undefined,
  maxWidth: number,
  maxLines: number
): string[] {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return [];

  const pattern =
    /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]|\s+|[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g;
  const tokens = text.match(pattern) || [];

  const lines: string[] = [];
  let currentLine = '';
  let i = 0;

  for (; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (!currentLine && /^\s+$/.test(token)) {
      continue;
    }

    const candidate = currentLine + token;
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      if (lines.length === maxLines) {
        break;
      }
      currentLine = /^\s+$/.test(token) ? '' : token;
    }
  }

  if (lines.length < maxLines && currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length === maxLines && (currentLine.trim() || i < tokens.length)) {
    let lastLine = lines[lines.length - 1];
    while (lastLine.length > 0 && context.measureText(`${lastLine}…`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    lines[lines.length - 1] = `${lastLine}…`;
  }

  return lines;
}

function drawPosterLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
): void {
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
}

function drawDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  context.save();
  context.translate(x, y);
  context.rotate(Math.PI / 4);
  context.fillStyle = color;
  context.fillRect(-size / 2, -size / 2, size, size);
  context.restore();
}

function drawCornerMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  horizontalDirection: number,
  verticalDirection: number
): void {
  context.strokeStyle = POSTER_THEME.accentBorder;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y + verticalDirection * 58);
  context.lineTo(x, y);
  context.lineTo(x + horizontalDirection * 58, y);
  context.stroke();
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Canvas export returned no data');
  return blob;
}

async function loadSiteQrImage(): Promise<HTMLImageElement> {
  const response = await fetch('/api/site-qr');
  if (!response.ok) throw new Error('Could not create site QR code');
  const svg = await response.text();
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return image;
}

export async function createWishPoster(
  wish: Wish,
  { language, t }: PosterOptions
): Promise<PosterResult> {
  const [qrImage] = await Promise.all([loadSiteQrImage(), document.fonts?.ready]);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  context.fillStyle = POSTER_THEME.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const ambientLight = context.createRadialGradient(170, 40, 0, 170, 40, 760);
  ambientLight.addColorStop(0, 'rgba(207, 176, 126, 0.14)');
  ambientLight.addColorStop(0.5, 'rgba(207, 176, 126, 0.035)');
  ambientLight.addColorStop(1, 'rgba(207, 176, 126, 0)');
  context.fillStyle = ambientLight;
  context.fillRect(0, 0, canvas.width, 820);

  const lowerDepth = context.createRadialGradient(980, 1370, 0, 980, 1370, 760);
  lowerDepth.addColorStop(0, 'rgba(30, 27, 46, 0.2)');
  lowerDepth.addColorStop(1, 'rgba(30, 27, 46, 0)');
  context.fillStyle = lowerDepth;
  context.fillRect(260, 680, 820, 760);

  const vignette = context.createRadialGradient(540, 650, 360, 540, 650, 940);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const fontFamily =
    language === 'en'
      ? '"Plus Jakarta Sans", "Noto Sans SC", sans-serif'
      : '"Noto Sans SC", "Plus Jakarta Sans", sans-serif';
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const date = new Date(wish.createdAt || Date.now()).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const category =
    wish.categories.map(c => getCategoryName(c, language, t('wishFallback'))).join(' · ') ||
    t('wishFallback');
  const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');
  const summary = wish.aiPlan?.summary?.trim() || t('summaryFallback');
  const isCompleted = wish.status === 'completed';

  drawDiamond(context, 82, 91, 13, POSTER_THEME.accent);
  context.fillStyle = POSTER_THEME.textStrong;
  context.font = `600 26px ${fontFamily}`;
  context.fillText(t('brand'), 108, 100);
  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `500 15px ${fontFamily}`;
  context.fillText('WISH REALIZATION ARCHIVE', 108, 128);

  context.font = `500 20px ${fontFamily}`;
  const categoryBadgeWidth = Math.max(142, context.measureText(category).width + 52);
  context.fillStyle = POSTER_THEME.accentSoft;
  fillRoundedRect(context, 80, 174, categoryBadgeWidth, 48, 24);
  context.strokeStyle = POSTER_THEME.accentBorder;
  strokeRoundedRect(context, 80, 174, categoryBadgeWidth, 48, 24);
  context.fillStyle = POSTER_THEME.accent;
  context.textAlign = 'center';
  context.fillText(category, 80 + categoryBadgeWidth / 2, 206);
  context.textAlign = 'left';

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.42)';
  context.shadowBlur = 24;
  context.fillStyle = '#f1eee8';
  fillRoundedRect(context, 824, 64, 174, 204, 22);
  context.restore();
  context.drawImage(qrImage, 838, 78, 146, 146);
  context.fillStyle = 'rgba(10, 10, 11, 0.7)';
  context.font = `600 14px ${fontFamily}`;
  context.textAlign = 'center';
  context.fillText(t('posterScanLabel'), 911, 250);
  context.textAlign = 'left';

  context.strokeStyle = POSTER_THEME.border;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(80, 302);
  context.lineTo(1000, 302);
  context.stroke();

  context.fillStyle = POSTER_THEME.textSecondary;
  context.font = `600 18px ${fontFamily}`;
  const wishLabelText = t('posterWishLabel').toUpperCase();
  const wishLabelWidth = context.measureText(wishLabelText).width;
  context.fillText(wishLabelText, 80, 360);
  context.fillStyle = POSTER_THEME.accent;
  context.fillRect(80, 397, 42, 3);
  const stampX = 80 + wishLabelWidth + 92;
  const stampY = 354;

  const titleY = 526;
  const titleLineHeight = 70;
  const titleX = 80;
  context.fillStyle = POSTER_THEME.textStrong;
  context.font = `600 58px ${fontFamily}`;
  const titleLines = wrapPosterText(context, wish.title, 920, 4);
  drawPosterLines(context, titleLines, titleX, titleY, titleLineHeight);

  // forest-like blocks: poetic slip + inspiration
  const boxY = titleY + titleLines.length * titleLineHeight + 36;
  const summaryH = 132;
  const inspirationH = 176;
  const inspirationY = boxY + summaryH + 16;

  // summary — poetic slip (wall .card-summary)
  context.fillStyle = 'rgba(255,255,255,0.025)';
  fillRoundedRect(context, 64, boxY, 952, summaryH, 10);
  context.strokeStyle = 'rgba(255,255,255,0.06)';
  context.lineWidth = 1;
  strokeRoundedRect(context, 64, boxY, 952, summaryH, 10);
  // left accent border + vertical gradient line (like .card-summary::before)
  context.fillStyle = 'rgba(207,176,126,0.38)';
  context.fillRect(64, boxY + 8, 1.5, summaryH - 16);
  const summaryLineGrad = context.createLinearGradient(65, boxY + 7, 65, boxY + summaryH - 7);
  summaryLineGrad.addColorStop(0, 'transparent');
  summaryLineGrad.addColorStop(0.5, 'rgba(207,176,126,0.55)');
  summaryLineGrad.addColorStop(1, 'transparent');
  context.fillStyle = summaryLineGrad;
  context.fillRect(64, boxY + 7, 1, summaryH - 14);

  context.fillStyle = '#a8905f';
  context.font = `600 13px ${fontFamily}`;
  context.fillText(`🍃  ${t('summaryLabel').toUpperCase()}`, 88, boxY + 38);
  const serifZh = '"Source Han Serif SC", "Noto Serif SC", serif';
  const serifEn = '"Cormorant Garamond", "EB Garamond", Georgia, serif';
  const summarySerif = language === 'en' ? serifEn : serifZh;
  context.fillStyle = '#e8dcc3';
  context.font = `400 22px ${summarySerif}`;
  context.textAlign = 'left';
  drawPosterLines(context, wrapPosterText(context, `“${summary}”`, 888, 2), 88, boxY + 68, 30);
  context.textAlign = 'left';

  // inspiration — wall .card-ai-preview
  const inspGrad = context.createLinearGradient(0, inspirationY, 0, inspirationY + inspirationH);
  inspGrad.addColorStop(0, 'rgba(207,176,126,0.07)');
  inspGrad.addColorStop(1, 'rgba(0,0,0,0.14)');
  context.fillStyle = inspGrad;
  fillRoundedRect(context, 64, inspirationY, 952, inspirationH, 10);
  context.strokeStyle = 'rgba(255,255,255,0.06)';
  context.lineWidth = 1;
  strokeRoundedRect(context, 64, inspirationY, 952, inspirationH, 10);
  // top accent border
  context.strokeStyle = 'rgba(207,176,126,0.22)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(64, inspirationY + 0.5);
  context.lineTo(1016, inspirationY + 0.5);
  context.stroke();
  // centered hairline
  context.fillStyle = 'rgba(207,176,126,0.55)';
  context.shadowColor = 'rgba(207,176,126,0.35)';
  context.shadowBlur = 8;
  context.fillRect(522, inspirationY, 36, 1);
  context.shadowBlur = 0;

  context.fillStyle = '#a8905f';
  context.font = `600 12px ${fontFamily}`;
  context.fillText(`✨  ${t('inspirationTitle').toUpperCase()}`, 88, inspirationY + 36);
  context.fillStyle = '#8a8a8d';
  context.font = `italic 400 21px ${fontFamily}`;
  drawPosterLines(context, wrapPosterText(context, inspiration, 888, 3), 88, inspirationY + 66, 30);

  if (isCompleted) {
    context.save();
    context.translate(stampX, stampY);
    context.rotate((18 * Math.PI) / 180);
    context.strokeStyle = '#10b981';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 62, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = 'rgba(16,185,129,0.45)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, 0, 54, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = '#6ee7b7';
    context.font = `800 20px ${fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(t('completedStamp'), 0, 0);
    context.restore();
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
  }

  const dividerY = inspirationY + inspirationH + 32;
  context.strokeStyle = POSTER_THEME.border;
  context.beginPath();
  context.moveTo(80, dividerY);
  context.lineTo(1000, dividerY);
  context.stroke();

  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `500 17px ${fontFamily}`;
  context.fillText(t('posterBlessingsLabel').toUpperCase(), 80, dividerY + 40);
  context.fillStyle = POSTER_THEME.accent;
  context.font = `600 29px ${fontFamily}`;
  context.fillText(`✦  ${wish.blessings || 0}`, 80, dividerY + 80);

  context.textAlign = 'right';
  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `500 17px ${fontFamily}`;
  context.fillText(t('posterDateLabel').toUpperCase(), 1000, dividerY + 40);
  context.fillStyle = POSTER_THEME.textSecondary;
  context.font = `400 22px ${fontFamily}`;
  context.fillText(date, 1000, dividerY + 80);
  context.textAlign = 'left';

  // compact footer — directly below blessings, no large gap
  const footerLineY = dividerY + 108;
  const footerQuoteY = footerLineY + 36;
  context.strokeStyle = POSTER_THEME.borderSoft;
  context.beginPath();
  context.moveTo(80, footerLineY);
  context.lineTo(1000, footerLineY);
  context.stroke();

  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `400 15px ${fontFamily}`;
  context.fillText(t('footerQuote'), 80, footerQuoteY);
  context.textAlign = 'right';
  context.fillStyle = POSTER_THEME.accent;
  context.font = `500 15px ${fontFamily}`;
  context.fillText(t('brand'), 1000, footerQuoteY);
  context.textAlign = 'left';

  // outer/inner frame hugging footer — eliminates bottom blank
  const outerH = footerQuoteY + 36 - 36;
  const innerH = footerQuoteY + 22 - 50;
  context.strokeStyle = POSTER_THEME.border;
  context.lineWidth = 1;
  strokeRoundedRect(context, 36, 36, 1008, outerH, 30);
  context.strokeStyle = POSTER_THEME.borderSoft;
  strokeRoundedRect(context, 50, 50, 980, innerH, 24);
  drawCornerMark(context, 50, 50, 1, 1);
  drawCornerMark(context, 50 + 980, 50 + innerH, -1, -1);

  if (!wish.id) throw new Error('Wish has no database ID');
  return {
    blob: await canvasToPngBlob(canvas),
    filename: `${wish.id}.png`,
  };
}

const POSTER_THEME = {
  background: '#0a0a0b',
  surface: 'rgba(19, 19, 21, 0.88)',
  surfaceSoft: 'rgba(255, 255, 255, 0.025)',
  accent: '#cfb07e',
  accentSoft: 'rgba(207, 176, 126, 0.12)',
  accentBorder: 'rgba(207, 176, 126, 0.28)',
  text: '#e8e6e3',
  textStrong: '#f1f0ee',
  textSecondary: '#8a8a8d',
  textMuted: '#5a5a5d',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSoft: 'rgba(255, 255, 255, 0.045)',
};

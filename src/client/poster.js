function wrapPosterText(context, value, maxWidth, maxLines) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];

  // Tokenize by CJK characters, whitespace, and non-CJK word chunks (English words/punctuation)
  const pattern = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]|\s+|[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g;
  const tokens = text.match(pattern) || [];

  const lines = [];
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

function drawPosterLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

function fillRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
}

function drawDiamond(context, x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.rotate(Math.PI / 4);
  context.fillStyle = color;
  context.fillRect(-size / 2, -size / 2, size, size);
  context.restore();
}

function drawCornerMark(context, x, y, horizontalDirection, verticalDirection) {
  context.strokeStyle = POSTER_THEME.accentBorder;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y + verticalDirection * 58);
  context.lineTo(x, y);
  context.lineTo(x + horizontalDirection * 58, y);
  context.stroke();
}

async function canvasToPngBlob(canvas) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Canvas export returned no data');
  return blob;
}

async function loadSiteQrImage() {
  const response = await fetch('/api/site-qr');
  if (!response.ok) throw new Error('Could not create site QR code');
  const svg = await response.text();
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return image;
}

export async function createWishPoster(wish, { language, t }) {
  const [qrImage] = await Promise.all([
    loadSiteQrImage(),
    document.fonts?.ready
  ]);

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

  context.strokeStyle = POSTER_THEME.border;
  context.lineWidth = 1;
  strokeRoundedRect(context, 36, 36, 1008, 1368, 30);
  context.strokeStyle = POSTER_THEME.borderSoft;
  strokeRoundedRect(context, 50, 50, 980, 1340, 24);
  drawCornerMark(context, 50, 50, 1, 1);
  drawCornerMark(context, 1030, 1390, -1, -1);

  const fontFamily = language === 'en'
    ? '"Plus Jakarta Sans", "Noto Sans SC", sans-serif'
    : '"Noto Sans SC", "Plus Jakarta Sans", sans-serif';
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const date = new Date(wish.createdAt || Date.now()).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const category = t('categoryNames')[wish.category] || t('wishFallback');
  const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');

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
  context.fillText(t('posterWishLabel').toUpperCase(), 80, 360);
  context.fillStyle = POSTER_THEME.accent;
  context.fillRect(80, 397, 42, 3);

  const titleY = 526;
  const titleLineHeight = 70;
  const titleX = 80;
  context.fillStyle = POSTER_THEME.textStrong;
  context.font = `600 58px ${fontFamily}`;
  const titleLines = wrapPosterText(context, wish.title, 920, 4);
  drawPosterLines(context, titleLines, titleX, titleY, titleLineHeight);

  context.fillStyle = POSTER_THEME.surfaceSoft;
  fillRoundedRect(context, 64, 790, 952, 330, 28);
  context.strokeStyle = POSTER_THEME.border;
  context.lineWidth = 1;
  strokeRoundedRect(context, 64, 790, 952, 330, 28);
  context.fillStyle = POSTER_THEME.accentSoft;
  fillRoundedRect(context, 96, 826, 46, 46, 14);
  drawDiamond(context, 119, 849, 10, POSTER_THEME.accent);

  context.fillStyle = POSTER_THEME.accent;
  context.font = `600 22px ${fontFamily}`;
  context.fillText(t('inspirationTitle'), 162, 857);
  context.fillStyle = POSTER_THEME.text;
  context.font = `400 29px ${fontFamily}`;
  drawPosterLines(
    context,
    wrapPosterText(context, inspiration, 820, 5),
    98,
    918,
    43
  );

  context.strokeStyle = POSTER_THEME.border;
  context.beginPath();
  context.moveTo(80, 1172);
  context.lineTo(1000, 1172);
  context.stroke();

  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `500 17px ${fontFamily}`;
  context.fillText(t('posterBlessingsLabel').toUpperCase(), 80, 1213);
  context.fillStyle = POSTER_THEME.accent;
  context.font = `600 29px ${fontFamily}`;
  context.fillText(`✦  ${wish.blessings || 0}`, 80, 1254);

  context.textAlign = 'right';
  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `500 17px ${fontFamily}`;
  context.fillText(t('posterDateLabel').toUpperCase(), 1000, 1213);
  context.fillStyle = POSTER_THEME.textSecondary;
  context.font = `400 22px ${fontFamily}`;
  context.fillText(date, 1000, 1254);
  context.textAlign = 'left';

  context.strokeStyle = POSTER_THEME.borderSoft;
  context.beginPath();
  context.moveTo(80, 1304);
  context.lineTo(1000, 1304);
  context.stroke();

  context.fillStyle = POSTER_THEME.textMuted;
  context.font = `400 18px ${fontFamily}`;
  context.fillText(t('footerQuote'), 80, 1352);
  context.textAlign = 'right';
  context.fillStyle = POSTER_THEME.accent;
  context.font = `500 18px ${fontFamily}`;
  context.fillText(t('brand'), 1000, 1352);
  context.textAlign = 'left';

  if (!wish.id) throw new Error('Wish has no database ID');
  return {
    blob: await canvasToPngBlob(canvas),
    filename: `${wish.id}.png`
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
  borderSoft: 'rgba(255, 255, 255, 0.045)'
};

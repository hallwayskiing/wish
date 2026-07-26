function wrapPosterText(context, value, maxWidth, maxLines, language) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const tokens = language === 'en'
    ? text.split(/(\s+)/).filter(Boolean)
    : Array.from(text);
  const lines = [];
  let line = '';
  let tokenIndex = 0;

  for (; tokenIndex < tokens.length; tokenIndex += 1) {
    const candidate = `${line}${tokens[tokenIndex]}`;
    if (!line || context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    lines.push(line.trim());
    line = tokens[tokenIndex].trimStart();
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && line) lines.push(line.trim());
  if (tokenIndex < tokens.length && lines.length) {
    let finalLine = lines.at(-1);
    while (finalLine && context.measureText(`${finalLine}…`).width > maxWidth) {
      finalLine = finalLine.slice(0, -1).trimEnd();
    }
    lines[lines.length - 1] = `${finalLine}…`;
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

  const background = context.createLinearGradient(80, 0, 1000, 1440);
  background.addColorStop(0, '#08090e');
  background.addColorStop(0.52, '#121018');
  background.addColorStop(1, '#201417');
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1440);

  const topGlow = context.createRadialGradient(860, 120, 0, 860, 120, 590);
  topGlow.addColorStop(0, 'rgba(207, 176, 126, 0.22)');
  topGlow.addColorStop(1, 'rgba(207, 176, 126, 0)');
  context.fillStyle = topGlow;
  context.fillRect(250, 0, 830, 760);

  const bottomGlow = context.createRadialGradient(40, 1320, 0, 40, 1320, 520);
  bottomGlow.addColorStop(0, 'rgba(115, 79, 96, 0.18)');
  bottomGlow.addColorStop(1, 'rgba(115, 79, 96, 0)');
  context.fillStyle = bottomGlow;
  context.fillRect(0, 820, 700, 620);

  context.strokeStyle = 'rgba(207, 176, 126, 0.16)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.roundRect(34, 34, 1012, 1372, 38);
  context.stroke();

  context.strokeStyle = 'rgba(207, 176, 126, 0.08)';
  context.beginPath();
  context.ellipse(870, 130, 330, 178, -0.24, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.ellipse(870, 130, 250, 128, -0.24, 0, Math.PI * 2);
  context.stroke();

  for (let index = 0; index < 42; index += 1) {
    const x = (index * 197 + 83) % 1020 + 30;
    const y = (index * 101 + 47) % 1320 + 30;
    const radius = index % 7 === 0 ? 2.2 : 1;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(232, 216, 190, ${index % 5 === 0 ? 0.5 : 0.2})`;
    context.fill();
  }

  const fontFamily = '"Noto Sans SC", "Plus Jakarta Sans", sans-serif';
  const locale = language === 'en' ? 'en-US' : 'zh-CN';
  const date = new Date(wish.createdAt || Date.now()).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const category = t('categoryNames')[wish.category] || t('wishFallback');
  const inspiration = wish.aiPlan?.inspiration || t('inspirationFallback');

  context.fillStyle = '#cfb07e';
  context.font = `600 28px ${fontFamily}`;
  context.fillText(`✦ ${t('brand')}`, 76, 96);

  context.strokeStyle = 'rgba(207, 176, 126, 0.32)';
  context.beginPath();
  context.moveTo(76, 126);
  context.lineTo(330, 126);
  context.stroke();

  context.font = `500 22px ${fontFamily}`;
  const categoryBadgeWidth = Math.max(150, context.measureText(category).width + 58);
  context.fillStyle = 'rgba(207, 176, 126, 0.12)';
  fillRoundedRect(context, 76, 156, categoryBadgeWidth, 52, 26);
  context.strokeStyle = 'rgba(207, 176, 126, 0.22)';
  context.beginPath();
  context.roundRect(76, 156, categoryBadgeWidth, 52, 26);
  context.stroke();
  context.fillStyle = '#dfc79f';
  context.textAlign = 'center';
  context.fillText(category, 76 + categoryBadgeWidth / 2, 190);
  context.textAlign = 'left';

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.36)';
  context.shadowBlur = 26;
  context.fillStyle = 'rgba(247, 240, 228, 0.96)';
  fillRoundedRect(context, 814, 52, 192, 220, 28);
  context.restore();
  context.drawImage(qrImage, 830, 68, 160, 160);
  context.fillStyle = 'rgba(42, 31, 27, 0.66)';
  context.font = `600 16px ${fontFamily}`;
  context.textAlign = 'center';
  context.fillText(t('posterScanLabel'), 910, 252);
  context.textAlign = 'left';

  context.fillStyle = 'rgba(255, 255, 255, 0.46)';
  context.font = `600 22px ${fontFamily}`;
  context.fillText(t('posterWishLabel').toUpperCase(), 84, 308);

  context.fillStyle = 'rgba(207, 176, 126, 0.12)';
  context.font = `700 132px ${fontFamily}`;
  context.fillText('“', 52, 424);
  context.fillStyle = '#f5f0e9';
  context.font = `700 62px ${fontFamily}`;
  drawPosterLines(context, wrapPosterText(context, wish.title, 884, 4, language), 98, 402, 82);

  context.strokeStyle = 'rgba(207, 176, 126, 0.3)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(84, 688);
  context.lineTo(182, 688);
  context.stroke();
  context.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(196, 688);
  context.lineTo(996, 688);
  context.stroke();

  const insightCard = context.createLinearGradient(68, 730, 1012, 1116);
  insightCard.addColorStop(0, 'rgba(30, 27, 34, 0.92)');
  insightCard.addColorStop(1, 'rgba(12, 12, 17, 0.72)');
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.26)';
  context.shadowBlur = 28;
  context.fillStyle = insightCard;
  fillRoundedRect(context, 64, 728, 952, 388, 38);
  context.restore();
  context.strokeStyle = 'rgba(207, 176, 126, 0.18)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.roundRect(64, 728, 952, 388, 38);
  context.stroke();

  context.fillStyle = 'rgba(207, 176, 126, 0.12)';
  fillRoundedRect(context, 104, 774, 52, 52, 26);
  context.fillStyle = '#cfb07e';
  context.font = `600 22px ${fontFamily}`;
  context.textAlign = 'center';
  context.fillText('✦', 130, 809);
  context.textAlign = 'left';
  context.font = `600 24px ${fontFamily}`;
  context.fillText(t('posterInspirationLabel'), 176, 809);

  context.fillStyle = 'rgba(245, 240, 233, 0.84)';
  context.font = `400 33px ${fontFamily}`;
  drawPosterLines(context, wrapPosterText(context, inspiration, 824, 5, language), 108, 884, 52);

  context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  context.beginPath();
  context.moveTo(84, 1176);
  context.lineTo(996, 1176);
  context.stroke();

  context.fillStyle = 'rgba(255, 255, 255, 0.46)';
  context.font = `500 19px ${fontFamily}`;
  context.fillText(t('posterBlessingsLabel'), 84, 1218);
  context.fillStyle = '#cfb07e';
  context.font = `600 30px ${fontFamily}`;
  context.fillText(`✦  ${wish.blessings || 0}`, 84, 1260);
  context.textAlign = 'right';
  context.fillStyle = 'rgba(255, 255, 255, 0.56)';
  context.font = `400 22px ${fontFamily}`;
  context.fillText(date, 996, 1260);
  context.textAlign = 'left';

  context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  context.beginPath();
  context.moveTo(84, 1306);
  context.lineTo(996, 1306);
  context.stroke();

  context.fillStyle = 'rgba(255, 255, 255, 0.4)';
  context.font = `400 20px ${fontFamily}`;
  context.fillText(t('footerQuote'), 84, 1360);
  context.textAlign = 'right';
  context.fillStyle = 'rgba(207, 176, 126, 0.72)';
  context.fillText(t('brand'), 996, 1360);

  if (!wish.id) throw new Error('Wish has no database ID');
  return {
    blob: await canvasToPngBlob(canvas),
    filename: `${wish.id}.png`
  };
}

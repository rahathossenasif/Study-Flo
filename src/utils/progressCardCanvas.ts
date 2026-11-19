export interface ProgressCardPayload {
  userName: string;
  overallProgress: number;
  weeklyHours: number;
  streakDays: number;
  completedTopics: number;
  totalTopics: number;
  dailyHours: { label: string; hours: number }[];
  topSubject: string;
}

export function renderProgressCardToDataUrl(payload: ProgressCardPayload): string {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deep OLED Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, width, height);

  // Top Ambient Radial Glow
  const topGlow = ctx.createRadialGradient(width / 2, 180, 40, width / 2, 260, 620);
  topGlow.addColorStop(0, 'rgba(124, 58, 237, 0.42)');
  topGlow.addColorStop(0.55, 'rgba(76, 29, 149, 0.16)');
  topGlow.addColorStop(1, 'rgba(5, 5, 16, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  // Main Card Container
  const pad = 72;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;

  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardGrad.addColorStop(0, '#1B1339');
  cardGrad.addColorStop(0.38, '#111124');
  cardGrad.addColorStop(1, '#0B0B1A');
  ctx.fillStyle = cardGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.28)';
  ctx.stroke();

  // Brand Header
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 54px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STUDYFLO', width / 2, 190);

  ctx.fillStyle = '#A78BFA';
  ctx.font = '500 26px "DM Sans", system-ui, sans-serif';
  ctx.fillText(`${payload.userName} · Weekly Progress Snapshot`, width / 2, 240);

  // Circular Progress Ring (left side)
  const ringCx = 335;
  const ringCy = 470;
  const radius = 135;

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 26;
  ctx.stroke();

  const progressGrad = ctx.createLinearGradient(ringCx - radius, ringCy - radius, ringCx + radius, ringCy + radius);
  progressGrad.addColorStop(0, '#06B6D4');
  progressGrad.addColorStop(0.55, '#3B82F6');
  progressGrad.addColorStop(1, '#7C3AED');

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.max(0, Math.min(100, payload.overallProgress)) / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, radius, startAngle, endAngle);
  ctx.strokeStyle = progressGrad;
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 72px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${payload.overallProgress}%`, ringCx, ringCy + 18);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 22px "DM Sans", system-ui, sans-serif';
  ctx.fillText('Syllabus Mastery', ringCx, ringCy + 60);

  // Right Metrics Column
  const statX = 560;
  ctx.textAlign = 'left';

  // Weekly Hours
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 58px "JetBrains Mono", monospace';
  ctx.fillText(`${payload.weeklyHours.toFixed(1)}h`, statX, 415);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 25px "DM Sans", system-ui, sans-serif';
  ctx.fillText('Focused This Week', statX, 452);

  // Streak
  ctx.fillStyle = '#F59E0B';
  ctx.font = '700 58px "JetBrains Mono", monospace';
  ctx.fillText(`${payload.streakDays} Days`, statX, 555);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 25px "DM Sans", system-ui, sans-serif';
  ctx.fillText('Active Study Streak', statX, 592);

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 685);
  ctx.lineTo(width - 140, 685);
  ctx.stroke();

  // Weekly Activity Bar Chart
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Weekly Study Rhythm', 140, 745);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 22px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${payload.completedTopics}/${payload.totalTopics} topics completed`, width - 140, 745);

  const chartLeft = 150;
  const chartBottom = 1045;
  const chartMaxH = 225;
  const barW = 72;
  const gap = (width - 300 - barW * 7) / 6;
  const maxHours = Math.max(2, ...payload.dailyHours.map((d) => d.hours));

  payload.dailyHours.forEach((day, idx) => {
    const x = chartLeft + idx * (barW + gap);
    const barH = Math.max(18, (day.hours / maxHours) * chartMaxH);
    const y = chartBottom - barH;

    // Bar track
    roundRect(ctx, x, chartBottom - chartMaxH, barW, chartMaxH, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    // Active Bar
    roundRect(ctx, x, y, barW, barH, 18);
    const barGrad = ctx.createLinearGradient(x, y, x, chartBottom);
    barGrad.addColorStop(0, '#A855F7');
    barGrad.addColorStop(1, '#5B21B6');
    ctx.fillStyle = barGrad;
    ctx.fill();

    // Day Label
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(day.label, x + barW / 2, chartBottom + 44);
  });

  // Footer Banner
  roundRect(ctx, 140, 1135, width - 280, 88, 24);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.16)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Top Focus: ${payload.topSubject}  ·  Plan • Focus • Learn • Grow`, width / 2, 1188);

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

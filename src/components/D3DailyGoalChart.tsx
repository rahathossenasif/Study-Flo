import React, { useEffect, useId, useRef, useState } from 'react';
import * as d3 from 'd3';

interface D3DailyGoalChartProps {
  completedMinutes: number;
  targetMinutes: number;
  size?: number;
  strokeWidth?: number;
  isBn?: boolean;
}

function formatCompactHm(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function D3DailyGoalChart({
  completedMinutes,
  targetMinutes,
  size = 128,
  strokeWidth = 7,
  isBn = false,
}: D3DailyGoalChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const prevRatioRef = useRef<number>(0);
  const [hovered, setHovered] = useState(false);

  const uid = useId().replace(/:/g, '');
  const arcGradId = `d3-lux-arc-${uid}`;
  const rimGradId = `d3-lux-rim-${uid}`;
  const dialGradId = `d3-lux-dial-${uid}`;
  const glowId = `d3-lux-glow-${uid}`;
  const tipHaloId = `d3-lux-tip-${uid}`;

  const safeTarget = Math.max(15, targetMinutes);
  const safeCompleted = Math.max(0, Math.round(completedMinutes));
  const rawRatio = safeCompleted / safeTarget;
  const clampedRatio = Math.max(0, Math.min(1, rawRatio));
  const bonusMinutes = Math.max(0, safeCompleted - safeTarget);
  const percent = Math.min(100, Math.round(clampedRatio * 100));
  const goalReached = safeCompleted >= safeTarget;
  const targetHoursLabel = `${Math.round((safeTarget / 60) * 10) / 10}h`;
  const compactDisplay = formatCompactHm(safeCompleted);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').interrupt();
    svg.selectAll('*').remove();

    const cx = size / 2;
    const cy = size / 2;
    const tau = Math.PI * 2;

    // Sleek, architectural chronograph proportions
    const ringThickness = Math.max(5.5, Math.min(8, strokeWidth - 1.5));
    const bezelRadius = size / 2 - 2;
    const outerRadius = bezelRadius - 5.5;
    const innerRadius = outerRadius - ringThickness;
    const midRadius = (outerRadius + innerRadius) / 2;
    const tickOuterR = innerRadius - 3.5;
    const tickInnerMinor = tickOuterR - 2.6;
    const tickInnerMajor = tickOuterR - 4.8;
    const coreDialRadius = Math.max(20, tickInnerMajor - 3);

    const angleScale = d3
      .scaleLinear()
      .domain([0, safeTarget])
      .range([0, tau])
      .clamp(true);

    const ratioScale = d3.scaleLinear().domain([0, 1]).range([0, tau]).clamp(true);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 0 : 720;

    const defs = svg.append('defs');

    // Refined Satin Deep Purple gradient (royal obsidian violet -> luminous amethyst -> soft iris)
    const arcGrad = defs
      .append('linearGradient')
      .attr('id', arcGradId)
      .attr('x1', '12%')
      .attr('y1', '0%')
      .attr('x2', '88%')
      .attr('y2', '100%');

    arcGrad.append('stop').attr('offset', '0%').attr('stop-color', '#C4B5FD');
    arcGrad.append('stop').attr('offset', '28%').attr('stop-color', '#8B5CF6');
    arcGrad.append('stop').attr('offset', '68%').attr('stop-color', '#6D28D9');
    arcGrad.append('stop').attr('offset', '100%').attr('stop-color', '#4C1D95');

    // Architectural metallic/glass top-to-bottom specular bezel rim
    const rimGrad = defs
      .append('linearGradient')
      .attr('id', rimGradId)
      .attr('x1', '20%')
      .attr('y1', '0%')
      .attr('x2', '80%')
      .attr('y2', '100%');
    rimGrad.append('stop').attr('offset', '0%').attr('stop-color', '#DDD6FE').attr('stop-opacity', 0.42);
    rimGrad.append('stop').attr('offset', '45%').attr('stop-color', '#8B5CF6').attr('stop-opacity', 0.14);
    rimGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3B0764').attr('stop-opacity', 0.3);

    // Velvet radial core dial sheen
    const dialGrad = defs
      .append('radialGradient')
      .attr('id', dialGradId)
      .attr('cx', '50%')
      .attr('cy', '22%')
      .attr('r', '78%');
    dialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#C4B5FD').attr('stop-opacity', 0.14);
    dialGrad.append('stop').attr('offset', '55%').attr('stop-color', '#6D28D9').attr('stop-opacity', 0.04);
    dialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1E1038').attr('stop-opacity', 0.18);

    // Controlled velvety ambient glow (userSpaceOnUse prevents any edge box clipping)
    const pad = 26;
    const filter = defs
      .append('filter')
      .attr('id', glowId)
      .attr('filterUnits', 'userSpaceOnUse')
      .attr('x', -cx - pad)
      .attr('y', -cy - pad)
      .attr('width', size + pad * 2)
      .attr('height', size + pad * 2);

    filter
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '3.2')
      .attr('result', 'softAura');
    filter
      .append('feColorMatrix')
      .attr('in', 'softAura')
      .attr('type', 'matrix')
      .attr('values', '0.62 0 0 0 0.1  0 0.36 0 0 0.04  0 0 1 0 0.18  0 0 0 0.48 0')
      .attr('result', 'tintedAura');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'tintedAura');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Understated pearl-amethyst radial halo for the tip marker
    const tipHalo = defs
      .append('radialGradient')
      .attr('id', tipHaloId)
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    tipHalo.append('stop').attr('offset', '0%').attr('stop-color', '#F5F3FF').attr('stop-opacity', 0.85);
    tipHalo.append('stop').attr('offset', '45%').attr('stop-color', '#A78BFA').attr('stop-opacity', 0.35);
    tipHalo.append('stop').attr('offset', '100%').attr('stop-color', '#7C3AED').attr('stop-opacity', 0);

    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Outer architectural glass bezel ring
    g.append('circle')
      .attr('r', bezelRadius)
      .attr('class', 'fill-white/70 dark:fill-[#131024]/85')
      .attr('stroke', `url(#${rimGradId})`)
      .attr('stroke-width', 1.15);

    // Subtle recessed groove track (360°)
    const trackArc = d3
      .arc<unknown>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle(tau);

    g.append('path')
      .attr('d', trackArc({}) ?? '')
      .attr('class', 'fill-slate-200/80 dark:fill-white/[0.06]');

    // Delicate inner chronograph dial surface
    g.append('circle')
      .attr('r', coreDialRadius)
      .attr('class', 'fill-white/75 dark:fill-[#16122B]/80 stroke-slate-200/70 dark:stroke-white/[0.06]')
      .attr('stroke-width', 0.85);

    g.append('circle')
      .attr('r', coreDialRadius - 0.5)
      .attr('fill', `url(#${dialGradId})`);

    // Precision inner chronograph scale (36 fine hairline indices inside the ring)
    const tickCount = 36;
    const ticks = d3.range(0, tickCount);
    const activeTickCount = Math.round(clampedRatio * tickCount);

    g.selectAll('line.chrono-tick')
      .data(ticks)
      .enter()
      .append('line')
      .attr('class', (i) => {
        const isCardinal = i % 9 === 0;
        const isActive = safeCompleted > 0 && i < activeTickCount;
        if (isActive) {
          return isCardinal
            ? 'chrono-tick stroke-[#7C3AED] dark:stroke-[#C4B5FD]'
            : 'chrono-tick stroke-[#7C3AED]/45 dark:stroke-[#A78BFA]/50';
        }
        return isCardinal
          ? 'chrono-tick stroke-slate-300 dark:stroke-white/[0.22]'
          : 'chrono-tick stroke-slate-200/90 dark:stroke-white/[0.09]';
      })
      .attr('x1', (i) => {
        const a = (i / tickCount) * tau;
        return Math.sin(a) * tickOuterR;
      })
      .attr('y1', (i) => {
        const a = (i / tickCount) * tau;
        return -Math.cos(a) * tickOuterR;
      })
      .attr('x2', (i) => {
        const a = (i / tickCount) * tau;
        const r = i % 9 === 0 ? tickInnerMajor : tickInnerMinor;
        return Math.sin(a) * r;
      })
      .attr('y2', (i) => {
        const a = (i / tickCount) * tau;
        const r = i % 9 === 0 ? tickInnerMajor : tickInnerMinor;
        return -Math.cos(a) * r;
      })
      .attr('stroke-width', (i) => (i % 9 === 0 ? 1.25 : 0.8))
      .attr('stroke-linecap', 'round');

    // Primary D3 progress arc (starts cleanly at 12 o'clock)
    const progressArcGen = d3
      .arc<number>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle((a) => a)
      .cornerRadius(ringThickness / 2);

    const initialAngle = ratioScale(prevRatioRef.current);
    const targetAngle = angleScale(safeCompleted);

    const progressPath = g
      .append('path')
      .datum(initialAngle)
      .attr('fill', `url(#${arcGradId})`)
      .attr('filter', `url(#${glowId})`)
      .attr('d', (d) => (d > 0.005 ? progressArcGen(d) ?? '' : ''));

    // Subtle specular highlight hairline riding the center of the active arc
    const highlightArcGen = d3
      .arc<number>()
      .innerRadius(midRadius - 0.65)
      .outerRadius(midRadius + 0.65)
      .startAngle(0)
      .endAngle((a) => a)
      .cornerRadius(0.65);

    const highlightPath = g
      .append('path')
      .datum(initialAngle)
      .attr('fill', '#FFFFFF')
      .attr('fill-opacity', 0.22)
      .attr('d', (d) => (d > 0.04 ? highlightArcGen(d) ?? '' : ''));

    // Understated luminous pearl marker at the active tip (hidden cleanly at 0%)
    const tipR = Math.max(2.3, ringThickness * 0.36);
    const tipHaloCircle = g
      .append('circle')
      .attr('r', clampedRatio > 0.01 ? tipR * 2.5 : 0)
      .attr('fill', `url(#${tipHaloId})`)
      .attr('cx', Math.sin(initialAngle) * midRadius)
      .attr('cy', -Math.cos(initialAngle) * midRadius);

    const tipBead = g
      .append('circle')
      .attr('r', clampedRatio > 0.01 ? tipR : 0)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#7C3AED')
      .attr('stroke-width', 1.4)
      .attr('cx', Math.sin(initialAngle) * midRadius)
      .attr('cy', -Math.cos(initialAngle) * midRadius);

    progressPath
      .transition()
      .duration(duration)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (currentAngle) {
        const interpolateAngle = d3.interpolate(currentAngle, targetAngle);
        return (t) => {
          const next = interpolateAngle(t);
          if (clampedRatio > 0.01) {
            const px = Math.sin(next) * midRadius;
            const py = -Math.cos(next) * midRadius;
            tipHaloCircle.attr('cx', px).attr('cy', py);
            tipBead.attr('cx', px).attr('cy', py);
          }
          highlightPath.attr('d', next > 0.04 ? highlightArcGen(next) ?? '' : '');
          return next > 0.005 ? progressArcGen(next) ?? '' : '';
        };
      });

    prevRatioRef.current = clampedRatio;

    return () => {
      svg.selectAll('*').interrupt();
    };
  }, [
    safeCompleted,
    safeTarget,
    clampedRatio,
    arcGradId,
    rimGradId,
    dialGradId,
    glowId,
    tipHaloId,
    size,
    strokeWidth,
  ]);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none group rounded-full shadow-[0_12px_30px_-14px_rgba(109,40,217,0.28)] dark:shadow-[0_16px_36px_-14px_rgba(76,29,149,0.58)]"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="img"
      aria-label={
        isBn
          ? `দৈনিক লক্ষ্য: ${compactDisplay} / ${targetHoursLabel} (${percent}%)`
          : `Daily goal: ${compactDisplay} of ${targetHoursLabel} (${percent}%)`
      }
      title={`${compactDisplay} / ${targetHoursLabel} (${percent}%)`}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible transition-transform duration-200 ease-out group-hover:scale-[1.025]"
      />

      {/* Clean Editorial 3-Tier Lockup inside the Chronograph Core */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        <span className="font-mono text-[9.5px] font-semibold tabular-nums tracking-wider text-[#7C3AED] dark:text-[#C4B5FD] leading-none">
          {hovered ? `${safeCompleted}/${safeTarget}m` : `${percent}%`}
        </span>
        <span
          className={`mt-1 font-display font-bold tabular-nums tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap ${
            compactDisplay.length >= 6 ? 'text-[15px]' : 'text-[18px]'
          }`}
        >
          {compactDisplay}
        </span>
        <span className="mt-1 text-[9.5px] font-medium tabular-nums text-slate-500 dark:text-slate-400 leading-none whitespace-nowrap">
          {goalReached && bonusMinutes > 0 && !hovered
            ? `${targetHoursLabel} · +${formatCompactHm(bonusMinutes)}`
            : `/ ${targetHoursLabel}`}
        </span>
      </div>
    </div>
  );
}

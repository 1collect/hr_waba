(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(name, String(value));
      }
    });
    return element;
  }

  function cssVariable(name, fallback = '') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
  }

  function createSmoothPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const midpoint = (previous.x + current.x) / 2;
      path += ` C ${midpoint} ${previous.y}, ${midpoint} ${current.y}, ${current.x} ${current.y}`;
    }
    return path;
  }

  function calculateNiceMaximum(maxValue, ticks = 4) {
    if (maxValue <= 0) return ticks;
    const roughStep = maxValue / ticks;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const residual = roughStep / magnitude;
    let niceResidual = 1;
    if (residual > 5) niceResidual = 10;
    else if (residual > 2) niceResidual = 5;
    else if (residual > 1) niceResidual = 2;
    const step = niceResidual * magnitude;
    return Math.ceil(maxValue / step) * step;
  }

  function createLineChart(options = {}) {
    const {
      element,
      labels = [],
      values = [],
      color,
      valueFormatter = formatNumber,
      ariaLabel = 'Линейный график'
    } = options;

    if (!(element instanceof Element)) {
      throw new Error('createLineChart: element должен быть DOM-элементом.');
    }

    const normalizedValues = values.map((value) => Number(value) || 0);
    const itemCount = Math.min(labels.length, normalizedValues.length);
    const chartLabels = labels.slice(0, itemCount);
    const chartValues = normalizedValues.slice(0, itemCount);
    element.replaceChildren();
    element.classList.add('line-chart');

    if (!itemCount) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Недостаточно данных для графика';
      element.append(empty);
      return { update: () => {} };
    }

    const width = 800;
    const height = 320;
    const margin = { top: 22, right: 22, bottom: 42, left: 54 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const baselineY = margin.top + plotHeight;
    const primaryColor = color || cssVariable('--color-primary', 'currentColor');
    const maxValue = calculateNiceMaximum(Math.max(...chartValues), 4);
    const tickCount = 4;
    const xStep = itemCount > 1 ? plotWidth / (itemCount - 1) : 0;
    const yScale = (value) => baselineY - (value / maxValue) * plotHeight;
    const points = chartValues.map((value, index) => ({
      x: itemCount === 1 ? margin.left + plotWidth / 2 : margin.left + index * xStep,
      y: yScale(value),
      value,
      label: chartLabels[index]
    }));

    const svg = svgElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': ariaLabel,
      focusable: 'false'
    });

    const defs = svgElement('defs');
    const gradientId = `line-chart-gradient-${Math.random().toString(36).slice(2, 10)}`;
    const gradient = svgElement('linearGradient', {
      id: gradientId,
      x1: '0',
      y1: '0',
      x2: '0',
      y2: '1'
    });
    gradient.append(
      svgElement('stop', { offset: '0%', 'stop-color': primaryColor, 'stop-opacity': '0.5' }),
      svgElement('stop', { offset: '100%', 'stop-color': primaryColor, 'stop-opacity': '0' })
    );
    defs.append(gradient);
    svg.append(defs);

    for (let tick = 0; tick <= tickCount; tick += 1) {
      const ratio = tick / tickCount;
      const y = margin.top + ratio * plotHeight;
      const value = maxValue - ratio * maxValue;
      svg.append(svgElement('line', {
        class: 'line-chart__grid',
        x1: margin.left,
        x2: width - margin.right,
        y1: y,
        y2: y
      }));
      const label = svgElement('text', {
        class: 'line-chart__axis-label',
        x: margin.left - 10,
        y: y + 4,
        'text-anchor': 'end'
      });
      label.textContent = formatNumber(value);
      svg.append(label);
    }

    const xLabelStep = Math.max(1, Math.ceil(itemCount / 7));
    chartLabels.forEach((labelText, index) => {
      if (index % xLabelStep !== 0 && index !== itemCount - 1) {
        return;
      }
      const label = svgElement('text', {
        class: 'line-chart__axis-label',
        x: points[index].x,
        y: height - 12,
        'text-anchor': index === 0 ? 'start' : index === itemCount - 1 ? 'end' : 'middle'
      });
      label.textContent = labelText;
      svg.append(label);
    });

    const linePath = createSmoothPath(points);
    const areaPath = `${linePath} L ${points.at(-1).x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
    svg.append(svgElement('path', {
      class: 'line-chart__area',
      d: areaPath,
      fill: `url(#${gradientId})`
    }));
    svg.append(svgElement('path', {
      class: 'line-chart__line',
      d: linePath,
      stroke: primaryColor
    }));

    const hoverLine = svgElement('line', {
      class: 'line-chart__tooltip-line',
      y1: margin.top,
      y2: baselineY,
      hidden: 'true'
    });
    const tooltip = svgElement('g', {
      class: 'line-chart__tooltip',
      hidden: 'true',
      'aria-hidden': 'true'
    });
    const tooltipBox = svgElement('rect', {
      class: 'line-chart__tooltip-box',
      width: 156,
      height: 54,
      rx: 9
    });
    const tooltipTitle = svgElement('text', {
      class: 'line-chart__tooltip-title',
      x: 12,
      y: 19
    });
    const tooltipValue = svgElement('text', {
      class: 'line-chart__tooltip-value',
      x: 12,
      y: 39
    });
    tooltip.append(tooltipBox, tooltipTitle, tooltipValue);
    svg.append(hoverLine, tooltip);

    function showTooltip(index) {
      const point = points[index];
      if (!point) return;
      const boxWidth = 156;
      const boxHeight = 54;
      const gap = 12;
      let tooltipX = point.x + gap;
      if (tooltipX + boxWidth > width - margin.right) {
        tooltipX = point.x - boxWidth - gap;
      }
      let tooltipY = point.y - boxHeight - gap;
      if (tooltipY < margin.top) {
        tooltipY = point.y + gap;
      }
      tooltipY = Math.min(baselineY - boxHeight, Math.max(margin.top, tooltipY));
      hoverLine.setAttribute('x1', point.x);
      hoverLine.setAttribute('x2', point.x);
      hoverLine.removeAttribute('hidden');
      tooltip.setAttribute('transform', `translate(${tooltipX} ${tooltipY})`);
      tooltipTitle.textContent = point.label;
      tooltipValue.textContent = valueFormatter(point.value);
      tooltip.removeAttribute('hidden');
    }

    function hideTooltip() {
      hoverLine.setAttribute('hidden', 'true');
      tooltip.setAttribute('hidden', 'true');
    }

    points.forEach((point, index) => {
      const pointCircle = svgElement('circle', {
        class: 'line-chart__point',
        cx: point.x,
        cy: point.y,
        r: 4,
        fill: primaryColor,
        tabindex: '0',
        role: 'img',
        'aria-label': `${point.label}: ${valueFormatter(point.value)}`
      });
      const hitArea = svgElement('circle', {
        class: 'line-chart__hit-area',
        cx: point.x,
        cy: point.y,
        r: 18,
        tabindex: '-1',
        'aria-hidden': 'true'
      });
      ['pointerenter', 'pointermove', 'pointerdown'].forEach((eventName) => {
        hitArea.addEventListener(eventName, () => showTooltip(index));
      });
      hitArea.addEventListener('pointerleave', hideTooltip);
      pointCircle.addEventListener('focus', () => showTooltip(index));
      pointCircle.addEventListener('blur', hideTooltip);
      pointCircle.addEventListener('pointerenter', () => showTooltip(index));
      pointCircle.addEventListener('pointerleave', hideTooltip);
      svg.append(pointCircle, hitArea);
    });

    element.append(svg);

    const controller = {
      element,
      svg,
      update(nextOptions = {}) {
        return createLineChart({
          ...options,
          ...nextOptions,
          element
        });
      }
    };
    element.chartController = controller;
    return controller;
  }

  function createDonutChart(options = {}) {
    const {
      element,
      value = 0,
      max = 100,
      label = '',
      color,
      valueFormatter = (currentValue) => `${String(currentValue).replace('.', ',')}%`,
      ariaLabel = `${label}: ${valueFormatter(value)}`
    } = options;

    if (!(element instanceof Element)) {
      throw new Error('createDonutChart: element должен быть DOM-элементом.');
    }

    const safeMax = Number(max) > 0 ? Number(max) : 100;
    const safeValue = Math.min(safeMax, Math.max(0, Number(value) || 0));
    const primaryColor = color || cssVariable('--color-primary', 'currentColor');
    const size = 220;
    const center = size / 2;
    const radius = 78;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    const progress = safeValue / safeMax;
    const dashOffset = circumference * (1 - progress);

    element.replaceChildren();
    element.classList.add('donut-chart');
    const svg = svgElement('svg', {
      viewBox: `0 0 ${size} ${size}`,
      role: 'img',
      'aria-label': ariaLabel,
      focusable: 'false'
    });
    const track = svgElement('circle', {
      class: 'donut-chart__track',
      cx: center,
      cy: center,
      r: radius,
      'stroke-width': strokeWidth
    });
    const progressCircle = svgElement('circle', {
      class: 'donut-chart__progress',
      cx: center,
      cy: center,
      r: radius,
      'stroke-width': strokeWidth,
      stroke: primaryColor,
      'stroke-dasharray': circumference,
      'stroke-dashoffset': dashOffset,
      transform: `rotate(-90 ${center} ${center})`
    });
    const valueText = svgElement('text', {
      class: 'donut-chart__value',
      x: center,
      y: center + 2
    });
    valueText.textContent = valueFormatter(safeValue);
    const labelText = svgElement('text', {
      class: 'donut-chart__label',
      x: center,
      y: center + 26
    });
    labelText.textContent = label;
    svg.append(track, progressCircle, valueText, labelText);
    element.append(svg);

    const controller = {
      element,
      svg,
      update(nextOptions = {}) {
        return createDonutChart({
          ...options,
          ...nextOptions,
          element
        });
      }
    };
    element.chartController = controller;
    return controller;
  }

  window.Charts = {
    line: createLineChart,
    donut: createDonutChart
  };
  window.createLineChart = createLineChart;
  window.createDonutChart = createDonutChart;
})();

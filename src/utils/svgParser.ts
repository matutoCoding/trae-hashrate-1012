export interface ParseSVGResult {
  svgPath: string;
  viewBox?: { x: number; y: number; width: number; height: number };
}

export function parseSVG(svgContent: string): ParseSVGResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  let svgPath = '';
  let viewBox: { x: number; y: number; width: number; height: number } | undefined;

  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    const viewBoxAttr = svgElement.getAttribute('viewBox');
    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/\s+/).map(Number);
      if (parts.length === 4) {
        viewBox = {
          x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
      }
    }
  }

  const paths = doc.querySelectorAll('path');
  if (paths.length > 0) {
    const dValues: string[] = [];
    paths.forEach((path) => {
      const d = path.getAttribute('d');
      if (d) {
        dValues.push(d);
      }
    });
    if (dValues.length > 0) {
      svgPath = dValues.join(' ');
    }
  }

  if (!svgPath) {
    const rects = doc.querySelectorAll('rect');
    const circles = doc.querySelectorAll('circle');
    const ellipses = doc.querySelectorAll('ellipse');
    const polygons = doc.querySelectorAll('polygon');

    const shapes: string[] = [];

    rects.forEach((rect) => {
      const x = Number(rect.getAttribute('x') || 0);
      const y = Number(rect.getAttribute('y') || 0);
      const width = Number(rect.getAttribute('width') || 0);
      const height = Number(rect.getAttribute('height') || 0);
      shapes.push(`M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`);
    });

    circles.forEach((circle) => {
      const cx = Number(circle.getAttribute('cx') || 0);
      const cy = Number(circle.getAttribute('cy') || 0);
      const r = Number(circle.getAttribute('r') || 0);
      const k = 0.5522847498;
      shapes.push(
        `M ${cx - r} ${cy} ` +
        `C ${cx - r} ${cy - k * r} ${cx - k * r} ${cy - r} ${cx} ${cy - r} ` +
        `C ${cx + k * r} ${cy - r} ${cx + r} ${cy - k * r} ${cx + r} ${cy} ` +
        `C ${cx + r} ${cy + k * r} ${cx + k * r} ${cy + r} ${cx} ${cy + r} ` +
        `C ${cx - k * r} ${cy + r} ${cx - r} ${cy + k * r} ${cx - r} ${cy} Z`
      );
    });

    ellipses.forEach((ellipse) => {
      const cx = Number(ellipse.getAttribute('cx') || 0);
      const cy = Number(ellipse.getAttribute('cy') || 0);
      const rx = Number(ellipse.getAttribute('rx') || 0);
      const ry = Number(ellipse.getAttribute('ry') || 0);
      const k = 0.5522847498;
      shapes.push(
        `M ${cx - rx} ${cy} ` +
        `C ${cx - rx} ${cy - k * ry} ${cx - k * rx} ${cy - ry} ${cx} ${cy - ry} ` +
        `C ${cx + k * rx} ${cy - ry} ${cx + rx} ${cy - k * ry} ${cx + rx} ${cy} ` +
        `C ${cx + rx} ${cy + k * ry} ${cx + k * rx} ${cy + ry} ${cx} ${cy + ry} ` +
        `C ${cx - k * rx} ${cy + ry} ${cx - rx} ${cy + k * ry} ${cx - rx} ${cy} Z`
      );
    });

    polygons.forEach((polygon) => {
      const points = polygon.getAttribute('points');
      if (points) {
        const pointArray = points.trim().split(/\s+/).map(p => {
          const [x, y] = p.split(',').map(Number);
          return { x, y };
        });
        if (pointArray.length >= 3) {
          let path = `M ${pointArray[0].x} ${pointArray[0].y} `;
          for (let i = 1; i < pointArray.length; i++) {
            path += `L ${pointArray[i].x} ${pointArray[i].y} `;
          }
          path += 'Z';
          shapes.push(path);
        }
      }
    });

    if (shapes.length > 0) {
      svgPath = shapes.join(' ');
    }
  }

  if (!svgPath && viewBox) {
    const { x, y, width, height } = viewBox;
    svgPath = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }

  if (!svgPath) {
    svgPath = 'M -20 -20 L 20 -20 L 20 20 L -20 20 Z';
  }

  return { svgPath, viewBox };
}

export function getRandomShadowColor(): string {
  const colors = [
    '#3D2914',
    '#4A3520',
    '#2D1F14',
    '#5C3D2E',
    '#3B2418',
    '#4E342E',
    '#6D4C41',
    '#5D4037',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function extractFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

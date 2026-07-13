// Generate per-theme heading typography documentation
const fs = require('fs');
const path = 'd:/my-lab/src/card/themes.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const lines = content.split('\n');
const themes = [];
let currentTheme = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const idMatch = line.match(/^\s*id:\s*'([^']+)'/);
  if (idMatch) {
    if (currentTheme) themes.push(currentTheme);
    currentTheme = { id: idMatch[1], name: '', bodySize: 0, heading: null, coverHeading: null };
  }

  if (currentTheme) {
    const nameMatch = line.match(/^\s*name:\s*'([^']+)'/);
    if (nameMatch) currentTheme.name = nameMatch[1];

    const bodySizeMatch = line.match(/bodySize:\s*(\d+)/);
    if (bodySizeMatch && !currentTheme.bodySize) {
      currentTheme.bodySize = parseInt(bodySizeMatch[1]);
    }

    if (line.includes('heading: {')) {
      let headingStr = '';
      let j = i + 1;
      let hDepth = 1;
      while (j < lines.length && hDepth > 0) {
        if (lines[j].includes('{')) hDepth++;
        if (lines[j].includes('}')) hDepth--;
        if (hDepth > 0) headingStr += lines[j].trim() + ' ';
        j++;
      }
      currentTheme.heading = headingStr.trim();
    }

    if (line.includes('coverHeading: {')) {
      let coverStr = '';
      let j = i + 1;
      let cDepth = 1;
      while (j < lines.length && cDepth > 0) {
        if (lines[j].includes('{')) cDepth++;
        if (lines[j].includes('}')) cDepth--;
        if (cDepth > 0) coverStr += lines[j].trim() + ' ';
        j++;
      }
      currentTheme.coverHeading = coverStr.trim();
    }
  }
}
if (currentTheme) themes.push(currentTheme);

const defaultScales = { 1: 3.20, 2: 1.65, 3: 1.35 };

let doc = '# Card Theme Heading Typography — Design System Documentation\n\n';
doc += '> Generated: ' + new Date().toISOString().split('T')[0] + '\n\n';
doc += '## Overview\n\n';
doc += 'This document catalogs per-theme heading typography configurations. ';
doc += 'Each theme can independently specify H1-H6 font sizes, line heights, margins, weights, and colors. ';
doc += 'Themes without explicit config fall back to `HEADING_SIZE_RATIOS`.\n\n';

doc += '### Default Heading Scales\n\n';
doc += '| Level | Scale (x bodySize) | Line Height | Margin Top | Margin Bottom | Font Weight |\n';
doc += '|-------|--------------------|-------------|------------|---------------|-------------|\n';
doc += '| H1 | 3.20 | 1.25 | 16px | 8px | 600 |\n';
doc += '| H2 | 1.65 | 1.35 | 12px | 6px | 600 |\n';
doc += '| H3 | 1.35 | 1.45 | 8px | 4px | 600 |\n';
doc += '| H4 | 1.15 | 1.55 | 6px | 3px | 600 |\n';
doc += '| H5 | 1.04 | 1.55 | 4px | 2px | 600 |\n';
doc += '| H6 | 0.98 | 1.55 | 4px | 2px | 600 |\n\n';

doc += '### Cover Page H1 (Dazibao / Big Poster) Default\n\n';
doc += '- **Scale:** 4.0x bodySize\n';
doc += '- **Line Height:** 1.15\n';
doc += '- **Centered:** false\n\n';
doc += '---\n\n';

doc += '## All Themes — Heading Specs\n\n';
doc += '| Theme ID | Name | Body | H1 | H2 | H3 | Weight | Cover H1 | Centered |\n';
doc += '|----------|------|------|----|----|----|--------|----------|----------|\n';

for (const t of themes) {
  const h1 = t.heading ? (t.heading.match(/h1Scale:\s*([\d.]+)/) || [])[1] || defaultScales[1] : defaultScales[1];
  const h2 = t.heading ? (t.heading.match(/h2Scale:\s*([\d.]+)/) || [])[1] || defaultScales[2] : defaultScales[2];
  const h3 = t.heading ? (t.heading.match(/h3Scale:\s*([\d.]+)/) || [])[1] || defaultScales[3] : defaultScales[3];
  const w = t.heading ? (t.heading.match(/h1FontWeight:\s*(\d+)/) || [])[1] || '600' : '600';
  const cv = t.coverHeading ? (t.coverHeading.match(/h1Scale:\s*([\d.]+)/) || [])[1] || '-' : '-';
  const cc = t.coverHeading ? (t.coverHeading.includes('centered: true') ? 'Yes' : '-') : '-';
  const star = t.heading ? '★' : ' ';

  doc += '| ' + [star + ' `' + t.id + '`', t.name, t.bodySize, h1, h2, h3, w, cv, cc].join(' | ') + ' |\n';
}

doc += '\n> ★ = Has custom heading configuration\n\n';
doc += '---\n\n';

const customThemes = themes.filter(t => t.heading);
doc += '## Custom Heading Details (' + customThemes.length + ' themes)\n\n';
for (const t of customThemes) {
  doc += '### ' + t.name + ' (`' + t.id + '`)\n\n';
  doc += '- Body Size: ' + t.bodySize + 'px\n';
  doc += '- Heading: `' + (t.heading || 'none') + '`\n';
  if (t.coverHeading) {
    doc += '- Cover Heading: `' + t.coverHeading + '`\n';
  }
  doc += '\n';
}

doc += '---\n\n';
doc += '## Responsive Breakpoints\n\n';
doc += '| Viewport | Scale Factor |\n';
doc += '|----------|-------------|\n';
doc += '| < 640px (mobile) | 0.78x |\n';
doc += '| 640-1024px (tablet) | 0.90x |\n';
doc += '| > 1024px (desktop) | 1.0x |\n\n';

doc += '---\n\n';
doc += '## Extending the System\n\n';
doc += 'To add heading config to a new theme, add a `heading` block inside `editor`:\n\n';
doc += '```typescript\n';
doc += 'editor: {\n';
doc += '  bodySize: 30,\n';
doc += '  lineHeight: 1.84,\n';
doc += '  highlightStyle: "underline",\n';
doc += '  heading: {\n';
doc += '    h1Scale: 3.5, h2Scale: 1.7, h3Scale: 1.35,\n';
doc += '    h1LineHeight: 1.25, h2LineHeight: 1.35,\n';
doc += '    h1FontWeight: 700,\n';
doc += '    h1MarginTop: 24, h1MarginBottom: 12,\n';
doc += '    h1Color: "#c8a44e",\n';
doc += '  },\n';
doc += '},\n';
doc += 'coverHeading: {\n';
doc += '  h1Scale: 4.8, h1LineHeight: 1.15, centered: true,\n';
doc += '},\n';
doc += '```\n';

fs.writeFileSync('d:/my-lab/docs/heading-typography-system.md', doc, 'utf8');
console.log('Documentation generated: docs/heading-typography-system.md');
console.log('Total themes:', themes.length);
console.log('With custom heading:', customThemes.length);
console.log('With coverHeading:', themes.filter(t => t.coverHeading).length);

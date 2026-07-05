document.getElementById('limit').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('genBtn').click();
});

const trigger = document.getElementById('selectTrigger');
const dropdown = document.getElementById('selectDropdown');
const selectLabel = document.getElementById('selectLabel');
const options = document.querySelectorAll('.select-option');
const limitField = document.getElementById('limitField');
const btnField = document.getElementById('btnField');
const comingSoon = document.getElementById('comingSoon');
const outputWrapper = document.getElementById('outputWrapper');
const titleEl = document.getElementById('title');
const infoBox = document.getElementById('infoBox');

const nativeSelect = document.createElement('select');
nativeSelect.id = 'mode';
nativeSelect.style.display = 'none';
['', '4', '6', '8', '9'].forEach(v => {
  const o = document.createElement('option');
  o.value = v;
  nativeSelect.appendChild(o);
});
document.body.appendChild(nativeSelect);

let selected = null;

// Make trigger focusable
trigger.setAttribute('tabindex', '0');

trigger.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.classList.toggle('open');
  trigger.classList.toggle('active');
});

// Open dropdown with Space/Enter, navigate with arrows, close with Escape
trigger.addEventListener('keydown', (e) => {
  const optList = Array.from(options);
  const isOpen = dropdown.classList.contains('open');
  const focusedIndex = optList.findIndex(o => o.classList.contains('focused'));

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!isOpen) {
      dropdown.classList.add('open');
      trigger.classList.add('active');
      const selectedIdx = optList.findIndex(o => o.classList.contains('selected'));
      setFocused(optList, selectedIdx >= 0 ? selectedIdx : 0);
    } else {
      if (focusedIndex >= 0) optList[focusedIndex].click();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!isOpen) { dropdown.classList.add('open'); trigger.classList.add('active'); }
    setFocused(optList, Math.min(focusedIndex + 1, optList.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!isOpen) { dropdown.classList.add('open'); trigger.classList.add('active'); }
    setFocused(optList, Math.max(focusedIndex - 1, 0));
  } else if (e.key === 'Escape') {
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
    clearFocused(optList);
  } else if (e.key === 'Tab') {
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
    clearFocused(optList);
  }
});

function setFocused(optList, index) {
  clearFocused(optList);
  if (index >= 0 && index < optList.length) optList[index].classList.add('focused');
}

function clearFocused(optList) {
  optList.forEach(o => o.classList.remove('focused'));
}

document.addEventListener('click', () => {
  dropdown.classList.remove('open');
  trigger.classList.remove('active');
});

options.forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    const val = opt.dataset.value;
    const isComingSoon = opt.classList.contains('coming');

    options.forEach(o => o.classList.remove('selected'));
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
    outputWrapper.style.display = 'none';

    const msgEl = document.getElementById('validationMsg');
    msgEl.style.display = 'none';
    msgEl.className = '';
    msgEl.textContent = '';
    document.body.classList.remove('flash-red');
    document.getElementById('limit').value = '';
    document.getElementById('pdfUploadRow').style.display = 'none';
    document.getElementById('pdfInfo').textContent = '';
    document.getElementById('pdfInput').value = '';
    document.getElementById('pdfActions').style.display = 'none';
    uploadedPdfFile = null;

    if (isComingSoon) {
      selectLabel.textContent = opt.childNodes[0].textContent.trim();
      selected = null;
      comingSoon.classList.add('visible');
      limitField.style.visibility = 'hidden';
      btnField.style.visibility = 'hidden';
      titleEl.textContent = '';
      return;
    }

    opt.classList.add('selected');
    selected = val;
    selectLabel.textContent = val + ' Per Page';
    comingSoon.classList.remove('visible');
    limitField.style.visibility = 'visible';
    btnField.style.visibility = 'visible';
    titleEl.textContent = val + ' Per Page';
    nativeSelect.value = val;
    document.getElementById('pdfUploadRow').style.display = 'flex';
    document.getElementById('pdfInfo').textContent = '';
    document.getElementById('pdfLabel').textContent = 'Upload PDF to auto-fill page count';
    document.getElementById('pdfInput').value = '';
  });
});

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let uploadedPdfFile = null;

document.getElementById('pdfInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const pdfInfo = document.getElementById('pdfInfo');
  const pdfLabel = document.getElementById('pdfLabel');
  pdfInfo.style.color = '#6b7280';

  // Reset sections
  document.getElementById('pdfActions').style.display = 'none';
  document.getElementById('reorderSuccess').style.display = 'none';
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('imposeSuccess').style.display = 'none';
  document.getElementById('imposeProgressWrap').style.display = 'none';
  document.getElementById('imposePreview').style.display = 'none';

  const isDocx = file.name.match(/\.docx$/i);

  if (isDocx) {
    pdfInfo.textContent = 'Converting Word file to PDF…';
    pdfInfo.style.color = '#6b7280';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      const A4_W = 794, A4_H = 1123, SCALE = 2;

      // Use a visible iframe so html2canvas can actually render it
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `position:fixed;top:0;left:0;width:${A4_W}px;height:${A4_H}px;border:none;z-index:99999;opacity:0;pointer-events:none;`;
      document.body.appendChild(iframe);

      await new Promise(res => {
        iframe.onload = res;
        iframe.srcdoc = `<!DOCTYPE html><html><head><style>
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:Arial,sans-serif;font-size:12pt;padding:60px;width:${A4_W}px;background:#fff;}
          p,li{line-height:1.6;margin-bottom:8px;}
          h1,h2,h3{margin-bottom:12px;}
          table{width:100%;border-collapse:collapse;margin-bottom:12px;}
          td,th{border:1px solid #ccc;padding:6px;}
          img{max-width:100%;}
        </style></head><body>${result.value}</body></html>`;
      });
      await new Promise(r => setTimeout(r, 400));

      const iDoc = iframe.contentDocument;
      const totalH = iDoc.body.scrollHeight;
      const pageCount = Math.max(1, Math.ceil(totalH / A4_H));

      const pdfDoc = await PDFLib.PDFDocument.create();

      for (let p = 0; p < pageCount; p++) {
        iframe.contentWindow.scrollTo(0, p * A4_H);
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(iDoc.body, {
          scale: SCALE,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: A4_W,
          height: A4_H,
          windowWidth: A4_W,
          windowHeight: A4_H,
          x: 0,
          y: p * A4_H,
          scrollX: 0,
          scrollY: 0,
        });
        const pngBytes = await new Promise(res => canvas.toBlob(b => b.arrayBuffer().then(res), 'image/png'));
        const img  = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([A4_W, A4_H]);
        page.drawImage(img, { x: 0, y: 0, width: A4_W, height: A4_H });
      }

      document.body.removeChild(iframe);

      const pdfBytes = await pdfDoc.save();
      uploadedPdfFile = new File([pdfBytes], file.name.replace(/\.docx$/i, '.pdf'), { type: 'application/pdf' });

      const divisor = selected ? divisorMap[selected] : null;
      const adjustedCount = divisor && pageCount % divisor !== 0
        ? pageCount + (divisor - (pageCount % divisor))
        : pageCount;
      document.getElementById('limit').value = adjustedCount;
      pdfLabel.textContent = file.name;
      pdfInfo.textContent = adjustedCount !== pageCount
        ? `✓ ${pageCount} pages detected — auto-adjusted to ${adjustedCount} (rounded up to complete last page)`
        : `✓ ${pageCount} pages detected — converted & ready`;
      pdfInfo.style.color = '#059669';
      if (selected) document.getElementById('genBtn').click();
    } catch (err) {
      pdfInfo.textContent = 'Failed to convert Word file. Please try another.';
      pdfInfo.style.color = '#dc2626';
    }
    return;
  }

  // Original PDF handling
  uploadedPdfFile = file;
  pdfInfo.textContent = 'Reading PDF...';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const divisor = selected ? divisorMap[selected] : null;
    const adjustedCount = divisor && pageCount % divisor !== 0
      ? pageCount + (divisor - (pageCount % divisor))
      : pageCount;
    document.getElementById('limit').value = adjustedCount;
    pdfLabel.textContent = file.name;
    pdfInfo.textContent = adjustedCount !== pageCount
      ? `✓ ${pageCount} pages detected — auto-adjusted to ${adjustedCount} (rounded up to complete last page)`
      : `✓ ${pageCount} pages detected — input auto-filled`;
    pdfInfo.style.color = '#059669';
    if (selected) document.getElementById('genBtn').click();
  } catch {
    pdfInfo.textContent = 'Failed to read PDF. Please try another file.';
    pdfInfo.style.color = '#dc2626';
  }
});

const divisorMap = { '4': 8, '6': 12, '8': 16, '9': 18 };

function showValidation(max, mode) {
  const msgEl = document.getElementById('validationMsg');
  const divisor = divisorMap[mode];
  const remainder = max % divisor;
  if (remainder === 0) {
    document.body.classList.remove('flash-red');
    msgEl.className = 'msg-perfect';
    msgEl.textContent = 'Perfect! The number is perfectly divisible.';
    msgEl.style.display = 'block';
  } else {
    const needed = divisor - remainder;
    const extraPages = needed / parseInt(mode);
    const pagesText = Number.isInteger(extraPages)
      ? `Add ${needed} more number${needed > 1 ? 's' : ''} (${extraPages} more page${extraPages > 1 ? 's' : ''}) to complete the last page.`
      : `Add ${needed} more number${needed > 1 ? 's' : ''} to complete the last page.`;
    msgEl.className = 'msg-warning';
    msgEl.innerHTML = `<span>Warning: Not perfectly divisible. ${pagesText}</span>
      <button class="blank-btn" id="blankBtn">+ Add Blank Pages &amp; Download</button>`;
    msgEl.style.display = 'block';
    document.body.classList.remove('flash-red');
    void document.body.offsetWidth;
    document.body.classList.add('flash-red');

    document.getElementById('blankBtn').addEventListener('click', async () => {
      if (!uploadedPdfFile) {
        alert('Please upload a PDF first.');
        return;
      }
      try {
        // Step 1: add blank pages to make count divisible
        const arrayBuffer = await uploadedPdfFile.arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const { width: blankW, height: blankH } = srcDoc.getPage(0).getSize();
        for (let i = 0; i < needed; i++) srcDoc.addPage([blankW, blankH]);
        const paddedBytes = await srcDoc.save();

        // Step 2: reload padded doc and reorder using the pattern
        const paddedDoc = await PDFLib.PDFDocument.load(paddedBytes, { ignoreEncryption: true });
        const totalSrc = paddedDoc.getPageCount();

        // Regenerate sequence from current lastNums padded to divisor
        const sequence = [...lastNums];
        while (sequence.length % divisorMap[mode] !== 0) sequence.push(0);

        const outDoc = await PDFLib.PDFDocument.create();
        const allIndices = Array.from({ length: totalSrc }, (_, i) => i);
        const copiedPages = await outDoc.copyPages(paddedDoc, allIndices);

        for (const pageNum of sequence) {
          if (pageNum === 0 || pageNum > totalSrc) {
            outDoc.addPage([blankW, blankH]);
          } else {
            outDoc.addPage(copiedPages[pageNum - 1]);
          }
        }

        const pdfBytes = await outDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = uploadedPdfFile.name.replace(/\.pdf$/i, '') + '-reordered.pdf';
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        alert('Failed to modify PDF. Please try again.');
      }
    });
  }
}

let lastNums = [];

document.getElementById('genBtn').addEventListener('click', () => {
  if (!selected) return;
  const max = parseInt(document.getElementById('limit').value);
  if (!max || max < 1) { alert('Please enter a valid maximum number.'); return; }

  showValidation(max, selected);

  lastNums = selected === '4' ? generate4(max) : selected === '8' ? generate8(max) : selected === '9' ? generate9(max) : generate6(max);
  document.getElementById('output').textContent = lastNums.join(', ');
  outputWrapper.style.display = 'block';
  infoBox.style.display = 'block';
  document.getElementById('statTotal').textContent = lastNums.length.toLocaleString();
  document.getElementById('statPages').textContent = Math.ceil(lastNums.length / parseInt(selected)).toLocaleString();
  document.getElementById('statMode').textContent = selected + ' per page';
  document.getElementById('downloadPdfBtn').style.display = 'flex';

  // Show actions panel only if a PDF is uploaded
  if (uploadedPdfFile) {
    document.getElementById('pdfActions').style.display = 'grid';
    document.getElementById('reorderSuccess').style.display = 'none';
    document.getElementById('progressWrap').style.display = 'none';
    document.getElementById('reorderBtn').disabled = false;
    document.getElementById('imposeSuccess').style.display = 'none';
    document.getElementById('imposeProgressWrap').style.display = 'none';
    document.getElementById('imposePreview').style.display = 'none';
    document.getElementById('imposeBtn').disabled = false;
  } else {
    document.getElementById('pdfActions').style.display = 'none';
  }
});

document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
  const perPage = parseInt(selected);
  const nums = [...lastNums];

  // Pad with blanks to complete last page
  while (nums.length % perPage !== 0) nums.push('');

  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageW = 595, pageH = 842; // A4

  // Group numbers into pages
  for (let i = 0; i < nums.length; i += perPage) {
    const pageNums = nums.slice(i, i + perPage);
    const page = pdfDoc.addPage([pageW, pageH]);

    // Layout grid based on perPage
    const cols = perPage <= 4 ? 2 : perPage <= 6 ? 2 : perPage <= 8 ? 2 : 3;
    const rows = Math.ceil(perPage / cols);
    const cellW = (pageW - 110) / cols;
    const cellH = (pageH - 110) / rows;

    pageNums.forEach((num, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 55 + col * cellW + cellW / 2;
      const y = pageH - 55 - row * cellH - cellH / 2;

      // Cell border
      page.drawRectangle({
        x: 55 + col * cellW,
        y: pageH - 55 - (row + 1) * cellH,
        width: cellW,
        height: cellH,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      if (num === '') {
        // Blank cell — light gray fill
        page.drawRectangle({
          x: 55 + col * cellW + 1,
          y: pageH - 55 - (row + 1) * cellH + 1,
          width: cellW - 2,
          height: cellH - 2,
          color: rgb(0.95, 0.95, 0.95),
        });
      } else {
        const text = String(num);
        const fontSize = cellH > 100 ? 36 : 24;
        const textW = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: x - textW / 2,
          y: y - fontSize / 3,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pattern-${selected}-per-page.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const text = document.getElementById('output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.classList.add('copied');
    btn.querySelector('span').textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('span').textContent = 'Copy';
    }, 2000);
  });
});

document.getElementById('reorderBtn').addEventListener('click', async () => {
  if (!uploadedPdfFile || !lastNums.length) return;

  const btn = document.getElementById('reorderBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const reorderSuccess = document.getElementById('reorderSuccess');

  btn.disabled = true;
  progressWrap.style.display = 'flex';
  reorderSuccess.style.display = 'none';
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Loading PDF…';

  try {
    const arrayBuffer = await uploadedPdfFile.arrayBuffer();
    const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalSrc = srcDoc.getPageCount();
    const divisor = divisorMap[selected];

    // Build padded sequence: lastNums uses 1-based page numbers; pad to divisor multiple
    const sequence = [...lastNums];
    while (sequence.length % divisor !== 0) sequence.push(0); // 0 = blank
    const blankCount = sequence.filter(n => n === 0 || n > totalSrc).length;
    const finalCount = sequence.length;

    progressLabel.textContent = 'Reordering pages…';
    progressBar.style.width = '10%';

    const outDoc = await PDFLib.PDFDocument.create();
    const reorderFont = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Copy all source pages once for embedding
    const allPageIndices = Array.from({ length: totalSrc }, (_, i) => i);
    const copiedPages = await outDoc.copyPages(srcDoc, allPageIndices);

    progressBar.style.width = '50%';

    // Get first page size for blank pages
    const { width: blankW, height: blankH } = srcDoc.getPage(0).getSize();

    const chunkSize = 100;
    for (let i = 0; i < sequence.length; i++) {
      const pageNum = sequence[i]; // 1-based; 0 = blank
      let outPage;
      if (pageNum === 0 || pageNum > totalSrc) {
        outPage = outDoc.addPage([blankW, blankH]);
      } else {
        outPage = outDoc.addPage(copiedPages[pageNum - 1]);
      }
      // Draw pattern number in top-right corner
      const patternNum = sequence[i];
      if (patternNum > 0 && document.getElementById('addPatternNumChk').checked) {
        const { width: pw, height: ph } = outPage.getSize();
        const label = String(patternNum);
        const fs = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 6);
        const tw = reorderFont.widthOfTextAtSize(label, fs);
        outPage.drawText(label, { x: pw - tw - 10, y: ph - fs - 5, size: fs, font: reorderFont, color: PDFLib.rgb(0, 0, 0) });
      }
      // Yield to browser every chunkSize pages to keep UI responsive
      if (i % chunkSize === 0) {
        progressBar.style.width = (50 + Math.round((i / sequence.length) * 45)) + '%';
        await new Promise(r => setTimeout(r, 0));
      }
    }

    progressLabel.textContent = 'Saving PDF…';
    progressBar.style.width = '95%';
    await new Promise(r => setTimeout(r, 0));

    const pdfBytes = await outDoc.save();
    progressBar.style.width = '100%';

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = uploadedPdfFile.name.replace(/\.pdf$/i, '') + '-reordered.pdf';
    a.click();
    URL.revokeObjectURL(a.href);

    const addedBlanks = sequence.filter(n => n === 0 || n > totalSrc).length;
    document.getElementById('reorderMsg').textContent =
      `Done! ${finalCount} pages total — ${addedBlanks > 0 ? addedBlanks + ' blank page(s) added' : 'no blank pages needed'}.`;
    reorderSuccess.style.display = 'flex';
    progressWrap.style.display = 'none';
    btn.disabled = false;
  } catch (err) {
    progressWrap.style.display = 'none';
    btn.disabled = false;
    alert('Failed to reorder PDF: ' + err.message);
  }
});

// ── Grid layouts per mode ──────────────────────────────────────────────────
const gridMap = { '4': [2,2], '6': [3,2], '8': [4,2], '9': [3,3] };

// Render one PDF.js page to an offscreen canvas at a given scale
async function renderPageToCanvas(pdfJsDoc, pageNum, scale) {
  const page = await pdfJsDoc.getPage(pageNum);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(vp.width);
  canvas.height = Math.round(vp.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  return canvas;
}

// Draw the layout preview onto the visible canvas
function drawLayoutPreview(cols, rows, perPage, firstSheetNums) {
  const canvas = document.getElementById('imposeCanvas');
  const W = canvas.parentElement.clientWidth || 300;
  const sheetW = W, sheetH = Math.round(W * (cols >= rows ? 0.71 : 1.41));
  canvas.width  = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, sheetW, sheetH);

  const margin = 12, gap = 4;
  const cellW = (sheetW - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (sheetH - margin * 2 - gap * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = margin + c * (cellW + gap);
      const y = margin + r * (cellH + gap);
      const pageNum = firstSheetNums[idx];
      const isBlank = !pageNum || pageNum === 0;
      ctx.fillStyle = isBlank ? '#f3f4f6' : '#eff6ff';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.fillStyle = isBlank ? '#9ca3af' : '#1a56db';
      ctx.font = `bold ${Math.max(10, Math.round(cellH * 0.25))}px Inter,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isBlank ? '—' : pageNum, x + cellW / 2, y + cellH / 2);
    }
  }
}

document.getElementById('imposeBtn').addEventListener('click', async () => {
  if (!uploadedPdfFile || !lastNums.length) return;

  const btn           = document.getElementById('imposeBtn');
  const progressWrap  = document.getElementById('imposeProgressWrap');
  const progressBar   = document.getElementById('imposeProgressBar');
  const progressLabel = document.getElementById('imposeProgressLabel');
  const successEl     = document.getElementById('imposeSuccess');
  const previewEl     = document.getElementById('imposePreview');

  btn.disabled = true;
  successEl.style.display = 'none';
  progressWrap.style.display = 'flex';
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Loading PDF…';

  try {
    const [cols, rows] = gridMap[selected];
    const perPage = parseInt(selected);          // pages per sheet
    const divisor = divisorMap[selected];        // numbers per full block

    // Build padded sequence (1-based page numbers; 0 = blank)
    const sequence = [...lastNums];
    while (sequence.length % divisor !== 0) sequence.push(0);
    const totalSrc    = sequence.filter(n => n > 0).length > 0
      ? Math.max(...sequence.filter(n => n > 0))
      : 0;
    const addedBlanks = sequence.filter(n => n === 0).length;
    const totalSheets = sequence.length / perPage;

    // Show layout preview immediately with actual first-sheet page numbers
    const firstSheetNums = sequence.slice(0, perPage);
    drawLayoutPreview(cols, rows, perPage, firstSheetNums);
    previewEl.style.display = 'flex';

    progressLabel.textContent = 'Loading PDF…';
    progressBar.style.width = '5%';
    await new Promise(r => setTimeout(r, 0));

    const arrayBuffer = await uploadedPdfFile.arrayBuffer();

    // Load with PDF.js for rendering
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const srcPageCount = pdfJsDoc.numPages;

    // Load with pdf-lib for output
    const outDoc = await PDFLib.PDFDocument.create();
    const imposeFont = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    progressBar.style.width = '10%';
    progressLabel.textContent = 'Imposing pages… 0%';
    await new Promise(r => setTimeout(r, 0));

    // Output sheet size: A3 landscape for ≥4-up, portrait for 2-up
    // We derive from first source page to preserve proportions
    const firstSrcPage = pdfJsDoc.getPage(1);
    const firstVp = (await firstSrcPage).getViewport({ scale: 1 });
    const srcW = firstVp.width, srcH = firstVp.height;

    // Sheet = cols*srcW × rows*srcH (plus margins/gaps in pts)
    const MARGIN = 20, GAP = 25;
    const sheetW = cols * srcW + (cols - 1) * GAP + MARGIN * 2;
    const sheetH = rows * srcH + (rows - 1) * GAP + MARGIN * 2;
    const cellW  = srcW;
    const cellH  = srcH;

    // Render scale: render at 2× for quality, then embed as PNG
    const RENDER_SCALE = 4;

    for (let s = 0; s < totalSheets; s++) {
      const sheet = outDoc.addPage([sheetW, sheetH]);

      for (let i = 0; i < perPage; i++) {
        const seqIdx  = s * perPage + i;
        const pageNum = sequence[seqIdx]; // 1-based or 0

        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellX = MARGIN + col * (cellW + GAP);
        // pdf-lib Y is bottom-up
        const cellY = sheetH - MARGIN - (row + 1) * cellH - row * GAP;

        if (pageNum === 0 || pageNum > srcPageCount) {
          // Blank cell
          sheet.drawRectangle({
            x: cellX, y: cellY, width: cellW, height: cellH,
            color: PDFLib.rgb(0.96, 0.96, 0.96),
            borderColor: PDFLib.rgb(0, 0, 0), borderWidth: 1,
          });
        } else {
          // Render source page to canvas
          const srcCanvas = await renderPageToCanvas(pdfJsDoc, pageNum, RENDER_SCALE);
          const pngBytes  = await new Promise(res => srcCanvas.toBlob(b => b.arrayBuffer().then(res), 'image/png'));
          const img       = await outDoc.embedPng(pngBytes);

          // Scale to fit cell proportionally
          const scaleX = cellW  / img.width  * RENDER_SCALE;
          const scaleY = cellH  / img.height * RENDER_SCALE;
          const scale  = Math.min(scaleX, scaleY);
          const drawW  = img.width  / RENDER_SCALE * scale;
          const drawH  = img.height / RENDER_SCALE * scale;
          const offX   = (cellW  - drawW) / 2;
          const offY   = (cellH  - drawH) / 2;

          sheet.drawImage(img, {
            x: cellX + offX, y: cellY + offY,
            width: drawW, height: drawH,
          });

          // Draw border on top of image so all 4 sides are fully visible
          sheet.drawRectangle({
            x: cellX, y: cellY, width: cellW, height: cellH,
            borderColor: PDFLib.rgb(0, 0, 0), borderWidth: 1,
          });

          // Pattern number in top-right corner of cell
          if (document.getElementById('addPatternNumChk').checked) {
            const label = String(pageNum);
            const fs = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 6);
            const tw = imposeFont.widthOfTextAtSize(label, fs);
            sheet.drawText(label, { x: cellX + cellW - tw - 6, y: cellY + cellH - fs - 2, size: fs, font: imposeFont, color: PDFLib.rgb(0, 0, 0) });
          }
        }
      }

      // Yield every sheet for UI responsiveness
      const pct = Math.round(((s + 1) / totalSheets) * 100);
      progressBar.style.width = (10 + Math.round(((s + 1) / totalSheets) * 82)) + '%';
      progressLabel.textContent = `Imposing pages… ${pct}%`;
      await new Promise(r => setTimeout(r, 0));
    }

    progressLabel.textContent = 'Saving…';
    progressBar.style.width = '95%';
    await new Promise(r => setTimeout(r, 0));

    const pdfBytes = await outDoc.save();
    progressBar.style.width = '100%';

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = uploadedPdfFile.name.replace(/\.pdf$/i, '') + `-imposed-${selected}up.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);

    document.getElementById('imposeMsg').textContent =
      `Done! ${totalSheets} sheet${totalSheets !== 1 ? 's' : ''} · ${sequence.length} pages total` +
      (addedBlanks > 0 ? ` · ${addedBlanks} blank page${addedBlanks !== 1 ? 's' : ''} added` : '');
    successEl.style.display = 'flex';
    progressWrap.style.display = 'none';
    btn.disabled = false;
  } catch (err) {
    document.getElementById('imposeProgressWrap').style.display = 'none';
    btn.disabled = false;
    alert('Failed to generate imposed PDF: ' + err.message);
  }
});

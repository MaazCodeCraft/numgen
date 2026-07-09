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

document.getElementById('addPatternNumChk').addEventListener('change', function () {
  document.getElementById('patternNumOptions').style.display = this.checked ? 'flex' : 'none';
  document.getElementById('patternNumPreview').style.display = this.checked ? 'block' : 'none';
  document.getElementById('addPageNumBtn').disabled = !this.checked;
  if (this.checked) updatePatternPreview();
});

function updatePatternPreview() {
  const canvas = document.getElementById('patternPreviewCanvas');
  const W = 320, H = 224;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Determine the page rect drawn on canvas
  let pageX = 0, pageY = 0, pageW = W, pageH = H;

  if (previewPageBitmap) {
    const bw = previewPageBitmap.width, bh = previewPageBitmap.height;
    const scale = Math.min(W / bw, H / bh);
    pageW = bw * scale;
    pageH = bh * scale;
    pageX = (W - pageW) / 2;
    pageY = (H - pageH) / 2;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(previewPageBitmap, pageX, pageY, pageW, pageH);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(pageX, pageY, pageW, pageH);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let y = 28; y < H - 20; y += 14) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
    }
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  const fs   = Math.max(4, Math.min(72, parseInt(document.getElementById('patternNumSize').value) || 15));
  const pad  = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
  const hPos = document.getElementById('patternNumH').value;
  const vPos = document.getElementById('patternNumV').value;
  const label = '42';

  // Scale PDF pts → canvas px using the actual rendered page dimensions
  // PDF page is 595 × 842 pts; pageW/pageH is how many canvas px that maps to
  const ptScaleX = pageW / 595;
  const ptScaleY = pageH / 842;
  const cFs  = Math.round(fs  * ptScaleY);
  const cPadX = Math.round(pad * ptScaleX);
  const cPadY = Math.round(pad * ptScaleY);

  ctx.font = `bold ${cFs}px Inter,sans-serif`;
  ctx.textBaseline = 'top';
  const tw = ctx.measureText(label).width;

  // Position relative to the page rect, matching PDF coord logic exactly
  const tx = pageX + (hPos === 'left' ? cPadX : hPos === 'center' ? (pageW - tw) / 2 : pageW - tw - cPadX);
  const ty = pageY + (vPos === 'top'  ? cPadY : pageH - cFs - cPadY);

  ctx.fillStyle = '#000000';
  ctx.fillText(label, tx, ty);
}

['patternNumSize','patternNumMargin','patternNumH','patternNumV'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (document.getElementById('addPatternNumChk').checked) updatePatternPreview();
  });
});

document.getElementById('patternPreviewCanvas').addEventListener('click', () => {
  // Render at 2× the actual PDF pt dimensions so it matches exactly
  const SCALE = 2;
  const pdfW = 595, pdfH = 842;
  const W = pdfW * SCALE, H = pdfH * SCALE;
  const fc = document.createElement('canvas');
  fc.width = W; fc.height = H;
  const ctx = fc.getContext('2d');

  if (previewPageBitmap) {
    ctx.drawImage(previewPageBitmap, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let y = 40; y < H - 30; y += 28) {
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
    }
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  // Use exact same values as PDF (in pts), then scale to canvas px
  const fs  = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 15);
  const pad = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
  const hPos = document.getElementById('patternNumH').value;
  const vPos = document.getElementById('patternNumV').value;
  const label = '42';

  // Scale pts → canvas px
  const cFs  = fs  * SCALE;
  const cPad = pad * SCALE;

  ctx.font = `bold ${cFs}px Inter,sans-serif`;
  ctx.textBaseline = 'top';
  const tw = ctx.measureText(label).width;

  // Mirror PDF coord logic: PDF top = canvas top, PDF bottom = canvas bottom
  // PDF: ty = vPos==='top' ? ph - fs - pad : pad  (bottom-up)
  // Canvas: vPos==='top' → near top (small y), vPos==='bottom' → near bottom (large y)
  const tx = hPos === 'left' ? cPad : hPos === 'center' ? (W - tw) / 2 : W - tw - cPad;
  const ty = vPos === 'top'  ? cPad : H - cFs - cPad;

  ctx.fillStyle = '#000000';
  ctx.fillText(label, tx, ty);

  fc.toBlob(blob => {
    const imgUrl = URL.createObjectURL(blob);
    const html = `<!DOCTYPE html><html><head><title>Number Position Preview</title>
      <style>*{margin:0;padding:0;}body{background:#1f2937;display:flex;align-items:center;justify-content:center;min-height:100vh;}
      img{max-width:100%;max-height:100vh;box-shadow:0 8px 40px rgba(0,0,0,0.5);}</style></head>
      <body><img src="${imgUrl}"></body></html>`;
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    window.open(htmlUrl, '_blank');
  }, 'image/png');
});

let uploadedPdfFile = null;
let previewPageBitmap = null;

document.getElementById('pdfInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const pdfInfo = document.getElementById('pdfInfo');
  const pdfLabel = document.getElementById('pdfLabel');
  pdfInfo.style.color = '#6b7280';

  previewPageBitmap = null;

  // Reset sections
  document.getElementById('pdfActions').style.display = 'none';
  document.getElementById('reorderSuccess').style.display = 'none';
  document.getElementById('progressWrap').style.display = 'none';
  document.getElementById('imposeSuccess').style.display = 'none';
  document.getElementById('imposeProgressWrap').style.display = 'none';
  document.getElementById('imposePreview').style.display = 'none';
  document.getElementById('bookletSuccess').style.display = 'none';
  document.getElementById('bookletProgressWrap').style.display = 'none';

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

      // Render page 1 for live preview
      const previewPdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
      const pg1 = await previewPdf.getPage(1);
      const vp  = pg1.getViewport({ scale: 1 });
      const offscreen = document.createElement('canvas');
      offscreen.width  = Math.round(vp.width);
      offscreen.height = Math.round(vp.height);
      await pg1.render({ canvasContext: offscreen.getContext('2d'), viewport: vp }).promise;
      previewPageBitmap = await createImageBitmap(offscreen);
      if (document.getElementById('addPatternNumChk').checked) updatePatternPreview();

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
    // Render page 1 into a bitmap for the live preview
    const pg1 = await pdf.getPage(1);
    const vp  = pg1.getViewport({ scale: 1 });
    const offscreen = document.createElement('canvas');
    offscreen.width  = Math.round(vp.width);
    offscreen.height = Math.round(vp.height);
    await pg1.render({ canvasContext: offscreen.getContext('2d'), viewport: vp }).promise;
    previewPageBitmap = await createImageBitmap(offscreen);
    if (document.getElementById('addPatternNumChk').checked) updatePatternPreview();
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
    document.getElementById('bookletSuccess').style.display = 'none';
    document.getElementById('bookletProgressWrap').style.display = 'none';
    document.getElementById('bookletBtn').disabled = !['4','6','8','9'].includes(selected);
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
        const fs = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 15);
        const pad = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
        const hPos = document.getElementById('patternNumH').value;
        const vPos = document.getElementById('patternNumV').value;
        const tw = reorderFont.widthOfTextAtSize(label, fs);
        const tx = hPos === 'left' ? pad : hPos === 'center' ? (pw - tw) / 2 : pw - tw - pad;
        const ty = vPos === 'top' ? ph - fs - pad : pad;
        outPage.drawText(label, { x: tx, y: ty, size: fs, font: reorderFont, color: PDFLib.rgb(0, 0, 0) });
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
            const fs = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 15);
            const pad = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
            const hPos = document.getElementById('patternNumH').value;
            const vPos = document.getElementById('patternNumV').value;
            const tw = imposeFont.widthOfTextAtSize(label, fs);
            const tx = cellX + (hPos === 'left' ? pad : hPos === 'center' ? (cellW - tw) / 2 : cellW - tw - pad);
            const ty = cellY + (vPos === 'top' ? cellH - fs - pad : pad);
            sheet.drawText(label, { x: tx, y: ty, size: fs, font: imposeFont, color: PDFLib.rgb(0, 0, 0) });
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

// ── Booklet PDF Generator ─────────────────────────────────────────────────
// Layout: 4 rounds, each filling one position across all sheets.
// Positions: [topLeft, topRight, bottomLeft, bottomRight]
// Round 1: top, starts Left  → alternates L/R across sheets
// Round 2: top, starts Right → alternates R/L across sheets
// Round 3: bottom, starts Left  → alternates L/R
// Round 4: bottom, starts Right → alternates R/L
//
// sheet[s] cell layout index:
//   0 = topLeft, 1 = topRight, 2 = bottomLeft, 3 = bottomRight

function buildBookletSequence(totalPages, perPage) {
  const numSheets = Math.ceil(totalPages / perPage);
  const sheets = Array.from({ length: numSheets }, () => new Array(perPage).fill(0));
  let pageCounter = 1;

  if (perPage === 6) {
    // 3-col × 2-row: cells [0=TL,1=TC,2=TR,3=BL,4=BC,5=BR], 6 rounds
    const rounds = [
      s => (s % 2 === 0) ? 0 : 2,
      s => 1,
      s => (s % 2 === 0) ? 2 : 0,
      s => (s % 2 === 0) ? 3 : 5,
      s => 4,
      s => (s % 2 === 0) ? 5 : 3,
    ];
    for (const getCellIdx of rounds) {
      for (let s = 0; s < numSheets; s++) {
        sheets[s][getCellIdx(s)] = pageCounter <= totalPages ? pageCounter : 0;
        pageCounter++;
      }
    }
  } else if (perPage === 8) {
    // 4-col × 2-row: cells [0-3=top cols, 4-7=bottom cols], 8 rounds
    // Each round r: even sheet→col(r%4), odd sheet→col(3-(r%4))
    for (let r = 0; r < 8; r++) {
      const rowBase = r < 4 ? 0 : 4;
      const pos = r % 4;
      for (let s = 0; s < numSheets; s++) {
        const col = (s % 2 === 0) ? pos : (3 - pos);
        sheets[s][rowBase + col] = pageCounter <= totalPages ? pageCounter : 0;
        pageCounter++;
      }
    }
  } else if (perPage === 9) {
    // 3-col × 3-row: cells [0=TL,1=TC,2=TR, 3=ML,4=MC,5=MR, 6=BL,7=BC,8=BR], 9 rounds
    // Per row: R1 L/R alt, R2 Center, R3 R/L alt (same as 6-up, extended to 3 rows)
    const rounds = [
      s => (s % 2 === 0) ? 0 : 2,
      s => 1,
      s => (s % 2 === 0) ? 2 : 0,
      s => (s % 2 === 0) ? 3 : 5,
      s => 4,
      s => (s % 2 === 0) ? 5 : 3,
      s => (s % 2 === 0) ? 6 : 8,
      s => 7,
      s => (s % 2 === 0) ? 8 : 6,
    ];
    for (const getCellIdx of rounds) {
      for (let s = 0; s < numSheets; s++) {
        sheets[s][getCellIdx(s)] = pageCounter <= totalPages ? pageCounter : 0;
        pageCounter++;
      }
    }
  } else {
    // 4-round pattern for 4-up
    const cellsPerQuarter = perPage / 4;
    const rounds = [[0,0],[0,1],[1,0],[1,1]];
    for (const [rowHalf, startSide] of rounds) {
      for (let s = 0; s < numSheets; s++) {
        const side = (s % 2 === 0) ? startSide : 1 - startSide;
        const baseCell = (rowHalf * 2 + side) * cellsPerQuarter;
        for (let c = 0; c < cellsPerQuarter; c++) {
          sheets[s][baseCell + c] = pageCounter <= totalPages ? pageCounter : 0;
          pageCounter++;
        }
      }
    }
  }

  return sheets;
}

document.getElementById('bookletBtn').addEventListener('click', async () => {
  if (!uploadedPdfFile || !lastNums.length) return;

  const btn           = document.getElementById('bookletBtn');
  const progressWrap  = document.getElementById('bookletProgressWrap');
  const progressBar   = document.getElementById('bookletProgressBar');
  const progressLabel = document.getElementById('bookletProgressLabel');
  const successEl     = document.getElementById('bookletSuccess');

  btn.disabled = true;
  successEl.style.display = 'none';
  progressWrap.style.display = 'flex';
  progressBar.style.width = '0%';
  progressLabel.textContent = 'Loading PDF…';

  try {
    const [cols, rows] = gridMap[selected];   // e.g. [2,2] for 4-up
    const perPage = parseInt(selected);

    // Build booklet sheet sequence
    const totalSrcPages = Math.max(...lastNums.filter(n => n > 0));
    const sheets = buildBookletSequence(totalSrcPages, perPage);
    const totalSheets = sheets.length;
    const addedBlanks = sheets.flat().filter(n => n === 0).length;

    progressLabel.textContent = 'Loading PDF…';
    progressBar.style.width = '5%';
    await new Promise(r => setTimeout(r, 0));

    const arrayBuffer = await uploadedPdfFile.arrayBuffer();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const srcPageCount = pdfJsDoc.numPages;

    const outDoc = await PDFLib.PDFDocument.create();
    const bookletFont = await outDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Derive cell size from first source page
    const firstVp = (await pdfJsDoc.getPage(1)).getViewport({ scale: 1 });
    const srcW = firstVp.width, srcH = firstVp.height;
    const MARGIN = 20, GAP = 25;
    const sheetW = cols * srcW + (cols - 1) * GAP + MARGIN * 2;
    const sheetH = rows * srcH + (rows - 1) * GAP + MARGIN * 2;
    const cellW = srcW, cellH = srcH;
    const RENDER_SCALE = 4;

    progressBar.style.width = '10%';
    progressLabel.textContent = 'Imposing booklet… 0%';
    await new Promise(r => setTimeout(r, 0));

    for (let s = 0; s < totalSheets; s++) {
      const sheet = outDoc.addPage([sheetW, sheetH]);

      for (let i = 0; i < perPage; i++) {
        const pageNum = sheets[s][i]; // 1-based or 0
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellX = MARGIN + col * (cellW + GAP);
        const cellY = sheetH - MARGIN - (row + 1) * cellH - row * GAP;

        if (!pageNum || pageNum > srcPageCount) {
          sheet.drawRectangle({
            x: cellX, y: cellY, width: cellW, height: cellH,
            color: PDFLib.rgb(0.96, 0.96, 0.96),
            borderColor: PDFLib.rgb(0, 0, 0), borderWidth: 1,
          });
        } else {
          const srcCanvas = await renderPageToCanvas(pdfJsDoc, pageNum, RENDER_SCALE);
          const pngBytes  = await new Promise(res => srcCanvas.toBlob(b => b.arrayBuffer().then(res), 'image/png'));
          const img       = await outDoc.embedPng(pngBytes);
          const scaleX = cellW  / img.width  * RENDER_SCALE;
          const scaleY = cellH  / img.height * RENDER_SCALE;
          const scale  = Math.min(scaleX, scaleY);
          const drawW  = img.width  / RENDER_SCALE * scale;
          const drawH  = img.height / RENDER_SCALE * scale;
          sheet.drawImage(img, {
            x: cellX + (cellW - drawW) / 2,
            y: cellY + (cellH - drawH) / 2,
            width: drawW, height: drawH,
          });
          sheet.drawRectangle({
            x: cellX, y: cellY, width: cellW, height: cellH,
            borderColor: PDFLib.rgb(0, 0, 0), borderWidth: 1,
          });
          if (document.getElementById('addPatternNumChk').checked) {
            const label = String(pageNum);
            const fs  = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 15);
            const pad = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
            const hPos = document.getElementById('patternNumH').value;
            const vPos = document.getElementById('patternNumV').value;
            const tw  = bookletFont.widthOfTextAtSize(label, fs);
            const tx  = cellX + (hPos === 'left' ? pad : hPos === 'center' ? (cellW - tw) / 2 : cellW - tw - pad);
            const ty  = cellY + (vPos === 'top' ? cellH - fs - pad : pad);
            sheet.drawText(label, { x: tx, y: ty, size: fs, font: bookletFont, color: PDFLib.rgb(0, 0, 0) });
          }
        }
      }

      progressBar.style.width = (10 + Math.round(((s + 1) / totalSheets) * 82)) + '%';
      progressLabel.textContent = `Imposing booklet… ${Math.round(((s + 1) / totalSheets) * 100)}%`;
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
    a.download = uploadedPdfFile.name.replace(/\.pdf$/i, '') + `-booklet-${selected}up.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);

    document.getElementById('bookletMsg').textContent =
      `Done! ${totalSheets} sheet${totalSheets !== 1 ? 's' : ''} · ${sheets.flat().length} pages total` +
      (addedBlanks > 0 ? ` · ${addedBlanks} blank page${addedBlanks !== 1 ? 's' : ''} added` : '');
    successEl.style.display = 'flex';
    progressWrap.style.display = 'none';
    btn.disabled = false;
  } catch (err) {
    document.getElementById('bookletProgressWrap').style.display = 'none';
    btn.disabled = false;
    alert('Failed to generate booklet PDF: ' + err.message);
  }
});

document.getElementById('addPageNumBtn').addEventListener('click', async () => {
  if (!uploadedPdfFile) return;

  const btn = document.getElementById('addPageNumBtn');
  btn.disabled = true;
  btn.textContent = 'Processing…';

  try {
    const arrayBuffer = await uploadedPdfFile.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const fs = Math.max(4, parseInt(document.getElementById('patternNumSize').value) || 15);
    const pad = Math.max(0, parseInt(document.getElementById('patternNumMargin').value) || 0);
    const hPos = document.getElementById('patternNumH').value;
    const vPos = document.getElementById('patternNumV').value;

    pages.forEach((page, i) => {
      const label = String(i + 1);
      const { width: pw, height: ph } = page.getSize();
      const tw = font.widthOfTextAtSize(label, fs);
      const tx = hPos === 'left' ? pad : hPos === 'center' ? (pw - tw) / 2 : pw - tw - pad;
      const ty = vPos === 'top' ? ph - fs - pad : pad;
      page.drawText(label, { x: tx, y: ty, size: fs, font, color: PDFLib.rgb(0, 0, 0) });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = uploadedPdfFile.name.replace(/\.pdf$/i, '') + '-numbered.pdf';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert('Failed to add page numbers: ' + err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Add Pages Number in PDF';
});

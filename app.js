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
  uploadedPdfFile = file;

  const pdfInfo = document.getElementById('pdfInfo');
  const pdfLabel = document.getElementById('pdfLabel');
  pdfInfo.textContent = 'Reading PDF...';
  pdfInfo.style.color = '#6b7280';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    document.getElementById('limit').value = pageCount;
    pdfLabel.textContent = file.name;
    pdfInfo.textContent = `✓ ${pageCount} pages detected — input auto-filled`;
    pdfInfo.style.color = '#059669';
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
        const arrayBuffer = await uploadedPdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();
        for (let i = 0; i < needed; i++) {
          pdfDoc.addPage([width, height]);
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = uploadedPdfFile.name.replace('.pdf', '') + '-with-blanks.pdf';
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
    const cellW = (pageW - 80) / cols;
    const cellH = (pageH - 80) / rows;

    pageNums.forEach((num, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 40 + col * cellW + cellW / 2;
      const y = pageH - 40 - row * cellH - cellH / 2;

      // Cell border
      page.drawRectangle({
        x: 40 + col * cellW,
        y: pageH - 40 - (row + 1) * cellH,
        width: cellW,
        height: cellH,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      if (num === '') {
        // Blank cell — light gray fill
        page.drawRectangle({
          x: 40 + col * cellW + 1,
          y: pageH - 40 - (row + 1) * cellH + 1,
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

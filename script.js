function buildRow(offset) {
  const template = [0, 2, 4, 6, 8, 10, 5, 3, 1, 11, 9, 7];
  return template.map(v => v + 1 + offset);
}

function generate() {
  const val = parseInt(document.getElementById('numInput').value);
  if (!val || val < 1) { alert('Please enter a valid number.'); return; }

  const rows = [];
  let offset = 0;

  while (true) {
    const row = buildRow(offset).filter(n => n <= val);
    if (row.length === 0) break;
    rows.push(row);
    offset += 12;
    if (offset >= val) break;
  }

  const allNums = rows.flat();
  document.getElementById('output').innerHTML =
    `<div>${allNums.map(n => `<span class="num">${n}</span>`).join(`<span class="sep">,</span>`)}</div>`;

  document.getElementById('outputLabel').textContent = `Pattern up to ${val} — ${rows.length} row(s)`;
  document.getElementById('outputWrapper').style.display = 'block';
}

function copyOutput() {
  const text = document.getElementById('output').innerText.replace(/\n/g, ',\n');
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  });
}

document.getElementById('numInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') generate();
});

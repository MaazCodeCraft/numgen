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
  });
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
    msgEl.textContent = `Warning: Not perfectly divisible. ${pagesText}`;
    msgEl.style.display = 'block';
    document.body.classList.remove('flash-red');
    void document.body.offsetWidth;
    document.body.classList.add('flash-red');
  }
}

document.getElementById('genBtn').addEventListener('click', () => {
  if (!selected) return;
  const max = parseInt(document.getElementById('limit').value);
  if (!max || max < 1) { alert('Please enter a valid maximum number.'); return; }

  showValidation(max, selected);

  const nums = selected === '4' ? generate4(max) : selected === '8' ? generate8(max) : selected === '9' ? generate9(max) : generate6(max);
  document.getElementById('output').textContent = nums.join(', ');
  outputWrapper.style.display = 'block';
  infoBox.style.display = 'block';
  document.getElementById('statTotal').textContent = nums.length.toLocaleString();
  document.getElementById('statPages').textContent = Math.ceil(nums.length / parseInt(selected)).toLocaleString();
  document.getElementById('statMode').textContent = selected + ' per page';
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

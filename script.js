function generate4(max) {
  const nums = [];
  let base = 1;
  while (true) {
    const block = [base, base+2, base+4, base+6, base+3, base+1, base+7, base+5];
    for (const n of block) {
      if (n > max) return nums;
      nums.push(n);
    }
    base += 8;
  }
}

function generate8(max) {
  const nums = [];
  let base = 1;
  while (true) {
    const block = [
      base, base+2, base+4, base+6, base+8, base+10, base+12, base+14,
      base+7, base+5, base+3, base+1,
      base+15, base+13, base+11, base+9
    ];
    for (const n of block) {
      if (n > max) return nums;
      nums.push(n);
    }
    base += 16;
  }
}

function generate9(max) {
  const nums = [];
  let base = 1;
  while (true) {
    const block = [
      base, base+2, base+4, base+6, base+8, base+10, base+12, base+14, base+16,
      base+5, base+3, base+1,
      base+11, base+9, base+7,
      base+17, base+15, base+13
    ];
    for (const n of block) {
      if (n > max) return nums;
      nums.push(n);
    }
    base += 18;
  }
}

function generate6(max) {
  const nums = [];
  let base = 1;
  while (true) {
    const block = [
      base, base+2, base+4, base+6, base+8, base+10,
      base+5, base+3, base+1,
      base+11, base+9, base+7
    ];
    for (const n of block) {
      if (n > max) return nums;
      nums.push(n);
    }
    base += 12;
  }
}

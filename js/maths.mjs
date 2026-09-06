export function factorial(n) {
  let total = 1;
  for (let i = 1; i <= n; i++) {
    total = total * i;
  }

  return total;
}

export function nCr(n, r) {
  if (r === 2) {
    return nC2(n);
  }

  throw new Error("nCr not implemented for r != 2");
}

export function nC2(n) {
  if (n < 0) {
    return 0;
  }

  return (n * (n - 1)) / 2;
}

type CompareOptions = {
  strict: boolean;
};

export default function isEqualArrays<T>(
  a: T[],
  b: T[],
  options?: CompareOptions
): boolean {
  const compareOption = options || { strict: false };
  if (!compareOption.strict) {
    const aSet = new Set(a);
    const bSet = new Set(b);
    return (
      aSet.size === bSet.size && Array.from(aSet).every((val) => bSet.has(val))
    );
  }

  return a.length === b.length && a.every((val, index) => val === b[index]);
}

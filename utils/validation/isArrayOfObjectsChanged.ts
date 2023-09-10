export default function isArrayOfObjectsChanged(
  originalArray: Array<{ [key: string]: any }>,
  newArray: Array<{ [key: string]: any }>
): boolean {
  if (originalArray.length !== newArray.length) {
    return true;
  }

  return originalArray.some((originalObj, index) => {
    const newObj = newArray[index];
    const keys = Object.keys(originalObj);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (originalObj[key] !== newObj[key]) {
        return true;
      }
    }
    return false;
  });
}

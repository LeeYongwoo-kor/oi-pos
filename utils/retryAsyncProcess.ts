type AsyncFunction<T> = () => Promise<T>;

export default async function retryAsyncProcess<T>(
  process: AsyncFunction<T>,
  retries: number,
  delay?: number
): Promise<T> {
  const setDelay = delay || 1000;
  try {
    return await process();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying ${process.name}... Remaining retries: ${retries}`);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          retryAsyncProcess(process, retries - 1, setDelay)
            .then(resolve)
            .catch(reject);
        }, setDelay);
      });
    }

    throw new Error(`Failed to complete ${process.name} after retries`);
  }
}

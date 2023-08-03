import { CustomError } from "./error/CustomError";

type AsyncFunction<T> = () => Promise<T>;

export default async function errorRetryProcess<T>(
  process: AsyncFunction<T>,
  retries: number,
  delay: number
): Promise<T> {
  const setDelay = delay;
  try {
    return await process();
  } catch (error) {
    if (error instanceof CustomError && error.statusCode !== 500) {
      throw error;
    }

    if (retries > 0) {
      //TODO: send to sentry
      console.warn(`Retrying ${process.name}... Remaining retries: ${retries}`);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          errorRetryProcess(process, retries - 1, setDelay)
            .then(resolve)
            .catch(reject);
        }, setDelay);
      });
    }

    //TODO: send to sentry
    console.error(`Failed to complete ${process.name} after retries`);
    throw error;
  }
}

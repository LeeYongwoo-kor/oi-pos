import { loadingState } from "@/recoil/state/loadingState";
import { useRecoilState } from "recoil";

function useLoading() {
  const [loading, setLoading] = useRecoilState(loadingState);

  const withLoading = async (func: () => any) => {
    setLoading(true);
    try {
      await func();
    } finally {
      setLoading(false);
    }
  };

  return withLoading;
}

export default useLoading;

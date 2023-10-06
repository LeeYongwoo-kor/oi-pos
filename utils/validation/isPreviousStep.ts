import isEmpty from "./isEmpty";

export default function isPreviousStep(
  steps: readonly string[],
  currentPageUrl: string,
  requiredPageUrl: string
): boolean {
  if (!currentPageUrl || !requiredPageUrl || isEmpty(steps)) {
    return true;
  }

  const lowerCaseSteps = steps.map((step) => step.toLocaleLowerCase());
  const currentPageStep = currentPageUrl.split("/").at(-1) ?? "";
  const requiredPageStep = requiredPageUrl.split("/").at(-1) ?? "";

  const currentPageIndex = lowerCaseSteps.indexOf(currentPageStep);
  const requiredPageIndex = lowerCaseSteps.indexOf(requiredPageStep);

  return currentPageIndex < requiredPageIndex;
}

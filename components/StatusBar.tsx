import React from "react";

type StatusBarProps<Steps extends readonly string[]> = {
  steps: Steps;
  currentStep: Steps[number];
};

export function StatusBar<T extends readonly string[]>({
  steps,
  currentStep,
}: StatusBarProps<T>) {
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="flex justify-between select-none">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`relative flex-grow ${
            index !== steps.length - 1 ? "mr-2" : ""
          }`}
        >
          <div
            className={`absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full z-10 ${
              currentStepIndex >= index
                ? "bg-sky-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1}
          </div>
          <div
            className={`absolute top-5 w-full h-1 ${
              currentStepIndex >= index ? "bg-sky-600" : "bg-gray-200"
            }`}
          />
          <div className="mt-8 text-sm text-center">{step}</div>
        </div>
      ))}
    </div>
  );
}

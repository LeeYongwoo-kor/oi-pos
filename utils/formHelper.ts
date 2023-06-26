import { FieldValues } from "react-hook-form";

export const isFormChanged = <T extends Record<string, any>>(
  originData: T,
  formData: FieldValues
): boolean => {
  return Object.keys(formData).some((key) => {
    return originData[key] !== formData[key];
  });
};

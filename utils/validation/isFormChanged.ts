import { FieldValues } from "react-hook-form";
import isEmpty from "./isEmpty";

const isFormChanged = <T extends Record<string, any>>(
  originData: T,
  formData: FieldValues
): boolean => {
  if (isEmpty(formData) || isEmpty(originData)) return true;

  return Object.keys(formData).some((key) => {
    return originData[key] !== formData[key];
  });
};

export default isFormChanged;

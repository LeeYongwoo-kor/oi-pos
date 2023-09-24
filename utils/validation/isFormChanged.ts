import { FieldValues } from "react-hook-form";
import isEmpty from "./isEmpty";

const normalizeValue = (value: any) =>
  value === "" || value === undefined ? null : value;
const isFormChanged = <T extends Record<string, any>>(
  originData: T,
  formData: FieldValues
): boolean => {
  if (isEmpty(formData) || isEmpty(originData)) return true;

  return Object.keys(formData).some((key) => {
    return normalizeValue(originData[key]) !== normalizeValue(formData[key]);
  });
};

export default isFormChanged;

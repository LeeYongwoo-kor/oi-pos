import {
  FieldError,
  Merge,
  FieldErrorsImpl,
  FieldValues,
} from "react-hook-form";

export function joinCls(...classnames: string[]) {
  return classnames.join(" ");
}

export function getInputFormCls(
  baseClass: string,
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined,
  touchedFields: Partial<
    Readonly<{
      [x: string]: any;
    }>
  >,
  watchedFields: FieldValues
): string {
  if (error) {
    return `${baseClass} border-red-500`;
  } else if (touchedFields && watchedFields) {
    return `${baseClass} border-green-500`;
  } else {
    return `${baseClass} border-gray-400`;
  }
}

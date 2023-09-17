import editCategoryFormReducer, {
  EditCategoryFormAction,
  EditCategoryFormActionTypes,
  EditCategoryFormState,
  editCategoryFormAcitonTypes,
  initialCategoryFormState,
} from "./editCategoryFormReducer";
import editFormReducer, {
  EditFormAction,
  EditFormActionTypes,
  EditFormState,
  editFormAcitonTypes,
  initialFormState,
} from "./editFormReducer";
import editImageReducer, {
  EditImageAction,
  EditImageActionTypes,
  EditImageState,
  editImageAcitonTypes,
  initialImageState,
} from "./editImageReducer";
import editOptionsReducer, {
  EditOptionsAction,
  EditOptionsActionTypes,
  EditOptionsState,
  editOptionsActionTypes,
  initialOptionsState,
} from "./editOptionsReducer";

interface MenuCategoryEditState
  extends EditImageState,
    EditOptionsState,
    EditCategoryFormState,
    EditFormState {}

export type MenuCategoryEditAction =
  | { type: "RESET" }
  | EditCategoryFormAction
  | EditOptionsAction
  | EditImageAction
  | EditFormAction;

export const initialEditCategoryState: MenuCategoryEditState = {
  ...initialImageState,
  ...initialOptionsState,
  ...initialCategoryFormState,
  ...initialFormState,
};

function isEditImageAction(
  action: MenuCategoryEditAction
): action is EditImageAction {
  return editImageAcitonTypes.includes(action.type as EditImageActionTypes);
}

function isEditOptionsAction(
  action: MenuCategoryEditAction
): action is EditOptionsAction {
  return editOptionsActionTypes.includes(action.type as EditOptionsActionTypes);
}

function isEditCategoryFormAction(
  action: MenuCategoryEditAction
): action is EditCategoryFormAction {
  return editCategoryFormAcitonTypes.includes(
    action.type as EditCategoryFormActionTypes
  );
}

function isEditFormAction(
  action: MenuCategoryEditAction
): action is EditFormAction {
  return editFormAcitonTypes.includes(action.type as EditFormActionTypes);
}

const menuCategoryEditReducer = (
  state: MenuCategoryEditState,
  action: MenuCategoryEditAction
): MenuCategoryEditState => {
  if (action.type === "RESET") {
    return initialEditCategoryState;
  }

  if (isEditImageAction(action)) {
    return { ...state, ...editImageReducer(state, action) };
  }
  if (isEditOptionsAction(action)) {
    return { ...state, ...editOptionsReducer(state, action) };
  }
  if (isEditCategoryFormAction(action)) {
    return { ...state, ...editCategoryFormReducer(state, action) };
  }
  if (isEditFormAction(action)) {
    return { ...state, ...editFormReducer(state, action) };
  }

  return state;
};

export default menuCategoryEditReducer;

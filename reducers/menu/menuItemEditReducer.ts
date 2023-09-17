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
import editMenuFormReducer, {
  EditMenuFormAction,
  EditMenuFormActionTypes,
  EditMenuFormState,
  editMenuFormAcitonTypes,
  initialMenuFormState,
} from "./editMenuFormReducer";
import editOptionsReducer, {
  EditOptionsAction,
  EditOptionsActionTypes,
  EditOptionsState,
  editOptionsActionTypes,
  initialOptionsState,
} from "./editOptionsReducer";

interface MenuItemEditState
  extends EditImageState,
    EditOptionsState,
    EditMenuFormState,
    EditFormState {}

export type MenuItemEditAction =
  | { type: "RESET" }
  | EditMenuFormAction
  | EditOptionsAction
  | EditImageAction
  | EditFormAction;

export const initialEditMenuState: MenuItemEditState = {
  ...initialImageState,
  ...initialOptionsState,
  ...initialMenuFormState,
  ...initialFormState,
};

function isEditImageAction(
  action: MenuItemEditAction
): action is EditImageAction {
  return editImageAcitonTypes.includes(action.type as EditImageActionTypes);
}

function isEditOptionsAction(
  action: MenuItemEditAction
): action is EditOptionsAction {
  return editOptionsActionTypes.includes(action.type as EditOptionsActionTypes);
}

function isEditMenuFormAction(
  action: MenuItemEditAction
): action is EditMenuFormAction {
  return editMenuFormAcitonTypes.includes(
    action.type as EditMenuFormActionTypes
  );
}

function isEditFormAction(
  action: MenuItemEditAction
): action is EditFormAction {
  return editFormAcitonTypes.includes(action.type as EditFormActionTypes);
}

const menuItemEditReducer = (
  state: MenuItemEditState,
  action: MenuItemEditAction
): MenuItemEditState => {
  if (action.type === "RESET") {
    return initialEditMenuState;
  }

  if (isEditImageAction(action)) {
    return { ...state, ...editImageReducer(state, action) };
  }
  if (isEditOptionsAction(action)) {
    return { ...state, ...editOptionsReducer(state, action) };
  }
  if (isEditMenuFormAction(action)) {
    return { ...state, ...editMenuFormReducer(state, action) };
  }
  if (isEditFormAction(action)) {
    return { ...state, ...editFormReducer(state, action) };
  }

  return state;
};

export default menuItemEditReducer;

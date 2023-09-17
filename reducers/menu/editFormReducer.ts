export type IActiveTab = "essential" | "optional";

export interface EditFormState {
  activeTab: IActiveTab;
}

export type EditFormAction =
  | {
      type: "ACTIVE_TAP_ESSENTIAL";
    }
  | {
      type: "ACTIVE_TAP_OPTIONAL";
    };

export type EditFormActionTypes = ActionTypes<EditFormAction>;
export const editFormAcitonTypes: EditFormActionTypes[] = [
  "ACTIVE_TAP_ESSENTIAL",
  "ACTIVE_TAP_OPTIONAL",
];

export const initialFormState: EditFormState = {
  activeTab: "essential",
};

const editFormReducer = (
  state: EditFormState,
  action: EditFormAction
): EditFormState => {
  switch (action.type) {
    case "ACTIVE_TAP_ESSENTIAL":
      return { ...state, activeTab: "essential" };
    case "ACTIVE_TAP_OPTIONAL":
      return { ...state, activeTab: "optional" };
    default:
      return state;
  }
};

export default editFormReducer;

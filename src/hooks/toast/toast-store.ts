
import { Action, Toast, ToastContextState } from "./types";

// Constants
export const TOAST_LIMIT = 5;
export const TOAST_REMOVE_DELAY = 5000;

// Initial state
export const initialState: ToastContextState = {
  toasts: [],
};

// Toast reducer
export const toastReducer = (state: ToastContextState, action: Action): ToastContextState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, ...action.toast } : t
        ),
      };

    case "REMOVE_TOAST":
      if (action.toastId === "all") {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

// Counter for generating unique IDs
let count = 0;

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Memory state and listeners management
export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
export const listeners: Array<(state: ToastContextState) => void> = [];
export let memoryState: ToastContextState = initialState;

export function dispatch(action: Action) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

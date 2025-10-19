import * as React from "react";

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  type?: "foreground" | "background";
  duration?: number;
  variant?: "default" | "destructive";
};

type ToastState = {
  toasts: ToasterToast[];
};

type ToastActionType =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

const TOAST_LIMIT = 5;
let toastIdCounter = 0;

const generateToastId = () => {
  toastIdCounter = (toastIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${toastIdCounter}`;
};

const toastReducer = (
  state: ToastState,
  action: ToastActionType,
): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [
          action.toast,
          ...state.toasts.filter((toast) => toast.id !== action.toast.id),
        ].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      };

    case "DISMISS_TOAST":
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
  }
};

const ToastContext = React.createContext<{
  state: ToastState;
  dispatch: React.Dispatch<ToastActionType>;
}>({ state: { toasts: [] }, dispatch: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, localDispatch] = React.useReducer(toastReducer, { toasts: [] });

  const dispatch: typeof localDispatch = React.useCallback((action) => {
    localDispatch(action);
  }, []);

  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { state, dispatch } = React.useContext(ToastContext);

  const toast = React.useCallback(
    ({ ...input }: Omit<ToasterToast, "id"> & { id?: string }) => {
      const id = input.id ?? generateToastId();
      const toastData: ToasterToast = {
        ...input,
        id,
      };

      dispatch({ type: "ADD_TOAST", toast: toastData });

      const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
      const update = (next: Partial<ToasterToast>) =>
        dispatch({ type: "UPDATE_TOAST", toast: { id, ...next } });

      return { id, dismiss, update };
    },
    [dispatch],
  );

  const dismiss = React.useCallback(
    (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    [dispatch],
  );

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}

export type { ToasterToast };

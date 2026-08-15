export type SimpleFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

export const IDLE_FORM: SimpleFormState = { status: "idle", message: null };

export function formError(message: string): SimpleFormState {
  return { status: "error", message };
}

export function formSuccess(message: string): SimpleFormState {
  return { status: "success", message };
}

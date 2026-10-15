// Returns `set(key)`, a change handler that updates one field of the form data
export const fieldSetter =
  <D>(data: D, onChange: (data: D) => void) =>
  <K extends keyof D>(key: K) =>
  (value: D[K]): void =>
    onChange({ ...data, [key]: value });

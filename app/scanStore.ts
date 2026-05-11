let _value: string | null = null;

export const scanStore = {
  set:  (v: string) => { _value = v; },
  take: (): string | null => { const v = _value; _value = null; return v; },
};

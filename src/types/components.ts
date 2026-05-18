import type { ReactNode } from 'react';

export interface ChildrenProps {
  children: ReactNode;
}

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

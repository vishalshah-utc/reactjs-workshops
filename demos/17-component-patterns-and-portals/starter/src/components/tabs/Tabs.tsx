import type { ReactNode } from 'react';

/**
 * A COMPOUND component — <Tabs>, <Tabs.List>, <Tabs.Tab>, <Tabs.Panel> — sharing which tab is selected through
 * a private context, so the caller places the parts and never wires them. Built in Lab 1.
 */
interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

// TODO(lab-1.1): a private TabsContext { value, select, baseId } (useId for the ids); Tabs owns the selection
// (value | defaultValue + onValueChange); Tabs.List renders role="tablist"; Tabs.Tab a <button role="tab"> with
// aria-selected / aria-controls / tabIndex; Tabs.Panel a role="tabpanel" with aria-labelledby, hidden when not selected.
export function Tabs({ className, children }: TabsProps) {
  return <div className={className}>{children}</div>;
}

// TODO(lab-1.2): roving tabindex — ArrowLeft / ArrowRight / Home / End on the list move focus AND select (WAI-ARIA tabs pattern)
function TabsList({ children }: { 'aria-label': string; children: ReactNode }) {
  return <div className="nav nav-tabs mb-3">{children}</div>;
}

function TabsTab({ children }: { value: string; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="nav-link">
      {children}
    </button>
  );
}

function TabsPanel({ children }: { value: string; children: ReactNode }) {
  return <div>{children}</div>;
}

// TODO(lab-2.2): once useControllableState exists, Tabs's selection logic moves onto it (the same hook Pager uses)
Tabs.List = TabsList;
Tabs.Tab = TabsTab;
Tabs.Panel = TabsPanel;

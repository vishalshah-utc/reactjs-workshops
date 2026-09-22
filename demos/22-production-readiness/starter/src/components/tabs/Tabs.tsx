import { createContext, useContext, useId, useMemo, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { Spinner } from 'react-bootstrap';
import { useControllableState } from '../../hooks/useControllableState';

/**
 * What every part of a <Tabs> needs to know, shared IMPLICITLY through context: which tab is selected, how to
 * change it, and one id prefix so aria-controls / aria-labelledby can point at each other without the caller
 * inventing ids. Private — nothing outside this file may read it.
 */
interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  baseId: string;
  /** The tab whose panel is still rendering in the background, or null. Demo 18 Lab 4. */
  pending: string | null;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/** The parts refuse to render outside the root — a compound component's one rule, enforced with a clear message. */
function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === undefined) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>.`);
  return context;
}

const tabId = (baseId: string, value: string) => `${baseId}-tab-${value}`;
const panelId = (baseId: string, value: string) => `${baseId}-panel-${value}`;

interface TabsProps {
  /** CONTROLLED: the parent owns the selected tab (URL state, say). */
  value?: string;
  /** UNCONTROLLED: the tab to start on. The component keeps its own selection from then on. */
  defaultValue?: string;
  /** Fires in both modes. Named after the value, not the event — nobody outside learns there is a <button>. */
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

/**
 * A COMPOUND component: <Tabs> owns the state; <Tabs.List>, <Tabs.Tab> and <Tabs.Panel> are placed by the
 * caller, in any order, with any markup between them. Compare the alternative — `<Tabs items={[{ label,
 * content, icon?, disabled?, lazy? }]}>` — where every new need is a new prop on the item object.
 * Here a tab with an icon is a <Tabs.Tab> with an icon in it. The API is JSX.
 */
export function Tabs({ value, defaultValue = '', onValueChange, className, children }: TabsProps) {
  const [selected, setSelected] = useControllableState({ value, defaultValue, onChange: onValueChange });
  // useId: unique per component instance, stable across renders, identical on server and client.
  // Two <Tabs> on one page never collide, and nobody passes an `id` prop.
  const baseId = useId();

  // TWO updates from one click, on purpose:
  //   `setRequested` is URGENT — it renders immediately, so the tab can show a spinner this frame.
  //   `setSelected` is a TRANSITION — React may render the new panel in the background and keep the old one
  //   on screen until it is ready, and will throw that work away if you click a third tab meanwhile.
  // The panel is what might be expensive; the acknowledgement must never wait for it (📖 study-notes 15 §9).
  const [isPending, startTransition] = useTransition();
  const [requested, setRequested] = useState<string | null>(null);

  function select(next: string) {
    setRequested(next);
    startTransition(() => setSelected(next));
  }

  // `requested` outlives the transition, so it is only meaningful WHILE one is running.
  const pending = isPending ? requested : null;

  const context = useMemo(() => ({ value: selected, select, baseId, pending }), [selected, select, baseId, pending]);

  return (
    <TabsContext value={context}>
      <div className={className}>{children}</div>
    </TabsContext>
  );
}

interface TabsListProps {
  'aria-label': string; // a tablist with no name is announced as "tab list" and nothing else
  children: ReactNode;
}

/** Where a key press moves focus to, given the focused tab's index. `undefined` → not our key. */
function nextTabIndex(key: string, index: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

function TabsList({ 'aria-label': ariaLabel, children }: TabsListProps) {
  // ROVING TABINDEX: the whole list is ONE Tab stop (the selected tab has tabIndex 0, the rest -1), and the arrow
  // keys move within it — the WAI-ARIA tabs pattern. Handled on the list, once, not on every tab.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    const next = nextTabIndex(event.key, index, tabs.length);
    if (next === undefined) return;
    event.preventDefault(); // ArrowLeft/Right would otherwise scroll a wide list; Home/End would scroll the page
    tabs[next].focus();
    tabs[next].click(); // "automatic activation": focusing a tab selects it — the button's onClick does the rest
  }

  // Bootstrap's classes, our elements: `nav nav-tabs` on the list, `nav-link` on each tab. No <Nav> component —
  // its own keyboard and role handling would fight ours.
  return (
    <div role="tablist" aria-label={ariaLabel} className="nav nav-tabs mb-3" onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

interface TabsTabProps {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

function TabsTab({ value, disabled = false, children }: TabsTabProps) {
  const { value: selected, select, baseId, pending } = useTabsContext('Tab');
  const isSelected = selected === value;
  const isPending = pending === value;

  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isSelected}
      aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      className={clsx('nav-link', isSelected && 'active')}
      onClick={() => select(value)}
    >
      {children}
      {/* Only ever visible when the new panel takes longer than a frame — which, for a cheap panel, is never. */}
      {isPending && <Spinner animation="border" size="sm" className="ms-2" role="status" aria-label="Loading" />}
    </button>
  );
}

interface TabsPanelProps {
  value: string;
  children: ReactNode;
}

function TabsPanel({ value, children }: TabsPanelProps) {
  const { value: selected, baseId } = useTabsContext('Panel');
  const isSelected = selected === value;

  // Every panel is in the DOM, hidden when not selected: its id exists for aria-controls, and its state survives
  // a tab switch (a half-written review form does not vanish). Rendering `null` instead is the lazy variant.
  return (
    <div role="tabpanel" id={panelId(baseId, value)} aria-labelledby={tabId(baseId, value)} hidden={!isSelected} tabIndex={0}>
      {children}
    </div>
  );
}

// The parts hang off the root as properties: one import, and the JSX reads as a sentence — <Tabs.List>, <Tabs.Tab>.
// TypeScript allows property assignment on a function declaration in the same scope ("expando"); the types follow.
Tabs.List = TabsList;
Tabs.Tab = TabsTab;
Tabs.Panel = TabsPanel;

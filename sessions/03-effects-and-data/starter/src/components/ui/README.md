# `components/ui` — the design system primitives

These are **shadcn/ui** components. shadcn is not a dependency you install —
it is source code you own. Every file here is yours to read, edit and extend,
and that is the entire point of the approach.

They are **pre-vendored** into this starter so nobody spends live workshop
minutes running a CLI. If you want more of them later:

```bash
npx shadcn@latest add dropdown-menu table tabs
```

Two conventions to notice, because you will copy them all course:

1. **Every component takes `className` and merges it with `cn()`.** That is
   what lets a caller restyle a component without `!important` or a wrapper div.
2. **Variants come from `cva`,** not from a pile of booleans. `<Button
   variant="destructive" size="sm">` beats `<Button isDestructive isSmall>` —
   the states stay mutually exclusive and TypeScript autocompletes them.

Radix primitives (`@radix-ui/*`) handle the accessibility: focus traps,
`aria-*` wiring, keyboard navigation, escape-to-close. You get that for free
here, and Session 10's accessibility pass will show you what it saved you.

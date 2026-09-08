# Module 20 — Shipping to Production

**Study notes** · ~2 hours · *status: outline — full notes to be written*

## Learning objectives

- Take an app from "works on my machine" to "runs for users, observably"
- Build accessibility, security and performance budgets into the pipeline
- Know what to check before every release

## Topics

1. **Build and environment** — production builds, environment variables per
   environment, the hard rule that **anything in a client bundle is public**
2. **Deployment targets** — static host/CDN for CSR and SSG; Node or edge
   runtime for SSR; Docker; the SPA fallback rewrite; cache headers and
   content-hashed assets
3. **CI/CD quality gates** — typecheck → lint → unit → build → e2e → deploy;
   preview deployments per pull request; failing the build on a bundle-size
   regression
4. **Accessibility** — semantic HTML first, keyboard-only pass, focus
   management on route change, colour contrast, `prefers-reduced-motion`, screen
   reader smoke test, automated `axe` in CI as a floor and not a ceiling
5. **Performance in production** — Core Web Vitals (LCP, INP, CLS), real-user
   monitoring vs Lighthouse, image and font strategy, bundle budgets, what
   Module 3's rendering choice already decided for you
6. **Error handling and observability** — error boundaries at route and widget
   level, an error reporting service, source maps uploaded but not served,
   structured logging, meaningful user-facing failure states
7. **Security** — XSS and why `dangerouslySetInnerHTML` needs sanitising, CSP,
   token storage trade-offs, CSRF for cookie auth, dependency auditing, never
   trusting the client (including Server Functions)
8. **SEO and metadata** — titles and descriptions per route, Open Graph and
   Twitter cards, canonical URLs, structured data, sitemap and robots — and why
   most of this needs SSR/SSG
9. **Internationalisation** — message extraction, `Intl` for dates, numbers and
   currency, pluralisation, RTL
10. **Maintenance** — dependency updates, React version upgrades, deprecation
    warnings, a Storybook or component inventory, documenting the architecture
    decisions you made
11. **Release checklist** — a printable pre-deploy list

## Exercises

- Add a GitHub Actions workflow running the full gate on every PR
- Do a keyboard-only pass of the whole app and fix everything you find
- Break the app deliberately in three ways and confirm each produces a usable
  error state and a report you can act on
- Set a bundle budget and make CI fail when it is exceeded

## References

- [Creating a React App](https://react.dev/learn/creating-a-react-app)
- [Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [`Component` — `componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
- [`<Profiler>`](https://react.dev/reference/react/Profiler)
- [`lazy`](https://react.dev/reference/react/lazy) · [`Suspense`](https://react.dev/reference/react/Suspense)
- [`dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [`<title>` and document metadata](https://react.dev/reference/react-dom/components/title)
- [Rules of React](https://react.dev/reference/rules)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)

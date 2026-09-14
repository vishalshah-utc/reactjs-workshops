/**
 * A page title. Lab 2.1 gives it a description and an `actions` SLOT so the
 * caller can drop any buttons in without this file ever changing again.
 */
// TODO(lab-2.1): add `description` and an `actions` slot (typed ReactNode)
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h1 className="h3 mb-1">{title}</h1>
    </div>
  );
}

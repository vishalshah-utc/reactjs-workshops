import { useInventoryStore } from '../../store/inventory';
import { selectSelectedCount } from '../../store/inventory/selectors';

/**
 * TODO(lab-5.3): the bulk bar — "Select page" / "Clear", the selected count,
 * a "+10 stock to selected" button disabled while `bulkStatus === 'running'`,
 * an Undo that appears only while an `undoSnapshot` exists, and the report:
 * "9 of 10 updated · 1 rolled back", with the failing ids and their reasons
 * listed. Say the partial result out loud — "Something went wrong" would be a
 * lie about the nine rows that are fine.
 */
export function BulkBar() {
  const selectedCount = useInventoryStore(selectSelectedCount);
  if (selectedCount === 0) return null;
  return <div className="text-muted small mb-3">{selectedCount} selected</div>;
}

import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { ProductImage } from '@/components/ProductImage';
import { formatPrice } from '@/lib/utils';

interface BackOfficeProductsProps {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

/**
 * The catalogue management screen.
 *
 * Note there is no authentication on this — anyone can reach it and delete
 * anything. That is deliberate and temporary: Session 6 adds roles and
 * permissions, and this page is the thing it locks down. Building the screen
 * first and securing it second is also how it usually happens in real life,
 * which is worth noticing.
 */
export function BackOfficeProducts({ products, onAdd, onEdit, onDelete }: BackOfficeProductsProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        description={`${products.length} products`}
        actions={
          <Button onClick={onAdd}>
            <PlusIcon />
            Add product
          </Button>
        }
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                  No products yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="bg-muted size-9 overflow-hidden rounded-md">
                      <ProductImage seed={product.slug} name={product.name} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs">{product.brandName}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-right">
                    {product.stockQuantity === 0 ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : product.stockQuantity <= 5 ? (
                      <Badge variant="warning">{product.stockQuantity}</Badge>
                    ) : (
                      <span className="tabular-nums">{product.stockQuantity}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}>
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-destructive size-8"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => onDelete(product.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

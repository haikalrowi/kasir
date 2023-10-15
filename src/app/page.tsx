"use client";

import { Prisma } from "@prisma/client";
import { useEffect, useId, useState } from "react";

import slug from "@/lib/slug";

export default function Home() {
  const cashier = useCashier();

  return (
    <main>
      <UpdateReceipt {...cashier} />
      <div className="fixed inset-x-0 bottom-0 m-2 grid gap-2 bg-green-100 p-2">
        <FindProduct {...cashier} />
        <PrintReceipt {...cashier} />
      </div>
    </main>
  );
}

function FindProduct({ hooks, slugs }: ReturnType<typeof useCashier>) {
  const productListId = useId();

  return (
    <div>
      <form
        className="grid grid-cols-12 gap-2"
        onSubmit={(ev) => {
          const fd = new FormData(ev.currentTarget);
          ev.preventDefault();
          ev.currentTarget.reset();
          slugs
            .searchProductByName(fd.get("product-name") as Product["name"])
            .then((product) => {
              if (product && hooks.receipt) {
                slugs
                  .createReceiptItem(hooks.receipt.id, product.id)
                  .then(slugs.refreshReceipt);
              }
            });
        }}
      >
        <input
          className="col-span-9 border border-neutral-500 p-1"
          type="text"
          name="product-name"
          placeholder="Nama produk"
          list={productListId}
          required
          onInput={(ev) => {
            if (ev.currentTarget.value.length === 2) {
              slugs
                .searchProductsByName(ev.currentTarget.value)
                .then((products) => {
                  hooks.setProducts(products);
                });
            }
          }}
        />
        <button className="col-span-3 bg-green-200" type="submit">
          Tambah
        </button>
        <datalist id={productListId}>
          {hooks.products?.map((product) => (
            <option key={product.id} value={product.name} />
          ))}
        </datalist>
      </form>
    </div>
  );
}

function UpdateReceipt({ hooks, slugs }: ReturnType<typeof useCashier>) {
  return (
    <div>
      <table
        className="w-full table-fixed
        [&_td:nth-child(4)]:text-right"
      >
        <colgroup>
          <col className="w-5/12" />
          <col className="collapse" />
          <col className="w-4/12" />
          <col className="w-3/12" />
        </colgroup>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Harga</th>
            <th>Jumlah</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {hooks.receipt?.ReceiptItem.map((receiptItem) => (
            <tr key={receiptItem.id}>
              <td>{receiptItem.Product.name}</td>
              <td>{receiptItem.Product.price.toLocaleString()}</td>
              <td>
                <input
                  className="inline-block w-full text-center"
                  type="number"
                  defaultValue={receiptItem.quantity}
                  onInput={(ev) => {
                    slugs
                      .updateReceiptItemQuantity(
                        receiptItem.id,
                        parseInt(ev.currentTarget.value),
                      )
                      .then(slugs.refreshReceipt);
                  }}
                />
              </td>
              <td>
                {(
                  receiptItem.Product.price * receiptItem.quantity
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          {hooks.receipt?.ReceiptItem.length! >= 1 ? (
            <tr className="text-right">
              <th colSpan={3}>Total akhir</th>
              <th>
                {hooks.receipt?.ReceiptItem.reduce(
                  (a, b) => a + b.Product.price * b.quantity,
                  0,
                ).toLocaleString()}
              </th>
            </tr>
          ) : (
            <tr className="text-center opacity-30">
              <td colSpan={4}>Tambah minimal 1 produk</td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

function PrintReceipt({ hooks, slugs }: ReturnType<typeof useCashier>) {
  return (
    <div className="grid place-items-center">
      <button
        className="bg-green-200 p-1"
        type="button"
        onClick={() => {
          if (hooks.receipt) {
            slugs.updateReceiptAsFinished(hooks.receipt.id).then(() => {
              if (hooks.receipt)
                location.assign(`/receipts/print?id=${hooks.receipt.id}`);
            });
          }
        }}
      >
        Cetak nota
      </button>
    </div>
  );
}

function useCashier() {
  const [products, setProducts] = useState<Product[]>();
  const [receipt, setReceipt] = useState<Receipt>();

  const refreshReceipt = () => {
    slug(`receipt.findFirst({
      where: { finished: false },
      include: { ReceiptItem: { include: { Product: true } } },
    })`)
      .then((receipt) => {
        if (receipt) {
          return receipt;
        }

        return slug(`receipt.create({
          data: { finished: false },
          include: { ReceiptItem: { include: { Product: true } } },
        })`);
      })
      .then((receipt) => {
        setReceipt(receipt);
      });
  };
  const searchProductsByName = (name: Product["name"]) => {
    return slug(`product.findMany({
      where: { name: { contains: "${name}", mode: "insensitive" } },
    })`);
  };
  const searchProductByName = (name: Product["name"]): Promise<Product> => {
    return slug(`product.findUnique({ where: { name: "${name}" } })`);
  };
  const createReceiptItem = (
    receiptId: Receipt["id"],
    productId: Product["id"],
  ) => {
    return slug(`receiptItem.create({
      data: { receiptId: "${receiptId}", productId: "${productId}" },
    })`);
  };
  const updateReceiptItemQuantity = (
    id: ReceiptItem["id"],
    quantity: ReceiptItem["quantity"],
  ) => {
    return slug(`receiptItem.update({
      data: { quantity: ${quantity} },
      where: { id: "${id}" },
    })`);
  };
  const updateReceiptAsFinished = (id: Receipt["id"]) => {
    return slug(`receipt.update({
      data: { finished: true },
      where: { id: "${id}" },
    })`);
  };

  useEffect(refreshReceipt, []);

  return {
    hooks: { products, setProducts, receipt, setReceipt },
    slugs: {
      refreshReceipt,
      searchProductsByName,
      searchProductByName,
      createReceiptItem,
      updateReceiptAsFinished,
      updateReceiptItemQuantity,
    },
  };
}

type Product = Prisma.ProductGetPayload<{}>;
type Receipt = Prisma.ReceiptGetPayload<{
  include: { ReceiptItem: { include: { Product: true } } };
}>;
type ReceiptItem = Prisma.ReceiptItemGetPayload<{}>;

"use client";

import { Prisma } from "@prisma/client";
import { useEffect, useId, useState } from "react";

import slug from "@/lib/slug";

export default function Home() {
  const cashier = useCashier();

  return (
    <main>
      <UpdateReceipt {...cashier} />
      <div className="sticky bottom-4 grid grid-cols-12 gap-2">
        <PrintReceipt {...cashier} />
        <FindProduct {...cashier} />
      </div>
    </main>
  );
}

function UpdateReceipt({ hooks, slugs }: ReturnType<typeof useCashier>) {
  return (
    <div className="min-h-screen">
      <table>
        <colgroup>
          <col className="w-3/12" />
          <col className="w-3/12" />
          <col className="w-3/12" />
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
        <tbody
          className="[&_td:nth-child(2)]:text-center
          [&_td:nth-child(4)]:text-right"
        >
          {hooks.receipt?.ReceiptItem.map((receiptItem) => (
            <tr key={receiptItem.id}>
              <td>{receiptItem.Product.name}</td>
              <td>{receiptItem.Product.price.toLocaleString()}</td>
              <td>
                <div className="grid grid-cols-1">
                  <input
                    className="text-center"
                    type="number"
                    id={receiptItem.id}
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
                </div>
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
          {hooks.receipt ? (
            hooks.receipt.ReceiptItem.length >= 1 ? (
              <>
                <tr>
                  <th colSpan={3}>Total akhir</th>
                  <th>
                    {hooks.receipt?.ReceiptItem.reduce(
                      (a, b) => a + b.Product.price * b.quantity,
                      0,
                    ).toLocaleString()}
                  </th>
                </tr>
                <tr>
                  <td className="text-center" colSpan={4}>
                    <a
                      className="text-pink-300 underline"
                      href="#"
                      onClick={(ev) => {
                        ev.preventDefault();
                        slugs
                          .deleteAllReceiptItem(hooks.receipt?.id!)
                          .then(slugs.refreshReceipt);
                      }}
                    >
                      Bersihkan semua
                    </a>
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="text-center text-pink-300" colSpan={4}>
                  Tambah minimal 1 produk
                </td>
              </tr>
            )
          ) : (
            <tr>
              <td className="text-center text-pink-300" colSpan={4}>
                Memuat...
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

function PrintReceipt({ hooks, slugs }: ReturnType<typeof useCashier>) {
  return (
    <div className="col-span-3 grid">
      <button
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

function FindProduct({ hooks, slugs }: ReturnType<typeof useCashier>) {
  const productListId = useId();

  return (
    <div className="col-span-9">
      <form
        className="grid grid-cols-1 gap-1"
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
        <button type="submit">Tambah</button>
        <datalist id={productListId}>
          {hooks.products?.map((product) => (
            <option key={product.id} value={product.name} />
          ))}
        </datalist>
      </form>
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
      where: { name: { contains: \`${name}\`, mode: "insensitive" } },
    })`);
  };
  const searchProductByName = (name: Product["name"]): Promise<Product> => {
    return slug(`product.findUnique({ where: { name: \`${name}\` } })`);
  };
  const createReceiptItem = (
    receiptId: Receipt["id"],
    productId: Product["id"],
  ) => {
    return slug(`receiptItem.create({
      data: { receiptId: \`${receiptId}\`, productId: \`${productId}\` },
    })`);
  };
  const updateReceiptItemQuantity = (
    id: ReceiptItem["id"],
    quantity: ReceiptItem["quantity"],
  ) => {
    return slug(`receiptItem.update({
      data: { quantity: ${quantity} },
      where: { id: \`${id}\` },
    })`);
  };
  const deleteAllReceiptItem = (receiptId: Receipt["id"]) => {
    return slug(
      `receiptItem.deleteMany({ where: { receiptId: \`${receiptId}\` } })`,
    );
  };
  const updateReceiptAsFinished = (id: Receipt["id"]) => {
    return slug(`receipt.update({
      data: { finished: true },
      where: { id: \`${id}\` },
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
      deleteAllReceiptItem,
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

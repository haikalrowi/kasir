"use client";

import { Prisma } from "@prisma/client";
import { useEffect, useId, useState } from "react";

import slug from "@/lib/slug";

export default function Home() {
  const cashier = useCashier();

  return (
    <main>
      <FindProduct {...cashier} />
      <UpdateReceipt {...cashier} />
      <PrintReceipt {...cashier} />
    </main>
  );
}

function FindProduct({ hooks, slugs }: ReturnType<typeof useCashier>) {
  const productListId = useId();

  return (
    <div>
      <form
        onSubmit={(ev) => {
          const fd = new FormData(ev.currentTarget);
          ev.preventDefault();
          ev.currentTarget.reset();
          slugs
            .searchProductByName(fd.get("product-name") as Product["name"])
            .then((product) => {
              slugs
                .createReceiptItem(
                  hooks.receipt?.id as Receipt["id"],
                  product.id
                )
                .then(slugs.refreshReceipt);
            });
        }}
      >
        <input
          type="text"
          name="product-name"
          placeholder="Nama produk"
          list={productListId}
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
        <button type="submit">Tambah ke nota</button>
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
      <table>
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
                <button
                  type="button"
                  onClick={() => {
                    slugs
                      .decreaseReceiptItemQuantity(receiptItem.id)
                      .then(slugs.refreshReceipt);
                  }}
                >
                  -1
                </button>
                <span>{receiptItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    slugs
                      .increaseReceiptItemQuantity(receiptItem.id)
                      .then(slugs.refreshReceipt);
                  }}
                >
                  +1
                </button>
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
          <tr>
            <td colSpan={2}>Total akhir</td>
            <td colSpan={2}>
              {hooks.receipt?.ReceiptItem.reduce(
                (a, b) => a + b.Product.price * b.quantity,
                0
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PrintReceipt({ hooks, slugs }: ReturnType<typeof useCashier>) {
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          slugs
            .updateReceiptAsFinished(hooks.receipt?.id as Receipt["id"])
            .then(slugs.refreshReceipt);
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
    productId: Product["id"]
  ) => {
    return slug(`receiptItem.create({
      data: { receiptId: "${receiptId}", productId: "${productId}" },
    })`);
  };
  const increaseReceiptItemQuantity = (id: ReceiptItem["id"]) => {
    return slug(`receiptItem.update({
      data: { quantity: { increment: 1 } },
      where: { id: "${id}" },
    })`);
  };
  const decreaseReceiptItemQuantity = (id: ReceiptItem["id"]) => {
    return slug(`receiptItem.update({
      data: { quantity: { decrement: 1 } },
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
      increaseReceiptItemQuantity,
      decreaseReceiptItemQuantity,
      updateReceiptAsFinished,
    },
  };
}

type Product = Prisma.ProductGetPayload<{}>;
type Receipt = Prisma.ReceiptGetPayload<{
  include: { ReceiptItem: { include: { Product: true } } };
}>;
type ReceiptItem = Prisma.ReceiptItemGetPayload<{}>;

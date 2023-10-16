"use client";

import { useEffect, useState } from "react";
import { Prisma } from "@prisma/client";

import slug from "@/lib/slug";

export default function Products() {
  const product = useProduct();

  return (
    <main>
      <ListOfProduct {...product} />
      <CreateProduct {...product} />
    </main>
  );
}

function ListOfProduct({ hooks, slugs }: ReturnType<typeof useProduct>) {
  return (
    <div className="min-h-screen">
      <table>
        <colgroup>
          <col className="w-9/12" />
          <col className="w-3/12" />
        </colgroup>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Harga</th>
          </tr>
        </thead>
        <tbody className="[&_td:nth-child(2)]:text-right">
          {hooks.products ? (
            hooks.products.length >= 1 ? (
              hooks.products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>
                    <div className="grid grid-cols-1">
                      <input
                        type="number"
                        id={product.id}
                        defaultValue={product.price}
                        onInput={(ev) => {
                          slugs.updateProductPrice(
                            product.id,
                            ev.currentTarget.value as unknown as number,
                          );
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center text-pink-300" colSpan={2}>
                  Produk kosong
                </td>
              </tr>
            )
          ) : (
            <tr>
              <td className="text-center text-pink-300" colSpan={2}>
                Sedang memuat
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CreateProduct({ slugs }: ReturnType<typeof useProduct>) {
  return (
    <div className="sticky bottom-4">
      <form
        className="grid grid-cols-1 gap-1"
        onSubmit={(ev) => {
          const fd = new FormData(ev.currentTarget);
          ev.preventDefault();
          ev.currentTarget.reset();
          slugs
            .createProduct(
              fd.get("product-name") as Product["name"],
              fd.get("product-price") as unknown as Product["price"],
            )
            .then(slugs.refreshProduct);
        }}
      >
        <input type="text" name="product-name" placeholder="Nama" required />
        <input
          type="number"
          name="product-price"
          placeholder="Harga"
          required
        />
        <button type="submit">Tambah</button>
      </form>
    </div>
  );
}

function useProduct() {
  const [products, setProducts] = useState<Product[]>();

  const refreshProduct = () => {
    slug(`product.findMany()`).then((products) => {
      setProducts(products);
    });
  };
  const updateProductPrice = (id: Product["id"], price: Product["price"]) => {
    return slug(
      `product.update({ data: { price: ${price} }, where: { id: \`${id}\` } })`,
    );
  };
  const createProduct = (name: Product["name"], price: Product["price"]) => {
    return slug(
      `product.create({ data: { name: \`${name}\`, price: ${price} } })`,
    );
  };

  useEffect(refreshProduct, []);

  return {
    hooks: { products, setProducts },
    slugs: { refreshProduct, updateProductPrice, createProduct },
  };
}

type Product = Prisma.ProductGetPayload<{}>;

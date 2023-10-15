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

function ListOfProduct({ hooks }: ReturnType<typeof useProduct>) {
  return (
    <div>
      <table
        className="w-full table-fixed
        [&_td:nth-child(2)]:text-center"
      >
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
        <tbody>
          {hooks.products?.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateProduct({ slugs }: ReturnType<typeof useProduct>) {
  return (
    <div className="fixed inset-x-0 bottom-0 m-2">
      <form
        className="grid grid-cols-12 gap-2
        [&>*]:p-2"
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
        <input
          className="col-span-5 border border-neutral-500"
          type="text"
          name="product-name"
          placeholder="Nama"
          required
        />
        <input
          className="col-span-4 border border-neutral-500"
          type="number"
          name="product-price"
          placeholder="Harga"
          required
        />
        <button className="col-span-3" type="submit">
          Tambah
        </button>
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
  const createProduct = (name: Product["name"], price: Product["price"]) => {
    return slug(
      `product.create({ data: { name: "${name}", price: ${price} } })`,
    );
  };

  useEffect(refreshProduct, []);

  return {
    hooks: { products, setProducts },
    slugs: { refreshProduct, createProduct },
  };
}

type Product = Prisma.ProductGetPayload<{}>;

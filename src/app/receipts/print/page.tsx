"use client";

import { useEffect, useState } from "react";

import slug from "@/lib/slug";
import { Prisma } from "@prisma/client";

export default function PrintReceipt({
  searchParams: { id },
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [receipt, setReceipt] = useState<Receipt>();

  useEffect(() => {
    if (id) {
      slug(`receipt.findUnique({
        where: { id: "${id}" },
        include: { ReceiptItem: { include: { Product: true } } },
      })`).then((receipt) => {
        setReceipt(receipt);
      });
    }
  }, [id]);

  useEffect(() => {
    if (receipt) {
      window.print();
    }
  }, [receipt]);

  return (
    <main>
      <table>
        <colgroup>
          <col />
          <col />
          <col />
          <col />
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
          {receipt?.ReceiptItem.map((receiptItem) => (
            <tr key={receiptItem.id}>
              <td>{receiptItem.Product.name}</td>
              <td>{receiptItem.Product.price}</td>
              <td>{receiptItem.quantity}</td>
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
            <th colSpan={3}>Total akhir</th>
            <th>
              {receipt?.ReceiptItem.reduce(
                (a, b) => a + b.Product.price * b.quantity,
                0,
              ).toLocaleString()}
            </th>
          </tr>
        </tfoot>
      </table>
      <div>Muat ulang halaman untuk cetak</div>
    </main>
  );
}

type Receipt = Prisma.ReceiptGetPayload<{
  include: { ReceiptItem: { include: { Product: true } } };
}>;

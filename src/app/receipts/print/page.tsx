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
        where: { id: \`${id}\` },
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
        <tbody
          className="[&_td:nth-child(2)]:text-center
          [&_td:nth-child(3)]:text-center
          [&_td:nth-child(4)]:text-right"
        >
          {receipt?.ReceiptItem.map((receiptItem) => (
            <tr key={receiptItem.id}>
              <td>{receiptItem.Product.name}</td>
              <td>{receiptItem.Product.price.toLocaleString()}</td>
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
          <tr className="print:hidden">
            <td className="text-center text-pink-300" colSpan={4}>
              Muat ulang halaman untuk cetak
            </td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}

type Receipt = Prisma.ReceiptGetPayload<{
  include: { ReceiptItem: { include: { Product: true } } };
}>;

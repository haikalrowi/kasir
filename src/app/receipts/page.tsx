"use client";

import { useEffect, useState } from "react";

import slug from "@/lib/slug";
import { Prisma } from "@prisma/client";

export default function Receipts() {
  const receipt = useReceipt();

  return (
    <main>
      <ListOfReceipt {...receipt} />
    </main>
  );
}

function ListOfReceipt({ hooks }: ReturnType<typeof useReceipt>) {
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
            <th>ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {hooks.receipts?.map((receipt) => (
            <tr key={receipt.id}>
              <td>
                <a href={`/receipts/print?id=${receipt.id}`}>{receipt.id}</a>
              </td>
              <td>{receipt.finished ? "Sudah" : "Belum"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useReceipt() {
  const [receipts, setReceipts] = useState<Receipt[]>();

  const findReceipts = () => {
    return slug(`receipt.findMany()`);
  };

  useEffect(() => {
    findReceipts().then((receipts) => {
      setReceipts(receipts);
    });
  }, []);

  return { hooks: { receipts, setReceipts }, slugs: { findReceipts } };
}

type Receipt = Prisma.ReceiptGetPayload<{}>;

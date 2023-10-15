import prisma from "@/lib/prisma";

async function SLUG() {
  const { product, receipt, receiptItem } = prisma;

  const slug = await receipt.findUnique({
    where: { id: "${id}" },
    include: { ReceiptItem: { include: { Product: true } } },
  });

  const slug2 = await receipt.findFirst({
    where: { finished: false },
    include: { ReceiptItem: { include: { Product: true } } },
  });
}

export async function POST(request: Request) {
  const SLUG_KEY = process.env.SLUG_KEY;
  const { product, receipt, receiptItem } = prisma;

  if (request.headers.get("Slug-Key") === SLUG_KEY) {
    try {
      return Response.json(await eval(await request.text()));
    } catch {
      return Response.json(null);
    }
  }

  return Response.json(null);
}

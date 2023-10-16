import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { product, receipt, receiptItem } = prisma;
  const SLUG_KEY = process.env.SLUG_KEY;
  const models = ["product", "receipt", "receiptItem"];
  const prismaQuery = await request.text();

  if (
    request.headers.get("Slug-Key") === SLUG_KEY &&
    models.some((model) => prismaQuery.startsWith(`${model}.`))
  ) {
    try {
      return Response.json(await eval(prismaQuery));
    } catch (error) {
      return Response.json({ error });
    }
  }

  return Response.json(null);
}

export default async function slug(BODY: string) {
  return fetch("/api/slug", {
    method: "POST",
    headers: { "Slug-Key": process.env.NEXT_PUBLIC_SLUG_KEY! },
    body: BODY,
  }).then((res) => res.json());
}

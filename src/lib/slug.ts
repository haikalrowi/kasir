export default async function slug(BODY: string) {
  return fetch("/api/slug", {
    method: "POST",
    headers: { "Slug-Key": process.env.slugKey! },
    body: BODY,
  }).then((res) => res.json());
}

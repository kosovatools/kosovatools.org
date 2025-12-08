import { legacyRedirects } from "./redirects";

export default async function Head({ params }: PageProps<"/[legacy]">) {
  const destination = legacyRedirects[(await params).legacy];

  if (!destination) {
    return null;
  }

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      <link rel="canonical" href={destination} />
      <meta name="robots" content="noindex,follow" />
      <title>Duke ridrejtuar…</title>
    </>
  );
}

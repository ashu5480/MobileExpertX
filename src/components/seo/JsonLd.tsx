/**
 * Renders a JSON-LD structured-data block.
 *
 * `JSON.stringify` output is injected into a `<script type="application/ld+json">`
 * tag. The payload is generated entirely on the server from our own typed data
 * (never from raw user input), and any `<` is escaped so the script can never be
 * broken out of.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- required by the JSON-LD spec
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

/**
 * Injecte un (ou plusieurs) blocs JSON-LD dans le `<head>` côté serveur.
 *
 * Server Component — peut être placé n'importe où dans l'arbre de pages
 * et n'envoie aucun JavaScript au client.
 */

interface Props {
  data: object | object[];
  id?: string;
}

export default function JsonLd({ data, id }: Props) {
  const json = Array.isArray(data)
    ? data.map((d) => JSON.stringify(d)).join(",")
    : JSON.stringify(data);

  const payload = Array.isArray(data) ? `[${json}]` : json;

  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}

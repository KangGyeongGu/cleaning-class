interface JsonLdScriptProps {
  data: unknown;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  const html = JSON.stringify(data).replace(/</g, "\\u003c");
  // nosemgrep: dangerous-innerhtml-user-data
  return (
    <script
      type="application/ld+json"
      // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

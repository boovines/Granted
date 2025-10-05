import * as React from 'react';

type Props = { url: string };

export default function PdfView({ url }: Props) {
  const src = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  return (
    <div className="w-full h-full bg-white">
      <iframe title="PDF" src={src} className="w-full h-full" style={{ border: 0 }} />
    </div>
  );
}

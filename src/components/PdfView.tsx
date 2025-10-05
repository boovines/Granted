import * as React from 'react';

export default function PdfView({ url }: { url: string }) {
  // the fragment tweaks the built in toolbar in most browsers and readers
  const src = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  return (
    <div className="w-full h-full bg-white">
      <iframe
        title="PDF"
        src={src}
        className="w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  );
}

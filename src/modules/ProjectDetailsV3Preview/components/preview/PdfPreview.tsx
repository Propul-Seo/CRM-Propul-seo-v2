interface Props {
  signedUrl: string
  fileName: string
}

export function PdfPreview({ signedUrl, fileName }: Props) {
  return (
    <iframe
      src={signedUrl}
      title={fileName}
      className="w-full h-full border-0 bg-[#0a0814]"
    />
  )
}

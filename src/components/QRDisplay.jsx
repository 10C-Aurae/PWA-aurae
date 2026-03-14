import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplay({ qrCode }) {
  if (!qrCode) return <p className="text-xs text-gray-500">Sin código QR</p>
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG value={qrCode} size={180} />
      </div>
    </div>
  )
}

import { AlertTriangle } from 'lucide-react'

/** The `<AlertTriangle> message` row a form field shows under itself when invalid. */
export default function FieldErrorText({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
      <AlertTriangle size={10} aria-hidden="true" />
      {message}
    </p>
  )
}

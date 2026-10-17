import { useEffect, useRef, useState } from 'react'

/*
 * The "Project Description / Key Requirements" field's Type / Upload File mode
 * (MAIN's use-description-upload): the chosen document's text is extracted and
 * appended after whatever was typed, so switching back to Type shows both, and
 * removing the file takes exactly that appended text back out.
 *
 * No backend here, so extraction is simulated: a .txt file is read as-is; any
 * other document yields a deterministic scope summary after a short delay.
 */

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const simulatedExtraction = (file) => {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'the uploaded document'
  return [
    `Scope and key requirements extracted from "${file.name}".`,
    '',
    `1. Objective — deliver the works and services described in ${base} in line with Oman LNG standards and applicable Omani regulations.`,
    '2. Scope — mobilisation, execution, testing, commissioning and handover of all deliverables listed in the source document.',
    '3. Quality & HSE — ISO 9001-aligned quality management, zero LTI target and full compliance with Company HSE requirements.',
    '4. Schedule — milestones and completion dates as defined in the source document; progress reported monthly.',
    '5. Local content — LC / ICV commitments to be met throughout the contract term.',
  ].join('\n')
}

const readText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = e => resolve(String(e.target.result || ''))
  reader.onerror = () => reject(new Error('Could not read the file.'))
  reader.readAsText(file)
})

const uploadedTextSuffix = (typed, uploaded) => {
  if (!typed.trim()) return uploaded
  const trailing = /\n*$/.exec(typed)?.[0].length ?? 0
  return `${'\n'.repeat(Math.max(0, 2 - trailing))}${uploaded}`
}

export function useDescriptionUpload({ getForm, setField }) {
  const [uploadedFileSize, setUploadedFileSize] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)
  const requestId = useRef(0)
  const uploadedText = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const discardUploadedText = () => {
    const appended = uploadedText.current
    if (appended === null) return
    uploadedText.current = null
    const description = getForm().description || ''
    if (!description.endsWith(appended)) return
    setField('description', description.slice(0, -appended.length))
  }

  const setDescMode = (mode) => {
    if (mode === 'type') uploadedText.current = null
    setField('descMode', mode)
  }

  const onFileChosen = async (file) => {
    if (!file) return
    const id = ++requestId.current
    discardUploadedText()
    setField('uploadedFileName', file.name)
    setUploadedFileSize(formatFileSize(file.size))
    setExtractError(null)
    setIsExtracting(true)
    try {
      const text = file.type === 'text/plain' || /\.txt$/i.test(file.name)
        ? await readText(file)
        : await new Promise(resolve => { timerRef.current = setTimeout(() => resolve(simulatedExtraction(file)), 900) })
      if (id !== requestId.current) return
      if (text.trim()) {
        const uploaded = text.replace(/\r\n?/g, '\n')
        const typed = getForm().description || ''
        const suffix = uploadedTextSuffix(typed, uploaded)
        uploadedText.current = suffix
        setField('description', `${typed}${suffix}`)
      } else {
        setExtractError('No readable text was found in this file.')
      }
    } catch {
      if (id === requestId.current) setExtractError('Could not extract text from this file. You can enter the description manually.')
    } finally {
      if (id === requestId.current) setIsExtracting(false)
    }
  }

  const onRemoveFile = () => {
    requestId.current += 1
    discardUploadedText()
    setField('uploadedFileName', '')
    setUploadedFileSize(null)
    setIsExtracting(false)
    setExtractError(null)
  }

  /** Clears local upload state; the form's own fields are reset by the caller. */
  const resetUpload = () => {
    requestId.current += 1
    uploadedText.current = null
    setUploadedFileSize(null)
    setIsDragOver(false)
    setIsExtracting(false)
    setExtractError(null)
  }

  const stop = (e) => { e.preventDefault(); e.stopPropagation() }
  const onDragOver = (e) => { stop(e); setIsDragOver(true) }
  const onDragLeave = (e) => { stop(e); setIsDragOver(false) }
  const onDrop = (e) => {
    stop(e)
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileChosen(file)
  }

  return { uploadedFileSize, isDragOver, isExtracting, extractError, setDescMode, onFileChosen, onRemoveFile, onDragOver, onDragLeave, onDrop, resetUpload }
}

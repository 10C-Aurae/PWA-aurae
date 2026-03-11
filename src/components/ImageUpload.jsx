import { useRef, useState } from 'react'
import { Upload, X, Link, ImageIcon, Loader2, AlertCircle } from 'lucide-react'

const CLOUD_NAME     = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET  = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL     = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB   = 10

async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_URL)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve(data.secure_url)
      } else {
        const err = JSON.parse(xhr.responseText)
        reject(new Error(err?.error?.message || 'Error al subir imagen'))
      }
    }

    xhr.onerror = () => reject(new Error('Error de red al subir imagen'))
    xhr.send(formData)
  })
}

/**
 * ImageUpload — campo de imagen con upload a Cloudinary.
 * Props:
 *   value      string | null  — URL actual
 *   onChange   (url) => void  — llamado con la URL de Cloudinary o vacío al limpiar
 *   error      string | null  — mensaje de error externo
 */
export default function ImageUpload({ value, onChange, error }) {
  const inputRef              = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [urlMode, setUrlMode] = useState(false)
  const [urlInput, setUrlInput] = useState(value || '')

  const handleFile = async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setUploadError('Cloudinary no está configurado (revisa las variables de entorno).')
      return
    }
    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Solo se aceptan JPG, PNG, WebP o GIF.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`La imagen no puede superar ${MAX_MB} MB.`)
      return
    }

    setUploadError(null)
    setUploading(true)
    setProgress(0)

    try {
      const url = await uploadToCloudinary(file, setProgress)
      onChange(url)
      setUrlInput(url)
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim()
    onChange(trimmed)
    setUrlMode(false)
  }

  const clear = () => {
    onChange('')
    setUrlInput('')
    setUploadError(null)
  }

  const anyError = uploadError || error

  return (
    <div className="flex flex-col gap-2">
      {/* Preview */}
      {value && !uploading && (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-aura-border shadow-card">
          <img
            src={value}
            alt="preview"
            className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-aura-border bg-white p-6 shadow-card">
          <Loader2 size={22} strokeWidth={1.5} className="text-aura-primary animate-spin" />
          <p className="text-sm text-aura-muted">Subiendo imagen… {progress}%</p>
          <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-aura-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Drop zone — solo cuando no hay imagen ni está subiendo */}
      {!value && !uploading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
            dragging
              ? 'border-aura-primary bg-aura-primary/5'
              : 'border-aura-border bg-white hover:border-aura-primary/50 hover:bg-aura-surface'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aura-surface border border-aura-border">
            <ImageIcon size={20} strokeWidth={1.5} className="text-aura-muted" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-aura-ink">
              Arrastra una imagen o <span className="text-aura-primary">selecciona un archivo</span>
            </p>
            <p className="mt-0.5 text-xs text-aura-muted">JPG, PNG, WebP · Máx. {MAX_MB} MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Botones de acción — solo cuando no está subiendo */}
      {!uploading && (
        <div className="flex gap-2">
          {!value && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-aura-border bg-white px-3 py-2 text-xs font-medium text-aura-muted hover:text-aura-primary hover:border-aura-primary transition-colors"
            >
              <Upload size={12} strokeWidth={2} />
              Subir archivo
            </button>
          )}
          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-aura-border bg-white px-3 py-2 text-xs font-medium text-aura-muted hover:text-aura-primary hover:border-aura-primary transition-colors"
          >
            <Link size={12} strokeWidth={2} />
            {urlMode ? 'Cancelar URL' : 'Pegar URL'}
          </button>
        </div>
      )}

      {/* URL manual */}
      {urlMode && !uploading && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 rounded-lg border border-aura-border bg-white px-3 py-2 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="rounded-lg bg-aura-primary px-3 py-2 text-xs font-semibold text-white hover:bg-aura-primary-dark disabled:opacity-40 transition-colors"
          >
            Usar
          </button>
        </div>
      )}

      {/* Error */}
      {anyError && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle size={13} strokeWidth={2} className="text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">{anyError}</p>
        </div>
      )}
    </div>
  )
}

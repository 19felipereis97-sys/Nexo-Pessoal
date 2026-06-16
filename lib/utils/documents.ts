export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'png', 'jpg', 'jpeg', 'webp'] as const
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number]
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const DOCUMENT_CATEGORIES = [
  'Pessoal', 'Trabalho', 'Projetos', 'Reuniões', 'Estudos',
  'Financeiro', 'Contábil', 'Contratos', 'Referências', 'Outros',
] as const

export const FILE_TYPE_CONFIG: Record<string, { color: string; label: string; isImage: boolean; isPdf: boolean }> = {
  pdf:  { color: '#ef4444', label: 'PDF',  isImage: false, isPdf: true  },
  doc:  { color: '#3b82f6', label: 'DOC',  isImage: false, isPdf: false },
  docx: { color: '#3b82f6', label: 'DOCX', isImage: false, isPdf: false },
  xls:  { color: '#22c55e', label: 'XLS',  isImage: false, isPdf: false },
  xlsx: { color: '#22c55e', label: 'XLSX', isImage: false, isPdf: false },
  csv:  { color: '#10b981', label: 'CSV',  isImage: false, isPdf: false },
  txt:  { color: '#737373', label: 'TXT',  isImage: false, isPdf: false },
  png:  { color: '#a855f7', label: 'PNG',  isImage: true,  isPdf: false },
  jpg:  { color: '#a855f7', label: 'JPG',  isImage: true,  isPdf: false },
  jpeg: { color: '#a855f7', label: 'JPEG', isImage: true,  isPdf: false },
  webp: { color: '#a855f7', label: 'WEBP', isImage: true,  isPdf: false },
}

export function getFileExt(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateFile(file: File): string | null {
  const ext = getFileExt(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return `Extensão .${ext} não permitida. Use: ${ALLOWED_EXTENSIONS.join(', ')}.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Arquivo muito grande. Máximo 50 MB. Tamanho atual: ${formatFileSize(file.size)}.`
  }
  return null
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildStoragePath(userId: string, docId: string, fileName: string): string {
  return `${userId}/${docId}/${sanitizeFileName(fileName)}`
}

export function fileNameToTitle(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, '')
  return withoutExt.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim()
}

import { getDocumentsData } from '@/lib/data/documents'
import { DocumentsClient } from '@/components/documents/documents-client'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const data = await getDocumentsData()
  return <DocumentsClient data={data} />
}

'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { IntegrationSetting } from '@/lib/supabase/types'

interface Props {
  integrations: IntegrationSetting[]
}

interface IntegrationDef {
  provider: string
  name: string
  description: string
  icon: string
  color: string
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronize eventos e reuniões com sua agenda do Google.',
    icon: '📅',
    color: '#4285f4',
  },
  {
    provider: 'gmail',
    name: 'Gmail',
    description: 'Transforme e-mails em tarefas e reuniões automaticamente.',
    icon: '✉️',
    color: '#ea4335',
  },
  {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Vincule arquivos do Drive aos seus projetos e reuniões.',
    icon: '💾',
    color: '#34a853',
  },
  {
    provider: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Sincronize calendário e e-mails do Outlook.',
    icon: '📧',
    color: '#0078d4',
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Importe páginas e databases do Notion como notas e tarefas.',
    icon: '📓',
    color: '#ffffff',
  },
  {
    provider: 'whatsapp',
    name: 'WhatsApp',
    description: 'Receba notificações e crie itens via WhatsApp Business.',
    icon: '💬',
    color: '#25d366',
  },
  {
    provider: 'openai',
    name: 'OpenAI / GPT',
    description: 'Use sua própria chave de API para funcionalidades de IA avançadas.',
    icon: '🤖',
    color: '#10a37f',
  },
]

export function IntegrationsSection({ integrations }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const integrationMap = new Map(integrations.map((i) => [i.provider, i]))
  const selected = selectedProvider ? INTEGRATIONS.find((i) => i.provider === selectedProvider) : null

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 divide-y divide-[#1a1a1a] pt-2">
          {INTEGRATIONS.map((integration) => {
            const existing = integrationMap.get(integration.provider)
            const isConnected = existing?.status === 'connected'

            return (
              <div key={integration.provider} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#262626] text-lg"
                    style={{ backgroundColor: `${integration.color}15` }}
                  >
                    {integration.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f5f5f5]">{integration.name}</p>
                    <p className="truncate text-xs text-[#737373]">{integration.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 px-2 py-0.5 text-xs text-[#22c55e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> Conectado
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedProvider(integration.provider)}
                    >
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-4">
        <p className="text-xs text-[#525252]">
          As integrações estão planejadas para versões futuras do Nexo Pessoal. Ao conectar, seus dados permanecerão seguros e você poderá desconectar a qualquer momento.
        </p>
      </div>

      {/* "Em breve" modal */}
      <Modal
        open={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        title={selected ? `Conectar ${selected.name}` : 'Integração'}
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0a0a0a] p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#262626] text-2xl"
                style={{ backgroundColor: `${selected.color}15` }}
              >
                {selected.icon}
              </div>
              <div>
                <p className="font-medium text-[#f5f5f5]">{selected.name}</p>
                <p className="text-xs text-[#737373]">{selected.description}</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/5 p-4">
              <p className="text-sm font-medium text-[#c9a227]">Em desenvolvimento</p>
              <p className="mt-1 text-xs text-[#a3a3a3]">
                Esta integração está prevista para um módulo futuro do Nexo Pessoal. Você será notificado quando estiver disponível.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedProvider(null)}>Fechar</Button>
              <Button variant="secondary" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Saber mais
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export const NOTE_TYPES = ['nota_rapida', 'ideia', 'decisao', 'procedimento', 'registro_reuniao', 'referencia', 'aprendizado'] as const
export const NOTE_TYPE_LABEL: Record<string, string> = {
  nota_rapida: 'Nota rápida',
  ideia: 'Ideia',
  decisao: 'Decisão',
  procedimento: 'Procedimento',
  registro_reuniao: 'Registro de reunião',
  referencia: 'Referência',
  aprendizado: 'Aprendizado',
}
export const NOTE_TYPE_VARIANT: Record<string, 'muted' | 'accent' | 'warning' | 'success'> = {
  nota_rapida: 'muted',
  ideia: 'accent',
  decisao: 'accent',
  procedimento: 'warning',
  registro_reuniao: 'muted',
  referencia: 'muted',
  aprendizado: 'success',
}

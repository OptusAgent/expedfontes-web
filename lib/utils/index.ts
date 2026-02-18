import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uuid() {
  return uuidv4()
}

export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { locale: ptBR, addSuffix: true })
  } catch {
    return dateStr
  }
}

export function calcularDiasPendente(dataAbertura: string): number {
  try {
    return differenceInDays(new Date(), new Date(dataAbertura))
  } catch {
    return 0
  }
}

export function formatMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatNumero(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n)
}

export function nivelUrgenciaLabel(nivel: string): string {
  const labels: Record<string, string> = {
    normal: 'Normal',
    atencao: 'Atenção',
    urgente: 'Urgente',
    critico: 'Crítico',
  }
  return labels[nivel] ?? nivel
}

export function nivelUrgenciaCor(nivel: string): string {
  const cores: Record<string, string> = {
    normal: 'bg-blue-100 text-blue-800',
    atencao: 'bg-yellow-100 text-yellow-800',
    urgente: 'bg-orange-100 text-orange-800',
    critico: 'bg-red-100 text-red-800',
  }
  return cores[nivel] ?? cores.normal
}

export function statusNFLabel(status: string): string {
  const labels: Record<string, string> = {
    aguardando_etiqueta: 'Aguardando Etiqueta',
    etiqueta_liberada: 'Etiqueta Liberada',
    cancelada: 'Cancelada',
    expedida: 'Expedida',
    em_derrubada: 'Em Derrubada',
  }
  return labels[status] ?? status
}

export function statusNFCor(status: string): string {
  const cores: Record<string, string> = {
    aguardando_etiqueta: 'bg-yellow-100 text-yellow-800',
    etiqueta_liberada: 'bg-green-100 text-green-800',
    cancelada: 'bg-gray-100 text-gray-600',
    expedida: 'bg-blue-100 text-blue-800',
    em_derrubada: 'bg-purple-100 text-purple-800',
  }
  return cores[status] ?? 'bg-gray-100 text-gray-600'
}

export function statusDerrubadasLabel(status: string): string {
  const labels: Record<string, string> = {
    preparando: 'Preparando',
    aguardando_impressao: 'Aguardando Impressão',
    expedida: 'Expedida',
    cancelada: 'Cancelada',
  }
  return labels[status] ?? status
}

export function statusDerrubadasCor(status: string): string {
  const cores: Record<string, string> = {
    preparando: 'bg-blue-100 text-blue-800',
    aguardando_impressao: 'bg-yellow-100 text-yellow-800',
    expedida: 'bg-green-100 text-green-800',
    cancelada: 'bg-gray-100 text-gray-600',
  }
  return cores[status] ?? 'bg-gray-100 text-gray-600'
}

export function statusServicosLabel(status: string): string {
  const labels: Record<string, string> = {
    aguardando_aprovacao: 'Aguard. Aprovação',
    aprovado: 'Aprovado',
    em_andamento: 'Em Andamento',
    finalizado: 'Finalizado',
    recusado: 'Recusado',
  }
  return labels[status] ?? status
}

export function statusServicosCor(status: string): string {
  const cores: Record<string, string> = {
    aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
    aprovado: 'bg-blue-100 text-blue-800',
    em_andamento: 'bg-purple-100 text-purple-800',
    finalizado: 'bg-green-100 text-green-800',
    recusado: 'bg-red-100 text-red-800',
  }
  return cores[status] ?? 'bg-gray-100 text-gray-600'
}

export function tipoServicoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    etiquetagem: 'Etiquetagem',
    montagem_kit: 'Montagem de Kit',
    rebatimento_palete: 'Rebatimento de Palete',
    outros: 'Outros',
  }
  return labels[tipo] ?? tipo
}

export function tipoServicoIcon(tipo: string): string {
  const icons: Record<string, string> = {
    etiquetagem: '🏷️',
    montagem_kit: '📦',
    rebatimento_palete: '🔄',
    outros: '⚙️',
  }
  return icons[tipo] ?? '⚙️'
}

export function nivelAcessoLabel(nivel: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    operador: 'Operador',
    atendimento: 'Atendimento',
  }
  return labels[nivel] ?? nivel
}

export function nivelAcessoCor(nivel: string): string {
  const cores: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    gestor: 'bg-purple-100 text-purple-800',
    operador: 'bg-blue-100 text-blue-800',
    atendimento: 'bg-green-100 text-green-800',
  }
  return cores[nivel] ?? 'bg-gray-100 text-gray-600'
}

// Converte arquivo para base64 para envio à IA
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // remove "data:image/jpeg;base64,"
    }
    reader.onerror = reject
  })
}

// Gera código sequencial
export function gerarCodigo(prefixo: string, existentes: string[]): string {
  const nums = existentes
    .map(c => {
      const match = c.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(n => !isNaN(n))
  const proximo = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `${prefixo}-${String(proximo).padStart(3, '0')}`
}

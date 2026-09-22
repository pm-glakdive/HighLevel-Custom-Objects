export type Channel = 'WhatsApp' | 'SMS' | 'Email'

export interface Contact {
  id: string
  name: string
  initials: string
  email: string
  phone: string
  company: string
  role: string
  color: string
}

export interface Message {
  id: string
  text: string
  time: string
  direction: 'inbound' | 'outbound'
}

export interface Conversation {
  id: string
  contactId: string
  channel: Channel
  unread: boolean
  updatedAt: string
  messages: Message[]
}

export interface ServiceCase {
  id: string
  contactId: string
  subject: string
  status: 'Open' | 'In progress' | 'Resolved'
  priority: 'Low' | 'Medium' | 'High'
  assetId: string | null
  agreementId: string | null
  description: string
  createdAt: string
  ownerId: string
  source: Channel
  appliedResolutionTargetHours: number | null
  targetResolutionAt: string | null
}

export interface CustomerAsset {
  id: string
  name: string
  company: string
  location: string
  type: string
  status: 'Active' | 'Inactive'
}

export interface ServiceAgreement {
  id: string
  name: string
  status: 'Active' | 'Expired'
  coveredAssetIds: string[]
  resolutionTargetHours: number
  coverage: string
  renewalDate: string
}

export interface ServiceUser {
  id: string
  name: string
  role: string
}

export interface CaseDraft {
  contactId: string
  source: Channel
  sourceConversationId: string
  sourceMessageId: string
  subject: string
  description: string
  assetId: string
  agreementId: string
  ownerId: string
  priority: '' | ServiceCase['priority']
}

export const assets: CustomerAsset[] = [
  {
    id: 'AC-001',
    name: 'Lobby AC',
    company: 'Northstar Offices',
    location: 'Main lobby',
    type: 'Air conditioner',
    status: 'Active',
  },
  {
    id: 'AC-002',
    name: 'Conference-room AC',
    company: 'Northstar Offices',
    location: 'Conference room',
    type: 'Air conditioner',
    status: 'Active',
  },
]

export const agreements: ServiceAgreement[] = [
  {
    id: 'AMC-104',
    name: 'Northstar Annual Maintenance',
    status: 'Active',
    coveredAssetIds: ['AC-002'],
    resolutionTargetHours: 24,
    coverage: 'On-site AC service and repair',
    renewalDate: '31 Dec 2026',
  },
]

export const serviceUsers: ServiceUser[] = [
  { id: 'user-priya', name: 'Priya Nair', role: 'Service Agent' },
  { id: 'user-arun', name: 'Arun Mehta', role: 'Service Manager' },
]

export const contacts: Contact[] = [
  {
    id: 'contact-ravi',
    name: 'Ravi Kumar',
    initials: 'RK',
    email: 'ravi.kumar@northstar.co',
    phone: '+91 98765 43210',
    company: 'Northstar Offices',
    role: 'Facilities Manager',
    color: 'blue',
  },
  {
    id: 'contact-anika',
    name: 'Anika Shah',
    initials: 'AS',
    email: 'anika@northstar.co',
    phone: '+91 98210 44511',
    company: 'Northstar Offices',
    role: 'Office Manager',
    color: 'violet',
  },
  {
    id: 'contact-daniel',
    name: 'Daniel Lee',
    initials: 'DL',
    email: 'daniel@harborworks.co',
    phone: '+91 98111 20478',
    company: 'Harborworks',
    role: 'Operations Lead',
    color: 'peach',
  },
]

export const conversations: Conversation[] = [
  {
    id: 'conversation-ravi',
    contactId: 'contact-ravi',
    channel: 'WhatsApp',
    unread: true,
    updatedAt: '9:42 AM',
    messages: [
      {
        id: 'message-ravi-1',
        text: 'Hi, this is Ravi from Northstar Offices.',
        time: '9:41 AM',
        direction: 'inbound',
      },
      {
        id: 'message-ravi-2',
        text: 'The conference-room AC is not cooling. Can someone help?',
        time: '9:42 AM',
        direction: 'inbound',
      },
    ],
  },
  {
    id: 'conversation-anika',
    contactId: 'contact-anika',
    channel: 'Email',
    unread: false,
    updatedAt: 'Yesterday',
    messages: [
      {
        id: 'message-anika-1',
        text: 'Thanks for confirming the maintenance visit next week.',
        time: 'Yesterday · 4:18 PM',
        direction: 'inbound',
      },
    ],
  },
  {
    id: 'conversation-daniel',
    contactId: 'contact-daniel',
    channel: 'SMS',
    unread: false,
    updatedAt: 'Mon',
    messages: [
      {
        id: 'message-daniel-1',
        text: 'The replacement part arrived. Thank you for the update.',
        time: 'Monday · 2:07 PM',
        direction: 'inbound',
      },
    ],
  },
]

export const serviceCases: ServiceCase[] = [
  {
    id: 'SC-103',
    contactId: 'contact-ravi',
    subject: 'Lobby AC leaking',
    status: 'Open',
    priority: 'Medium',
    assetId: 'AC-001',
    agreementId: null,
    description: 'Water is leaking from the AC unit in the main lobby. A technician needs to inspect the drain line.',
    createdAt: '2026-09-18T09:00:00+05:30',
    ownerId: 'user-priya',
    source: 'WhatsApp',
    appliedResolutionTargetHours: null,
    targetResolutionAt: null,
  },
]

export function createCaseDraft(conversation: Conversation): CaseDraft {
  const latestInboundMessage = [...conversation.messages].reverse().find((message) => message.direction === 'inbound')
  return {
    contactId: conversation.contactId,
    source: conversation.channel,
    sourceConversationId: conversation.id,
    sourceMessageId: latestInboundMessage?.id ?? '',
    subject: 'Conference-room AC not cooling',
    description: latestInboundMessage?.text ?? '',
    assetId: '',
    agreementId: '',
    ownerId: '',
    priority: '',
  }
}

export function applicableAgreements(assetId: string): ServiceAgreement[] {
  return agreements.filter((agreement) => agreement.status === 'Active' && agreement.coveredAssetIds.includes(assetId))
}

export function nextCaseId(cases: ServiceCase[]): string {
  const highestNumber = cases.reduce((highest, serviceCase) => Math.max(highest, Number(serviceCase.id.replace('SC-', '')) || 0), 103)
  return `SC-${highestNumber + 1}`
}

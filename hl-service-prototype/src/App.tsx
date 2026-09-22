import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight,
  CircleHelp, Clock3, Inbox, Mail, MessageCircle, MessageSquareText, Send,
  PanelRightClose, PanelRightOpen, Plus, Search, ShieldCheck, Smartphone,
  RotateCcw, Sparkles, X,
} from 'lucide-react'
import {
  agreements, applicableAgreements, assets, contacts, conversations, createCaseDraft,
  nextCaseId, serviceCases, serviceUsers,
  type CaseDraft, type Channel, type Contact, type CustomerAsset,
  type CaseActivity, type Message, type ServiceAgreement, type ServiceCase,
  type ServiceTask, type ServicesBooking, type StoredMessage,
} from './data'
import { clearDemoState, loadDemoState, saveDemoState } from './storage'
import { BookingView, CaseJourneyView, TechnicianTaskView } from './WorkflowViews'

type InboxTab = 'All' | 'Unread'

const initialDemoState = loadDemoState()

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

function nextRecordId(prefix: string, records: { id: string }[], start: number): string {
  const highest = records.reduce((value, record) => Math.max(value, Number(record.id.replace(`${prefix}-`, '')) || 0), start - 1)
  return `${prefix}-${highest + 1}`
}

function getAsset(id: string | null): CustomerAsset | null {
  return assets.find((item) => item.id === id) ?? null
}

function getAgreement(id: string | null): ServiceAgreement | null {
  return agreements.find((item) => item.id === id) ?? null
}

function getOwnerName(id: string): string {
  return serviceUsers.find((item) => item.id === id)?.name ?? 'Unassigned'
}

function getContact(id: string): Contact {
  const contact = contacts.find((item) => item.id === id)
  if (!contact) throw new Error(`Missing contact: ${id}`)
  return contact
}

function Avatar({ contact, size = 'normal' }: { contact: Contact; size?: 'normal' | 'large' }) {
  return <span className={`avatar avatar--${contact.color} avatar--${size}`}>{contact.initials}</span>
}

function ChannelIcon({ channel, size = 15 }: { channel: Channel; size?: number }) {
  if (channel === 'WhatsApp') return <MessageCircle size={size} strokeWidth={2.2} />
  if (channel === 'Email') return <Mail size={size} strokeWidth={2.1} />
  return <Smartphone size={size} strokeWidth={2.1} />
}

function Login({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="art-grid" />
        <div className="art-card art-card--one"><MessageSquareText size={28} /><span>New message</span></div>
        <div className="art-card art-card--two"><BriefcaseBusiness size={28} /><span>Service context</span></div>
        <div className="art-connector" />
      </div>
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand brand--login"><span className="brand-mark">H<span>↑</span></span><span>HighLevel</span></div>
        <div className="login-eyebrow"><span className="live-dot" /> SERVICE MANAGEMENT PROTOTYPE</div>
        <h1 id="login-title">Every request starts<br />with a conversation.</h1>
        <p>Step into the team inbox to see how an agent turns a customer message into the right service context.</p>
        <button className="primary-button login-button" onClick={onContinue}>
          <span className="login-avatar">PN</span>
          Continue as Priya · Service Agent
          <ArrowRight size={18} />
        </button>
        <div className="login-footnote"><ShieldCheck size={16} /> Demo workspace · Mock data</div>
      </section>
    </main>
  )
}

function CaseSummary({ serviceCase, onInspect, onViewInCases }: { serviceCase: ServiceCase; onInspect: () => void; onViewInCases: () => void }) {
  const asset = getAsset(serviceCase.assetId)
  return (
    <div className="case-summary">
      <button className="case-summary-inspect" onClick={onInspect} aria-label={`Inspect ${serviceCase.id}, ${serviceCase.subject}`}>
        <span className="case-summary-top"><strong>{serviceCase.id}</strong><span className="status-pill"><span />{serviceCase.status}</span></span>
        <span className="case-title">{serviceCase.subject}</span>
        <span className="case-subline">{asset?.location ?? 'Asset not selected'} <span>·</span> Opened {formatDate(serviceCase.createdAt)}</span>
      </button>
      <div className="case-summary-actions"><button onClick={onInspect}>Inspect Case <ChevronRight size={15} /></button><button onClick={onViewInCases}>View in Cases <ArrowRight size={14} /></button></div>
    </div>
  )
}

function ContactPanel({ contact, relatedCases, onInspectCase, onViewInCases, onCreateCase, onClose }: {
  contact: Contact
  relatedCases: ServiceCase[]
  onInspectCase: (id: string) => void
  onViewInCases: (id: string) => void
  onCreateCase: () => void
  onClose: () => void
}) {
  return (
    <aside className="detail-panel" aria-label="Contact details and related cases">
      <div className="panel-heading"><div><span className="panel-kicker">CONTACT CONTEXT</span><h2>Contact details</h2></div><button className="icon-button" onClick={onClose} aria-label="Close contact panel"><PanelRightClose size={19} /></button></div>
      <div className="panel-scroll">
        <section className="contact-card">
          <div className="contact-card-top"><Avatar contact={contact} size="large" /><div><h3>{contact.name}</h3><span>{contact.role}</span></div><BadgeCheck size={19} className="verified-icon" aria-label="Known contact" /></div>
          <div className="contact-property"><span>COMPANY</span><strong>{contact.company}</strong></div>
          <div className="contact-property"><span>PHONE</span><strong>{contact.phone}</strong></div>
          <div className="contact-property"><span>EMAIL</span><strong>{contact.email}</strong></div>
        </section>

        <section className="related-section">
          <div className="section-heading"><div><span className="panel-kicker">SERVICE CONTEXT</span><h3>Related Cases <span className="count-badge">{relatedCases.length}</span></h3></div></div>
          <p className="helper-copy">Cases for this contact are candidates. Check the issue before choosing one for this message.</p>
          {relatedCases.length > 0 ? relatedCases.map((item) => <CaseSummary key={item.id} serviceCase={item} onInspect={() => onInspectCase(item.id)} onViewInCases={() => onViewInCases(item.id)} />) : <p className="empty-cases">No existing Cases for this contact.</p>}
        </section>

        {contact.id === 'contact-ravi' && <section className="decision-card">
          <div className="decision-icon"><Sparkles size={17} /></div>
          <h3>Different issue?</h3>
          <p>If the message does not concern a related Case, start a new one from this conversation.</p>
          <button className="primary-button full-width" onClick={onCreateCase}><Plus size={17} /> Create new Case</button>
        </section>}
      </div>
    </aside>
  )
}

function CaseInspection({ serviceCase, onBack, onViewInCases }: { serviceCase: ServiceCase; onBack: () => void; onViewInCases: () => void }) {
  const asset = getAsset(serviceCase.assetId)
  return (
    <aside className="detail-panel" aria-label={`${serviceCase.id} Case details`}>
      <div className="panel-heading panel-heading--case"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to message</button></div>
      <div className="panel-scroll">
        <div className="inspection-header"><span className="panel-kicker">RELATED CASE · CANDIDATE</span><h2>{serviceCase.id}</h2><h3>{serviceCase.subject}</h3><span className="status-pill"><span />{serviceCase.status}</span></div>
        <div className="inspection-note"><CircleHelp size={19} /><span>This Case is related to Ravi’s contact. Decide whether the new message is about this same issue.</span></div>
        <div className="inspection-section"><span className="panel-kicker">ISSUE DETAILS</span><p>{serviceCase.description}</p></div>
        <dl className="case-facts"><div><dt>Location</dt><dd>{asset?.location ?? 'Not selected'}</dd></div><div><dt>Asset</dt><dd>{asset ? `${asset.id} · ${asset.name}` : 'Not selected'}</dd></div><div><dt>Priority</dt><dd>{serviceCase.priority}</dd></div><div><dt>Owner</dt><dd>{getOwnerName(serviceCase.ownerId)}</dd></div><div><dt>Opened</dt><dd>{formatDate(serviceCase.createdAt)}</dd></div></dl>
        <div className="inspection-footer"><p>{serviceCase.id === 'SC-103' ? <>Ravi’s new message mentions the <strong>conference-room AC</strong>. This Case is about the <strong>lobby AC</strong>.</> : 'Review this Case in the Service Cases module for its full record and activity.'}</p><button className="primary-button full-width" onClick={onViewInCases}><BriefcaseBusiness size={16} /> View in Cases</button><button className="secondary-button full-width" onClick={onBack}><ArrowLeft size={17} /> Return to conversation</button></div>
      </div>
    </aside>
  )
}

function CasesModuleSidebar({ cases, activeCaseId, onSelect, onBack }: { cases: ServiceCase[]; activeCaseId: string | null; onSelect: (id: string) => void; onBack: () => void }) {
  return <aside className="cases-module-sidebar" aria-label="Service Cases records">
    <div className="cases-module-heading"><span className="eyebrow">CUSTOM MODULE</span><h2>Service Cases</h2><p>Records</p></div>
    <div className="cases-module-list">{cases.map((item) => <button key={item.id} className={item.id === activeCaseId ? 'active' : ''} onClick={() => onSelect(item.id)} aria-current={item.id === activeCaseId ? 'page' : undefined}><strong>{item.id}</strong><span>{item.subject}</span><small>{item.status}</small></button>)}</div>
    <button className="cases-module-back" onClick={onBack}><ArrowLeft size={16} /> Back to Conversations</button>
  </aside>
}

function CasesModuleLanding({ caseCount }: { caseCount: number }) {
  return <main className="draft-view cases-module-landing" aria-labelledby="cases-landing-title">
    <div className="cases-landing-content">
      <span className="cases-landing-icon"><BriefcaseBusiness size={26} /></span>
      <span className="panel-kicker">SERVICE CASES · CUSTOM MODULE</span>
      <h1 id="cases-landing-title">Select a Service Case</h1>
      <p>{caseCount} records in the list. Choose one to review its fields, related records, work, and activity.</p>
    </div>
  </main>
}

function DraftView({ draft, contact, onChange, onBack, onCreate }: {
  draft: CaseDraft
  contact: Contact
  onChange: (draft: CaseDraft) => void
  onBack: () => void
  onCreate: () => void
}) {
  const [attempted, setAttempted] = useState(false)
  const matchingAgreements = applicableAgreements(draft.assetId)
  const asset = getAsset(draft.assetId)
  const selectedAgreement = getAgreement(draft.agreementId)
  const agreementValid = selectedAgreement !== null && matchingAgreements.some((item) => item.id === selectedAgreement.id)

  function submit() {
    setAttempted(true)
    if (draft.subject.trim() && draft.description.trim() && asset && agreementValid && draft.ownerId && draft.priority) onCreate()
  }

  return (
    <main className="draft-view" aria-labelledby="draft-title">
      <div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to conversation</button><span className="draft-status"><span /> Unsaved draft</span></div>
      <div className="draft-content">
        <div className="draft-breadcrumb">Conversations <ChevronRight size={14} /> {contact.name} <ChevronRight size={14} /> New Case</div>
        <div className="draft-hero"><div className="draft-hero-icon"><BriefcaseBusiness size={24} /></div><div><span className="panel-kicker">SERVICE CASE</span><h1 id="draft-title">New Case draft</h1><p>Review the request details before creating a Case.</p></div></div>
        <div className="draft-grid">
          <section className="draft-form-card"><div className="form-card-heading"><h2>Request details</h2><span>From this conversation</span></div>
            <div className="field"><label htmlFor="case-subject">Subject</label><input id="case-subject" value={draft.subject} onChange={(event) => onChange({ ...draft, subject: event.target.value })} />{attempted && !draft.subject.trim() && <span className="field-error">Enter a subject for this Case.</span>}</div>
            <div className="field"><label htmlFor="case-description">Description</label><textarea id="case-description" rows={6} value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} />{attempted && !draft.description.trim() && <span className="field-error">Describe the customer’s request.</span>}</div>
            <div className="form-divider" />
            <div className="form-card-heading"><h2>Service context</h2><span>Choose records for this issue</span></div>
            <div className="field"><label htmlFor="case-asset">Affected Asset</label><select id="case-asset" value={draft.assetId} onChange={(event) => onChange({ ...draft, assetId: event.target.value, agreementId: '' })}><option value="">Select an Asset</option>{assets.filter((item) => item.company === contact.company).map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select>{attempted && !asset && <span className="field-error">Select the Asset affected by this request.</span>}</div>
            <div className="field"><label htmlFor="case-agreement">Applicable Agreement</label><select id="case-agreement" value={draft.agreementId} onChange={(event) => onChange({ ...draft, agreementId: event.target.value })} disabled={!asset || matchingAgreements.length === 0}><option value="">Select an Agreement</option>{matchingAgreements.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select>{!asset ? <span className="field-hint">Choose an Asset to see the Agreements that cover it.</span> : matchingAgreements.length === 0 ? <span className="field-error">No active Agreement covers {asset.id}. Choose a covered Asset to continue.</span> : attempted && !agreementValid ? <span className="field-error">Select an Agreement that covers {asset.id}.</span> : <span className="field-hint">Only active Agreements covering {asset.id} are shown.</span>}</div>
            {selectedAgreement && agreementValid && <div className="target-preview"><Clock3 size={16} /><span><strong>{selectedAgreement.resolutionTargetHours}-hour resolution target</strong> from {selectedAgreement.id}. This target will be copied onto the new Case.</span></div>}
            <div className="field-pair"><div className="field"><label htmlFor="case-owner">Owner</label><select id="case-owner" value={draft.ownerId} onChange={(event) => onChange({ ...draft, ownerId: event.target.value })}><option value="">Select an owner</option>{serviceUsers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select>{attempted && !draft.ownerId && <span className="field-error">Select a Case owner.</span>}</div><div className="field"><label htmlFor="case-priority">Priority</label><select id="case-priority" value={draft.priority} onChange={(event) => onChange({ ...draft, priority: event.target.value as CaseDraft['priority'] })}><option value="">Select priority</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select>{attempted && !draft.priority && <span className="field-error">Select a priority.</span>}</div></div>
          </section>
          <div className="draft-side-stack"><section className="draft-form-card"><div className="form-card-heading"><h2>Context</h2></div><div className="draft-context-row"><span>Requester</span><strong><Avatar contact={contact} /> {contact.name}</strong></div><div className="draft-context-row"><span>Source</span><strong><ChannelIcon channel={draft.source} /> {draft.source}</strong></div><div className="draft-context-row"><span>Company</span><strong>{contact.company}</strong></div></section>
            <section className="source-card"><MessageSquareText size={18} /><div><strong>Created from {draft.source}</strong><p>The message text is copied into this Case draft. The conversation itself is not assigned to a Case.</p></div></section></div>
        </div>
        <div className="draft-actions"><span>Saving creates a Service Case linked to Ravi, the chosen Asset, and Agreement.</span><button className="primary-button" onClick={submit}><Plus size={17} /> Create Case</button></div>
      </div>
    </main>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(initialDemoState.loggedIn)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialDemoState.selectedConversationId)
  const [inboxTab, setInboxTab] = useState<InboxTab>('All')
  const [search, setSearch] = useState('')
  const [inspectedCaseId, setInspectedCaseId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [draft, setDraft] = useState<CaseDraft | null>(null)
  const [savedCases, setSavedCases] = useState<ServiceCase[]>(initialDemoState.savedCases)
  const [savedCaseId, setSavedCaseId] = useState<string | null>(initialDemoState.savedCaseId)
  const [casesModuleOpen, setCasesModuleOpen] = useState(Boolean(initialDemoState.savedCaseId))
  const [tasks, setTasks] = useState<ServiceTask[]>(initialDemoState.tasks)
  const [bookings, setBookings] = useState<ServicesBooking[]>(initialDemoState.bookings)
  const [activities, setActivities] = useState<CaseActivity[]>(initialDemoState.activities)
  const [outboundMessages, setOutboundMessages] = useState<StoredMessage[]>(initialDemoState.outboundMessages)
  const [updateCaseId, setUpdateCaseId] = useState<string | null>(initialDemoState.updateCaseId)
  const [messageDraft, setMessageDraft] = useState(initialDemoState.updateCaseId ? `Hi Ravi, the conference-room AC has been repaired and cooling has been verified. Case ${initialDemoState.updateCaseId} is resolved.` : '')
  const [messageError, setMessageError] = useState('')
  const [messageSentCaseId, setMessageSentCaseId] = useState<string | null>(null)
  const [bookingViewCaseId, setBookingViewCaseId] = useState<string | null>(null)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [technicianTaskId, setTechnicianTaskId] = useState<string | null>(null)

  useEffect(() => {
    saveDemoState({ loggedIn, selectedConversationId, savedCaseId, savedCases, tasks, bookings, activities, outboundMessages, updateCaseId })
  }, [loggedIn, selectedConversationId, savedCaseId, savedCases, tasks, bookings, activities, outboundMessages, updateCaseId])

  const allCases = [...serviceCases, ...savedCases]
  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null
  const selectedContact = selectedConversation ? getContact(selectedConversation.contactId) : null
  const inspectedCase = allCases.find((item) => item.id === inspectedCaseId) ?? null
  const activeCase = allCases.find((item) => item.id === savedCaseId) ?? null
  const bookingCase = savedCases.find((item) => item.id === bookingViewCaseId) ?? null
  const technicianTask = tasks.find((item) => item.id === technicianTaskId) ?? null
  const inCaseWorkspace = casesModuleOpen || Boolean(activeCase || bookingCase || technicianTask)
  const activePersona = technicianTask ? serviceUsers.find((item) => item.id === 'user-sanjay') : serviceUsers.find((item) => item.id === (inCaseWorkspace ? 'user-arun' : 'user-priya'))
  const personaInitials = technicianTask ? 'SR' : inCaseWorkspace ? 'AM' : 'PN'
  const selectedMessages: Message[] = selectedConversation ? [...selectedConversation.messages, ...outboundMessages.filter((item) => item.conversationId === selectedConversation.id)] : []
  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    if (inboxTab === 'Unread' && !conversation.unread) return false
    const contact = getContact(conversation.contactId)
    const query = search.trim().toLowerCase()
    return !query || contact.name.toLowerCase().includes(query) || [...conversation.messages, ...outboundMessages.filter((message) => message.conversationId === conversation.id)].some((message) => message.text.toLowerCase().includes(query))
  }), [inboxTab, search, outboundMessages])

  function addActivity(caseId: string, actorId: string, description: string) {
    setActivities((current) => [...current, { id: crypto.randomUUID(), caseId, actorId, description, createdAt: new Date().toISOString() }])
  }

  function updateSavedCase(caseId: string, changes: Partial<ServiceCase>) {
    setSavedCases((current) => current.map((item) => item.id === caseId ? { ...item, ...changes } : item))
  }

  function hasSentCustomerUpdate(serviceCase: ServiceCase): boolean {
    const conversation = conversations.find((item) => item.contactId === serviceCase.contactId && item.channel === 'WhatsApp')
    if (!serviceCase.resolvedAt || !conversation) return false
    return outboundMessages.some((message) =>
      message.conversationId === conversation.id && message.direction === 'outbound' && message.createdAt !== undefined &&
      Date.parse(message.createdAt) >= Date.parse(serviceCase.resolvedAt!) &&
      message.text.includes(serviceCase.id) && /repair/i.test(message.text),
    )
  }

  function selectConversation(id: string) {
    setCasesModuleOpen(false)
    setSelectedConversationId(id)
    setInspectedCaseId(null)
    setDraft(null)
    setSavedCaseId(null)
    setUpdateCaseId(null)
    setMessageSentCaseId(null)
    setBookingViewCaseId(null)
    setTechnicianTaskId(null)
    setPanelOpen(true)
  }

  function startDraft() {
    if (!selectedConversation) return
    setDraft(createCaseDraft(selectedConversation))
    setInspectedCaseId(null)
    setSavedCaseId(null)
  }

  function viewInCases(id: string) {
    if (!allCases.some((item) => item.id === id)) return
    setCasesModuleOpen(true)
    setSavedCaseId(id)
    setInspectedCaseId(null)
    setDraft(null)
    setUpdateCaseId(null)
    setBookingViewCaseId(null)
    setCreatedBookingId(null)
    setTechnicianTaskId(null)
  }

  function openServiceCases() {
    setCasesModuleOpen(true)
    setSavedCaseId(null)
    setDraft(null)
    setInspectedCaseId(null)
    setBookingViewCaseId(null)
    setCreatedBookingId(null)
    setTechnicianTaskId(null)
  }

  function returnToConversations() {
    setCasesModuleOpen(false)
    setSavedCaseId(null)
    setBookingViewCaseId(null)
    setCreatedBookingId(null)
    setTechnicianTaskId(null)
    setPanelOpen(true)
    if (!selectedConversationId) setSelectedConversationId('conversation-ravi')
  }

  function createCase() {
    if (!draft || !selectedContact) return
    const asset = getAsset(draft.assetId)
    const agreement = getAgreement(draft.agreementId)
    if (!draft.subject.trim() || !draft.description.trim() || !asset || asset.company !== selectedContact.company || !agreement || !applicableAgreements(asset.id).some((item) => item.id === agreement.id) || !serviceUsers.some((item) => item.id === draft.ownerId) || !draft.priority) return
    const createdAt = new Date().toISOString()
    const createdCase: ServiceCase = {
      id: nextCaseId(allCases),
      contactId: draft.contactId,
      subject: draft.subject.trim(),
      description: draft.description.trim(),
      assetId: asset.id,
      agreementId: agreement.id,
      ownerId: draft.ownerId,
      priority: draft.priority,
      status: 'Open',
      source: draft.source,
      createdAt,
      appliedResolutionTargetHours: agreement.resolutionTargetHours,
      targetResolutionAt: new Date(Date.parse(createdAt) + agreement.resolutionTargetHours * 60 * 60 * 1000).toISOString(),
    }
    setSavedCases([...savedCases, createdCase])
    setSavedCaseId(createdCase.id)
    setDraft(null)
  }

  function startWork(caseId: string) {
    if (savedCases.find((item) => item.id === caseId)?.status !== 'Open') return
    updateSavedCase(caseId, { status: 'In progress' })
    addActivity(caseId, 'user-priya', 'Started work on the Case.')
  }

  function createTask(caseId: string, subject: string, assigneeId: string, dueAt: string) {
    if (savedCases.find((item) => item.id === caseId)?.status !== 'In progress' || tasks.some((item) => item.caseId === caseId)) return
    const task: ServiceTask = { id: nextRecordId('TASK', tasks, 201), caseId, subject, assigneeId, dueAt, status: 'Open', createdAt: new Date().toISOString() }
    setTasks((current) => [...current, task])
    addActivity(caseId, 'user-priya', `Created ${task.id} for ${getOwnerName(assigneeId)}; due ${formatDateTime(dueAt)}.`)
  }

  function createBooking(scheduledAt: string, location: string) {
    if (!bookingCase || !bookingCase.assetId) return
    const booking: ServicesBooking = {
      id: nextRecordId('BOOK', bookings, 501),
      contactId: bookingCase.contactId,
      assetId: bookingCase.assetId,
      scheduledAt,
      location,
      status: 'Booked',
      createdAt: new Date().toISOString(),
    }
    setBookings((current) => [...current, booking])
    setCreatedBookingId(booking.id)
  }

  function recordBookingReference(caseId: string, bookingId: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    const booking = bookings.find((item) => item.id === bookingId)
    if (!serviceCase || !booking || serviceCase.status !== 'In progress' || booking.contactId !== serviceCase.contactId || booking.assetId !== serviceCase.assetId) return
    updateSavedCase(caseId, { bookingReferenceId: bookingId })
    addActivity(caseId, 'user-priya', `Manually recorded Services booking ID ${bookingId} on the Case.`)
  }

  function moveToWaiting(caseId: string, reason: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    if (!serviceCase || serviceCase.status !== 'In progress' || !serviceCase.bookingReferenceId || !reason) return
    updateSavedCase(caseId, { status: 'Waiting', waitingReason: reason })
    addActivity(caseId, 'user-priya', `Moved Case to Waiting: ${reason}.`)
  }

  function completeTask(taskId: string, note: string) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.status !== 'Open' || !note.trim()) return
    const completedAt = new Date().toISOString()
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, status: 'Completed', workNote: note.trim(), completedAt } : item))
    addActivity(task.caseId, task.assigneeId, `Completed ${task.id}. Work note: ${note.trim()}`)
    setTechnicianTaskId(null)
  }

  function resolveCase(caseId: string, code: string, summary: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    if (!serviceCase || serviceCase.status !== 'Waiting' || !tasks.some((item) => item.caseId === caseId && item.status === 'Completed') || !code || !summary.trim()) return
    const resolvedAt = new Date().toISOString()
    updateSavedCase(caseId, { status: 'Resolved', waitingReason: undefined, resolutionCode: code, resolutionSummary: summary.trim(), resolvedAt })
    addActivity(caseId, 'user-priya', `Resolved Case: ${code}. ${summary.trim()}`)
  }

  function openConversationForUpdate(caseId: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    const conversation = conversations.find((item) => item.contactId === serviceCase?.contactId)
    if (!serviceCase || serviceCase.status !== 'Resolved' || !conversation) return
    setCasesModuleOpen(false)
    setSelectedConversationId(conversation.id)
    setSavedCaseId(null)
    setUpdateCaseId(caseId)
    setMessageDraft(`Hi Ravi, the conference-room AC has been repaired and cooling has been verified. Case ${caseId} is resolved.`)
    setMessageError('')
    setMessageSentCaseId(null)
    setPanelOpen(true)
  }

  function sendCustomerUpdate() {
    const serviceCase = savedCases.find((item) => item.id === updateCaseId)
    if (!serviceCase || !selectedConversation || serviceCase.status !== 'Resolved') return
    const text = messageDraft.trim()
    if (!text.includes(serviceCase.id) || !/repair/i.test(text)) {
      setMessageError(`Mention ${serviceCase.id} and the repair in the customer update.`)
      return
    }
    const createdAt = new Date().toISOString()
    const message: StoredMessage = { id: crypto.randomUUID(), conversationId: selectedConversation.id, text, direction: 'outbound', createdAt, time: formatDateTime(createdAt) }
    setOutboundMessages((current) => [...current, message])
    setUpdateCaseId(null)
    setMessageDraft('')
    setMessageError('')
    setMessageSentCaseId(serviceCase.id)
  }

  function confirmCustomerUpdate(caseId: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    if (!serviceCase || serviceCase.status !== 'Resolved' || serviceCase.customerUpdateAt || !hasSentCustomerUpdate(serviceCase)) return
    updateSavedCase(caseId, {
      customerUpdateAt: new Date().toISOString(),
      customerUpdateText: 'Priya confirmed she sent Ravi a repair update in Conversations.',
    })
    addActivity(caseId, 'user-priya', 'Manually recorded that Ravi was sent a repair update in Conversations.')
  }

  function closeCase(caseId: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    if (!serviceCase || serviceCase.status !== 'Resolved' || !serviceCase.customerUpdateAt) return
    updateSavedCase(caseId, { status: 'Closed', closedAt: new Date().toISOString() })
    addActivity(caseId, 'user-priya', 'Closed Case after confirming the customer update.')
  }

  function resetDemo() {
    clearDemoState()
    setLoggedIn(false)
    setCasesModuleOpen(false)
    setSelectedConversationId(null)
    setSavedCaseId(null)
    setSavedCases([])
    setTasks([])
    setBookings([])
    setActivities([])
    setOutboundMessages([])
    setUpdateCaseId(null)
    setMessageDraft('')
    setMessageError('')
    setMessageSentCaseId(null)
    setBookingViewCaseId(null)
    setCreatedBookingId(null)
    setTechnicianTaskId(null)
    setDraft(null)
    setInspectedCaseId(null)
    setPanelOpen(true)
    setSearch('')
    setInboxTab('All')
  }

  if (!loggedIn) return <Login onContinue={() => setLoggedIn(true)} />

  return (
    <div className="app-shell">
      <aside className="app-rail" aria-label="Workspace navigation">
        <div className="rail-brand" aria-label="HighLevel"><span>H<span>↑</span></span></div>
        <div className="rail-divider" />
        <nav className="rail-nav" aria-label="Primary navigation">
          <button type="button" className={inCaseWorkspace ? 'rail-nav-button' : 'rail-nav-button active'} aria-label="Conversations" aria-current={!inCaseWorkspace ? 'page' : undefined} onClick={returnToConversations}><MessageSquareText size={21} /><span>Conversations</span></button>
          <button type="button" className={inCaseWorkspace ? 'rail-nav-button active' : 'rail-nav-button'} aria-label="Service Cases" aria-current={inCaseWorkspace ? 'page' : undefined} onClick={openServiceCases}><BriefcaseBusiness size={21} /><span>Service Cases</span></button>
        </nav>
        <div className="rail-spacer" />
        <div className="rail-avatar" title={activePersona ? activePersona.name + ' · ' + activePersona.role + ' (demo role)' : 'Demo role'}>{personaInitials}</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title"><span className="topbar-product">{bookingViewCaseId ? 'Services' : technicianTaskId ? 'Tasks' : inCaseWorkspace ? 'Service Cases' : 'Conversations'}</span><span className="topbar-divider" /><span className="topbar-location">{bookingViewCaseId ? 'On-site visit' : technicianTaskId ? 'Technician work' : activeCase ? 'Case record' : inCaseWorkspace ? 'Records' : 'Team inbox'}</span></div>
          {inCaseWorkspace && <nav className="module-switch" aria-label="Module navigation"><button onClick={returnToConversations}>Conversations</button><ChevronRight size={14} /><strong aria-current="page">Service Cases</strong></nav>}
          <div className="topbar-right"><span className="workspace-label"><span className="workspace-dot" /> Northstar Service</span><button className="reset-demo" onClick={resetDemo}><RotateCcw size={13} /> Reset demo</button><span className="persona-label">Viewing as <strong>{activePersona?.name ?? 'Team member'} · {activePersona?.role ?? 'Demo role'}</strong></span><span className="agent-badge" title={activePersona ? activePersona.name + ' · ' + activePersona.role + ' (demo role)' : 'Demo role'}>{personaInitials}</span></div>
        </header>
        <div className="workspace-body">
          {inCaseWorkspace ? <CasesModuleSidebar cases={allCases} activeCaseId={savedCaseId} onSelect={viewInCases} onBack={returnToConversations} /> : <aside className="inbox-panel" aria-label="Conversations inbox">
            <div className="inbox-heading"><div><span className="eyebrow">INBOX</span><h1>Team inbox</h1></div><span className="inbox-total">{conversations.length}</span></div>
            <div className="inbox-tabs" role="tablist" aria-label="Conversation filter"><button role="tab" aria-selected={inboxTab === 'All'} className={inboxTab === 'All' ? 'active' : ''} onClick={() => setInboxTab('All')}>All</button><button role="tab" aria-selected={inboxTab === 'Unread'} className={inboxTab === 'Unread' ? 'active' : ''} onClick={() => setInboxTab('Unread')}>Unread <span>{conversations.filter((item) => item.unread).length}</span></button></div>
            <label className="search-box"><Search size={17} /><input aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label>
            <div className="conversation-list">{filteredConversations.length ? filteredConversations.map((conversation) => {
              const contact = getContact(conversation.contactId)
              const sent = outboundMessages.filter((item) => item.conversationId === conversation.id)
              const latest = sent[sent.length - 1] ?? conversation.messages[conversation.messages.length - 1]
              return <button key={conversation.id} className={`conversation-item ${selectedConversationId === conversation.id ? 'selected' : ''}`} onClick={() => selectConversation(conversation.id)} aria-label={`Open ${contact.name} conversation`}>
                <Avatar contact={contact} /><span className="conversation-text"><span className="conversation-row"><strong>{contact.name}</strong><time>{conversation.updatedAt}</time></span><span className="conversation-company">{contact.company}</span><span className="conversation-preview"><span className={`channel-mini ${conversation.channel === 'WhatsApp' ? 'channel-mini--whatsapp' : ''}`}><ChannelIcon channel={conversation.channel} size={13} /></span>{latest.text}</span></span>{conversation.unread && <span className="unread-dot" aria-label="Unread" />}
              </button>
            }) : <div className="empty-list">No conversations found.</div>}</div>
            <div className="inbox-footer"><Inbox size={16} /> {filteredConversations.length} conversations</div>
          </aside>}

          {draft && selectedContact ? <DraftView draft={draft} contact={selectedContact} onChange={setDraft} onBack={() => setDraft(null)} onCreate={createCase} /> : bookingCase && getAsset(bookingCase.assetId) ? <BookingView contact={getContact(bookingCase.contactId)} asset={getAsset(bookingCase.assetId)!} createdBooking={bookings.find((item) => item.id === createdBookingId) ?? null} onSave={createBooking} onBack={() => { setBookingViewCaseId(null); setCreatedBookingId(null) }} /> : technicianTask ? <TechnicianTaskView task={technicianTask} onComplete={(note) => completeTask(technicianTask.id, note)} onBack={() => setTechnicianTaskId(null)} /> : activeCase ? <CaseJourneyView key={activeCase.id} serviceCase={activeCase} allCases={allCases} tasks={tasks} bookings={bookings} activities={activities} customerUpdateSent={hasSentCustomerUpdate(activeCase)} canManage={savedCases.some((item) => item.id === activeCase.id)} onBack={returnToConversations} onStartWork={() => startWork(activeCase.id)} onCreateTask={(subject, assigneeId, dueAt) => createTask(activeCase.id, subject, assigneeId, dueAt)} onOpenBooking={() => { setBookingViewCaseId(activeCase.id); setCreatedBookingId(null) }} onRecordBooking={(id) => recordBookingReference(activeCase.id, id)} onSetWaiting={(reason) => moveToWaiting(activeCase.id, reason)} onOpenTask={setTechnicianTaskId} onResolve={(code, summary) => resolveCase(activeCase.id, code, summary)} onOpenConversation={() => openConversationForUpdate(activeCase.id)} onConfirmCustomerUpdate={() => confirmCustomerUpdate(activeCase.id)} onCloseCase={() => closeCase(activeCase.id)} /> : inCaseWorkspace ? <CasesModuleLanding caseCount={allCases.length} /> : <>
            <main className="conversation-pane" aria-label="Conversation">
              {selectedConversation && selectedContact ? <>
                <div className="conversation-header"><div className="conversation-person"><Avatar contact={selectedContact} /><div><h2>{selectedContact.name}</h2><span><ChannelIcon channel={selectedConversation.channel} size={14} /> {selectedConversation.channel} conversation</span></div></div><button className="header-panel-button" onClick={() => setPanelOpen(!panelOpen)} aria-label={panelOpen ? 'Hide contact details' : 'Show contact details'}>{panelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}<span>{panelOpen ? 'Hide details' : 'Show details'}</span></button></div>
                <div className="message-area"><div className="date-divider"><span>Today · 22 Sep 2026</span></div><div className="thread-channel"><ChannelIcon channel={selectedConversation.channel} size={15} /> {selectedConversation.channel}</div>{selectedMessages.map((message, index) => <div key={message.id} className={`message-row ${message.direction === 'outbound' ? 'message-row--outbound' : ''}`}>{message.direction === 'inbound' && <Avatar contact={selectedContact} />}<div className="message-body"><div className="message-bubble">{message.text}</div><span className="message-time">{message.time}{selectedConversation.unread && message.direction === 'inbound' && index === selectedConversation.messages.length - 1 && <span className="new-label">NEW</span>}</span></div>{message.direction === 'outbound' && <span className="avatar avatar--blue message-agent-avatar">PN</span>}</div>)}</div>
                {updateCaseId ? <div className="conversation-composer"><div className="composer-heading"><strong>Manual WhatsApp update to Ravi</strong><span>Opened through Ravi’s Contact · no conversation-to-Case binding</span></div><label htmlFor="customer-update">Message</label><textarea id="customer-update" rows={3} value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} />{messageError && <span className="field-error" role="alert">{messageError}</span>}<div className="composer-actions"><span>Sending adds this message to Ravi’s conversation only. Confirm the update separately on {updateCaseId}.</span><button className="primary-button" onClick={sendCustomerUpdate}><Send size={15} /> Send WhatsApp update</button></div></div> : <div className="conversation-bottom"><div className="conversation-bottom-icon"><MessageSquareText size={19} /></div><div><strong>{messageSentCaseId ? 'Message sent to Ravi' : 'Turn this request into service work'}</strong><span>{messageSentCaseId ? `Open ${messageSentCaseId} in Related Cases and record customer-update confirmation.` : 'Review related Cases in the contact panel before choosing the next step.'}</span></div></div>}
              </> : <div className="select-empty"><div className="select-empty-icon"><MessageSquareText size={30} /></div><h2>Select a conversation</h2><p>Open Ravi’s new WhatsApp message to review the customer and related Cases.</p></div>}
            </main>
            {selectedConversation && selectedContact && panelOpen && (inspectedCase ? <CaseInspection serviceCase={inspectedCase} onBack={() => setInspectedCaseId(null)} onViewInCases={() => viewInCases(inspectedCase.id)} /> : <ContactPanel contact={selectedContact} relatedCases={allCases.filter((item) => item.contactId === selectedContact.id)} onInspectCase={setInspectedCaseId} onViewInCases={viewInCases} onCreateCase={startDraft} onClose={() => setPanelOpen(false)} />)}
          </>}
        </div>
      </div>
    </div>
  )
}

export default App

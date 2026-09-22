import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight,
  CircleHelp, ClipboardList, Clock3, Inbox, Mail, MessageCircle, MessageSquareText, Send,
  PanelRightClose, PanelRightOpen, Plus, Search, ShieldCheck, Smartphone,
  RotateCcw, Sparkles, Users, X,
} from 'lucide-react'
import {
  agreements, applicableAgreements, assets, contacts, conversations, createCaseDraft,
  nextCaseId, serviceCases, serviceUsers,
  type CaseDraft, type Channel, type Contact, type CustomerAsset,
  type CaseActivity, type Message, type ServiceAgreement, type ServiceCase,
  type ServiceTask, type ServicesBooking, type StoredMessage,
} from './data'
import { clearDemoState, loadDemoState, saveDemoState } from './storage'
import { CaseJourneyView, TechnicianTaskView } from './WorkflowViews'

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

function CaseSummary({ serviceCase, isActive, onInspect, onViewInCases, onSetActive }: { serviceCase: ServiceCase; isActive: boolean; onInspect: () => void; onViewInCases: () => void; onSetActive: () => void }) {
  const asset = getAsset(serviceCase.assetId)
  return (
    <div className="case-summary">
      <button className="case-summary-inspect" onClick={onInspect} aria-label={`Inspect ${serviceCase.id}, ${serviceCase.subject}`}>
        <span className="case-summary-top"><strong>{serviceCase.id}</strong><span className="status-pill"><span />{serviceCase.status}</span></span>
        <span className="case-title">{serviceCase.subject}</span>
        <span className="case-subline">{asset?.location ?? 'Asset not selected'} <span>·</span> Opened {formatDate(serviceCase.createdAt)}</span>
      </button>
      <div className="case-summary-actions"><button onClick={onInspect}>Inspect Case <ChevronRight size={15} /></button>{isActive ? <span className="active-case-badge">Active in thread</span> : <button onClick={onSetActive}>Set active</button>}<button onClick={onViewInCases}>View in Cases <ArrowRight size={14} /></button></div>
    </div>
  )
}

function ContactPanel({ contact, relatedCases, activeCaseId, onInspectCase, onViewInCases, onSetActiveCase, onCreateCase, onViewContact, onClose }: {
  contact: Contact
  relatedCases: ServiceCase[]
  activeCaseId: string | null
  onInspectCase: (id: string) => void
  onViewInCases: (id: string) => void
  onSetActiveCase: (id: string) => void
  onCreateCase: () => void
  onViewContact: () => void
  onClose: () => void
}) {
  return (
    <aside className="detail-panel" aria-label="Contact details and related cases">
      <div className="panel-heading"><div><span className="panel-kicker">CONTACT CONTEXT</span><h2>Contact details</h2></div><button className="icon-button" onClick={onClose} aria-label="Close contact panel"><PanelRightClose size={19} /></button></div>
      <div className="panel-scroll">
        <section className="contact-card">
          <div className="contact-card-top"><Avatar contact={contact} size="large" /><div><h3>{contact.name}</h3><span>{contact.role}</span></div><BadgeCheck size={19} className="verified-icon" aria-label="Known contact" /></div>
          <div className="contact-property"><span>CUSTOMER ACCOUNT</span><strong>{contact.company}</strong></div>
          <div className="contact-property"><span>PHONE</span><strong>{contact.phone}</strong></div>
          <div className="contact-property"><span>EMAIL</span><strong>{contact.email}</strong></div>
          <button type="button" className="contact-record-open" onClick={onViewContact}>View in Contacts <ArrowRight size={14} /></button>
        </section>

        <section className="related-section">
          <div className="section-heading"><div><span className="panel-kicker">SERVICE CONTEXT</span><h3>Related Cases <span className="count-badge">{relatedCases.length}</span></h3></div></div>
          <p className="helper-copy">Cases for this contact are candidates. Check the issue before choosing one for this message.</p>
          {relatedCases.length > 0 ? relatedCases.map((item) => <CaseSummary key={item.id} serviceCase={item} isActive={item.id === activeCaseId} onInspect={() => onInspectCase(item.id)} onViewInCases={() => onViewInCases(item.id)} onSetActive={() => onSetActiveCase(item.id)} />) : <p className="empty-cases">No existing Cases for this contact.</p>}
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

function ActiveCasePanel({ serviceCase, onViewInCases, onChooseCase }: { serviceCase: ServiceCase | null; onViewInCases: () => void; onChooseCase: () => void }) {
  const asset = serviceCase ? getAsset(serviceCase.assetId) : null
  const agreement = serviceCase ? getAgreement(serviceCase.agreementId) : null
  return (
    <section className={`active-case-panel ${serviceCase ? '' : 'active-case-panel--unbound'}`} aria-label="Proposed active Case context">
      <div className="active-case-panel-heading"><div><span className="panel-kicker">PROPOSED · CASE-AWARE CONVERSATION EXPERIENCE</span><h3>Active Case</h3></div>{serviceCase && <span className="active-case-status"><span />{serviceCase.status}</span>}</div>
      {serviceCase ? <>
        <div className="active-case-title"><strong>{serviceCase.id}</strong><span>{serviceCase.subject}</span></div>
        <div className="active-case-facts"><span><b>Asset</b>{asset ? `${asset.id} · ${asset.name}` : 'Not selected'}</span><span><b>Agreement</b>{agreement ? `${agreement.id} · applied` : 'None applied'}</span><span><b>Resolution due</b>{serviceCase.targetResolutionAt ? formatDateTime(serviceCase.targetResolutionAt) : 'No target applied'}</span></div>
        <div className="active-case-actions"><button onClick={onChooseCase}>Change active Case</button><button onClick={onViewInCases}>View in Cases <ArrowRight size={14} /></button></div>
      </> : <>
        <p>No active Case is selected for this thread.</p>
        <span className="active-case-helper">Related Cases remain candidates until Priya explicitly chooses the case this message concerns.</span>
        <button className="secondary-button" onClick={onChooseCase}>Choose a related Case</button>
      </>}
    </section>
  )
}

function CaseInspection({ serviceCase, isActive, onBack, onViewInCases }: { serviceCase: ServiceCase; isActive: boolean; onBack: () => void; onViewInCases: () => void }) {
  const [assetExpanded, setAssetExpanded] = useState(false)
  const [agreementExpanded, setAgreementExpanded] = useState(false)
  const asset = getAsset(serviceCase.assetId)
  const agreement = getAgreement(serviceCase.agreementId)
  return (
    <aside className="detail-panel" aria-label={`${serviceCase.id} Case details`}>
      <div className="panel-heading panel-heading--case"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to message</button></div>
      <div className="panel-scroll">
        <div className="inspection-header"><span className="panel-kicker">{isActive ? 'ACTIVE CASE · THIS CONVERSATION' : 'RELATED CASE · CANDIDATE'}</span><h2>{serviceCase.id}</h2><h3>{serviceCase.subject}</h3><span className="status-pill"><span />{serviceCase.status}</span></div>
        <div className="inspection-note"><CircleHelp size={19} /><span>{isActive ? 'This is the Case selected for Ravi’s current conversation.' : 'This Case is related to Ravi’s contact. Decide whether the new message is about this same issue.'}</span></div>
        <div className="inspection-section"><span className="panel-kicker">ISSUE DETAILS</span><p>{serviceCase.description}</p></div>
        <dl className="case-facts"><div><dt>Location</dt><dd>{asset?.location ?? 'Not selected'}</dd></div><div><dt>Asset</dt><dd>{asset ? <button type="button" className="inspection-record-toggle" onClick={() => setAssetExpanded((expanded) => !expanded)} aria-expanded={assetExpanded} aria-controls="inspection-asset-details">{asset.id} · {asset.name} <ChevronRight size={14} aria-hidden="true" /></button> : 'Not selected'}</dd></div><div><dt>Service Agreement</dt><dd>{agreement ? <button type="button" className="inspection-record-toggle" onClick={() => setAgreementExpanded((expanded) => !expanded)} aria-expanded={agreementExpanded} aria-controls="inspection-agreement-details">{agreement.id} · {agreement.name} <ChevronRight size={14} aria-hidden="true" /></button> : 'None linked'}</dd></div><div><dt>Priority</dt><dd>{serviceCase.priority}</dd></div><div><dt>Owner</dt><dd>{getOwnerName(serviceCase.ownerId)}</dd></div><div><dt>Opened</dt><dd>{formatDate(serviceCase.createdAt)}</dd></div></dl>
        {asset && assetExpanded && <section className="inspection-record-details" id="inspection-asset-details" aria-label={`${asset.id} asset details`}><span className="panel-kicker">ASSET DETAILS</span><h4>{asset.id} · {asset.name}</h4><dl><div><dt>Location</dt><dd>{asset.location}</dd></div><div><dt>Type</dt><dd>{asset.type}</dd></div><div><dt>Status</dt><dd>{asset.status}</dd></div><div><dt>Customer account</dt><dd>{asset.company}</dd></div></dl></section>}
        {agreement && agreementExpanded && <section className="inspection-agreement-details" id="inspection-agreement-details" aria-label={`${agreement.id} agreement details`}><span className="panel-kicker">AGREEMENT DETAILS</span><h4>{agreement.id} · {agreement.name}</h4><dl><div><dt>Status</dt><dd>{agreement.status}</dd></div><div><dt>Coverage</dt><dd>{agreement.coverage}</dd></div><div><dt>Covered asset</dt><dd>{asset && agreement.coveredAssetIds.includes(asset.id) ? `${asset.id} · ${asset.name}` : agreement.coveredAssetIds.join(', ')}</dd></div><div><dt>Resolution target</dt><dd>{agreement.resolutionTargetHours} hours</dd></div><div><dt>Renews</dt><dd>{agreement.renewalDate}</dd></div></dl></section>}
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

function TasksModuleSidebar({ tasks, activeTaskId, onSelect, onBack }: { tasks: ServiceTask[]; activeTaskId: string | null; onSelect: (id: string) => void; onBack: () => void }) {
  return <aside className="cases-module-sidebar" aria-label="Tasks records">
    <div className="cases-module-heading"><span className="eyebrow">NATIVE MODULE</span><h2>Tasks</h2><p>Work items</p></div>
    <div className="cases-module-list">{tasks.length ? tasks.map((task) => <button key={task.id} className={task.id === activeTaskId ? 'active' : ''} onClick={() => onSelect(task.id)} aria-current={task.id === activeTaskId ? 'page' : undefined}><strong>{task.id}</strong><span>{task.subject}</span><small>{task.status} · {task.caseId}</small></button>) : <p className="module-empty-state">No Tasks created yet.</p>}</div>
    <button className="cases-module-back" onClick={onBack}><ArrowLeft size={16} /> Back to Conversations</button>
  </aside>
}

function TasksModuleLanding({ taskCount }: { taskCount: number }) {
  return <main className="draft-view cases-module-landing" aria-labelledby="tasks-landing-title">
    <div className="cases-landing-content"><span className="cases-landing-icon"><ClipboardList size={26} /></span><span className="panel-kicker">TASKS · NATIVE MODULE</span><h1 id="tasks-landing-title">Select a Task</h1><p>{taskCount ? `${taskCount} work item${taskCount === 1 ? '' : 's'} in the list.` : 'Tasks created from Service Cases will appear here.'}</p></div>
  </main>
}

function ContactsModuleSidebar({ selectedId, onSelect, onBack }: { selectedId: string | null; onSelect: (id: string) => void; onBack: () => void }) {
  return <aside className="cases-module-sidebar" aria-label="Contacts records">
    <div className="cases-module-heading"><span className="eyebrow">NATIVE MODULE</span><h2>Contacts</h2><p>People</p></div>
    <div className="cases-module-list">{contacts.map((contact) => <button key={contact.id} className={selectedId === contact.id ? 'active' : ''} onClick={() => onSelect(contact.id)} aria-current={selectedId === contact.id ? 'page' : undefined}><strong>{contact.initials}</strong><span>{contact.name}</span><small>{contact.company}</small></button>)}</div>
    <button className="cases-module-back" onClick={onBack}><ArrowLeft size={16} /> Back to Conversations</button>
  </aside>
}

type ContactActivityEvent = {
  id: string
  text: string
  timestamp: string | null
  recordLabel?: string
  onOpenRecord?: () => void
}

function ContactActivity({ contact, cases, savedCases, tasks, activities, outboundMessages, onViewCase, onViewTask, onOpenConversation }: { contact: Contact; cases: ServiceCase[]; savedCases: ServiceCase[]; tasks: ServiceTask[]; activities: CaseActivity[]; outboundMessages: StoredMessage[]; onViewCase: (id: string) => void; onViewTask: (id: string) => void; onOpenConversation: () => void }) {
  const relevantCases = cases.filter((serviceCase) => serviceCase.contactId === contact.id)
  const caseById = new Map(relevantCases.map((serviceCase) => [serviceCase.id, serviceCase]))
  const events: ContactActivityEvent[] = []
  const inboundMessages = conversations.filter((conversation) => conversation.contactId === contact.id).flatMap((conversation) => conversation.messages.filter((message) => message.direction === 'inbound').map((message) => ({ conversation, message })))
  inboundMessages.forEach(({ message, conversation }) => {
    const linkedCase = relevantCases.find((serviceCase) => serviceCase.description === message.text)
    if (!linkedCase) return
    const inferredTime = linkedCase ? new Date(Date.parse(linkedCase.createdAt) - 1).toISOString() : null
    events.push({ id: `inbound-${conversation.id}-${message.id}`, text: `Inbound ${conversation.channel} request for ${linkedCase.id}`, timestamp: message.createdAt ?? inferredTime, recordLabel: 'Open conversation', onOpenRecord: onOpenConversation })
  })
  savedCases.filter((serviceCase) => serviceCase.contactId === contact.id).forEach((serviceCase) => {
    events.push({ id: `case-created-${serviceCase.id}`, text: `Created Case ${serviceCase.id}`, timestamp: serviceCase.createdAt, recordLabel: serviceCase.id, onOpenRecord: () => onViewCase(serviceCase.id) })
  })
  tasks.filter((task) => caseById.has(task.caseId)).forEach((task) => {
    events.push({ id: `task-created-${task.id}`, text: `Created and assigned Task ${task.id}`, timestamp: task.createdAt, recordLabel: task.id, onOpenRecord: () => onViewTask(task.id) })
    if (task.completedAt) events.push({ id: `task-completed-${task.id}`, text: `Completed Task ${task.id}`, timestamp: task.completedAt, recordLabel: task.id, onOpenRecord: () => onViewTask(task.id) })
  })
  relevantCases.forEach((serviceCase) => {
    if (serviceCase.resolvedAt) events.push({ id: `case-resolved-${serviceCase.id}`, text: `Resolved Case ${serviceCase.id}`, timestamp: serviceCase.resolvedAt, recordLabel: serviceCase.id, onOpenRecord: () => onViewCase(serviceCase.id) })
    if (serviceCase.customerUpdateAt) events.push({ id: `customer-update-${serviceCase.id}`, text: `Recorded customer update for ${serviceCase.id}`, timestamp: serviceCase.customerUpdateAt, recordLabel: serviceCase.id, onOpenRecord: () => onViewCase(serviceCase.id) })
    if (serviceCase.closedAt) events.push({ id: `case-closed-${serviceCase.id}`, text: `Closed Case ${serviceCase.id}`, timestamp: serviceCase.closedAt, recordLabel: serviceCase.id, onOpenRecord: () => onViewCase(serviceCase.id) })
  })
  outboundMessages.filter((message) => conversations.some((conversation) => conversation.id === message.conversationId && conversation.contactId === contact.id)).forEach((message) => {
    const linkedCase = relevantCases.find((serviceCase) => message.text.includes(serviceCase.id))
    if (!linkedCase) return
    const acknowledgement = /created Case/i.test(message.text)
    const customerUpdate = /repair/i.test(message.text)
    if (!acknowledgement && !customerUpdate) return
    events.push({ id: `message-${message.id}`, text: acknowledgement ? `Priya sent Case acknowledgement for ${linkedCase.id}` : `Priya sent customer update for ${linkedCase.id}`, timestamp: message.createdAt ?? null, recordLabel: linkedCase.id, onOpenRecord: () => onViewCase(linkedCase.id) })
  })
  activities.filter((activity) => caseById.has(activity.caseId) && /^Moved .* to Waiting/.test(activity.description)).forEach((activity) => {
    events.push({ id: `activity-${activity.id}`, text: `${activity.description} · ${activity.caseId}`, timestamp: activity.createdAt, recordLabel: activity.caseId, onOpenRecord: () => onViewCase(activity.caseId) })
  })
  const sortedEvents = events.sort((a, b) => (b.timestamp ? Date.parse(b.timestamp) : -Infinity) - (a.timestamp ? Date.parse(a.timestamp) : -Infinity))
  return <section className="contact-activity-card" aria-label="Contact Activity"><div className="contact-record-card-heading"><div><span className="panel-kicker">PROPOSED CROSS-RECORD SUMMARY</span><h2>Contact Activity</h2></div><span className="contact-activity-note">Demo events only</span></div><p>Context across Conversations, Cases and Tasks. This is a proposed summary, not an automatic HighLevel timeline.</p>{sortedEvents.length ? <ol className="contact-activity-list">{sortedEvents.map((event) => <li key={event.id}><div><strong>{event.text}</strong><small>{event.timestamp ? formatDateTime(event.timestamp) : 'Current conversation'}</small></div>{event.onOpenRecord && <button type="button" onClick={event.onOpenRecord}>{event.recordLabel} <ChevronRight size={14} /></button>}</li>)}</ol> : <p>No cross-record activity yet.</p>}</section>
}

function ContactRecordView({ contact, relatedCases, savedCases, tasks, activities, outboundMessages, onViewCase, onViewTask, onOpenConversation, onBack }: { contact: Contact; relatedCases: ServiceCase[]; savedCases: ServiceCase[]; tasks: ServiceTask[]; activities: CaseActivity[]; outboundMessages: StoredMessage[]; onViewCase: (id: string) => void; onViewTask: (id: string) => void; onOpenConversation: () => void; onBack: () => void }) {
  return <main className="draft-view contact-record-view" aria-labelledby="contact-record-title">
    <div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to Conversations</button><span className="saved-status"><span /> Contacts · Native module</span></div>
    <div className="case-record-content">
      <div className="draft-breadcrumb">Contacts <ChevronRight size={14} /> {contact.name}</div>
      <header className="case-record-masthead"><div className="case-record-masthead-title"><Avatar contact={contact} size="large" /><div><span className="panel-kicker">CONTACT RECORD</span><h1 id="contact-record-title">{contact.name}</h1><div className="case-masthead-meta"><span>{contact.role}</span><span>{contact.company}</span></div></div></div></header>
      <div className="contact-record-grid">
        <section className="contact-record-card" aria-label="Contact details"><span className="panel-kicker">CONTACT DETAILS</span><h2>Customer account</h2><dl><div><dt>Account</dt><dd>{contact.company}</dd></div><div><dt>Role</dt><dd>{contact.role}</dd></div><div><dt>Phone</dt><dd>{contact.phone}</dd></div><div><dt>Email</dt><dd>{contact.email}</dd></div></dl></section>
        <section className="contact-record-card" aria-label="Related Cases"><div className="contact-record-card-heading"><div><span className="panel-kicker">LINKED RECORDS</span><h2>Related Service Cases</h2></div><span className="count-badge">{relatedCases.length}</span></div><p>Cases associated with {contact.name}. Open one to view its Asset, Agreement, work, and status.</p>{relatedCases.length ? relatedCases.map((serviceCase) => <button type="button" className="contact-case-row" key={serviceCase.id} onClick={() => onViewCase(serviceCase.id)}><span><strong>{serviceCase.id} · {serviceCase.subject}</strong><small>{getAsset(serviceCase.assetId)?.name ?? 'No Asset'} · {serviceCase.status}</small></span><ChevronRight size={17} /></button>) : <p>No Service Cases linked to this Contact.</p>}</section>
        <ContactActivity contact={contact} cases={relatedCases} savedCases={savedCases} tasks={tasks} activities={activities} outboundMessages={outboundMessages} onViewCase={onViewCase} onViewTask={onViewTask} onOpenConversation={onOpenConversation} />
      </div>
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
          <div className="draft-side-stack"><section className="draft-form-card"><div className="form-card-heading"><h2>Context</h2></div><div className="draft-context-row"><span>Requester</span><strong><Avatar contact={contact} /> {contact.name}</strong></div><div className="draft-context-row"><span>Source</span><strong><ChannelIcon channel={draft.source} /> {draft.source}</strong></div><div className="draft-context-row"><span>Customer account</span><strong>{contact.company}</strong></div></section>
            <section className="source-card"><MessageSquareText size={18} /><div><strong>Created from {draft.source}</strong><p>The message text is copied into this Case draft. Creating it explicitly sets this new Case as the thread’s proposed active Case.</p></div></section></div>
        </div>
        <div className="draft-actions"><span>Saving creates a Service Case linked to Ravi, the chosen Asset, and Agreement.</span><button className="primary-button" onClick={submit}><Plus size={17} /> Create Case</button></div>
      </div>
    </main>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(initialDemoState.loggedIn)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialDemoState.selectedConversationId)
  const [selectedContactRecordId, setSelectedContactRecordId] = useState<string | null>(initialDemoState.selectedContactRecordId)
  const [inboxTab, setInboxTab] = useState<InboxTab>('All')
  const [search, setSearch] = useState('')
  const [inspectedCaseId, setInspectedCaseId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [draft, setDraft] = useState<CaseDraft | null>(null)
  const [savedCases, setSavedCases] = useState<ServiceCase[]>(initialDemoState.savedCases)
  const [activeCaseByConversation, setActiveCaseByConversation] = useState<Record<string, string>>(initialDemoState.activeCaseByConversation)
  const [savedCaseId, setSavedCaseId] = useState<string | null>(initialDemoState.savedCaseId)
  const [casesModuleOpen, setCasesModuleOpen] = useState(Boolean(initialDemoState.savedCaseId))
  const [tasksModuleOpen, setTasksModuleOpen] = useState(false)
  const [tasks, setTasks] = useState<ServiceTask[]>(initialDemoState.tasks)
  const creatingTaskCaseIds = useRef<Set<string>>(new Set())
  const [bookings, setBookings] = useState<ServicesBooking[]>(initialDemoState.bookings)
  const [activities, setActivities] = useState<CaseActivity[]>(initialDemoState.activities)
  const [outboundMessages, setOutboundMessages] = useState<StoredMessage[]>(initialDemoState.outboundMessages)
  const [updateCaseId, setUpdateCaseId] = useState<string | null>(initialDemoState.updateCaseId)
  const [acknowledgementCaseId, setAcknowledgementCaseId] = useState<string | null>(initialDemoState.acknowledgementCaseId)
  const [messageDraft, setMessageDraft] = useState(initialDemoState.acknowledgementCaseId ? `Hi Ravi, I’ve created Case ${initialDemoState.acknowledgementCaseId} for the conference-room AC. Our service team will review it and share an update.` : initialDemoState.updateCaseId ? `Hi Ravi, the conference-room AC has been repaired and cooling has been verified. Case ${initialDemoState.updateCaseId} is resolved.` : '')
  const [messageError, setMessageError] = useState('')
  const [messageSentCaseId, setMessageSentCaseId] = useState<string | null>(null)
  const [messageSentPurpose, setMessageSentPurpose] = useState<'acknowledgement' | 'repair' | null>(null)
  const [technicianTaskId, setTechnicianTaskId] = useState<string | null>(null)

  useEffect(() => {
    saveDemoState({ loggedIn, selectedConversationId, selectedContactRecordId, savedCaseId, savedCases, tasks, bookings, activities, outboundMessages, updateCaseId, acknowledgementCaseId, activeCaseByConversation })
  }, [loggedIn, selectedConversationId, selectedContactRecordId, savedCaseId, savedCases, tasks, bookings, activities, outboundMessages, updateCaseId, acknowledgementCaseId, activeCaseByConversation])

  const allCases = [...serviceCases, ...savedCases]
  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null
  const selectedContact = selectedConversation ? getContact(selectedConversation.contactId) : null
  const contactRecord = contacts.find((item) => item.id === selectedContactRecordId) ?? null
  const inspectedCase = allCases.find((item) => item.id === inspectedCaseId) ?? null
  const activeCase = allCases.find((item) => item.id === savedCaseId) ?? null
  const conversationActiveCase = selectedConversation ? allCases.find((item) => item.id === activeCaseByConversation[selectedConversation.id]) ?? null : null
  const linkedConversationForCase = activeCase ? conversations.find((item) => activeCaseByConversation[item.id] === activeCase.id) ?? null : null
  const technicianTask = tasks.find((item) => item.id === technicianTaskId) ?? null
  const inContactWorkspace = Boolean(contactRecord)
  const inTaskWorkspace = !inContactWorkspace && tasksModuleOpen
  const inCaseWorkspace = !inContactWorkspace && !inTaskWorkspace && (casesModuleOpen || Boolean(activeCase))
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
    setSelectedContactRecordId(null)
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSelectedConversationId(id)
    setInspectedCaseId(null)
    setDraft(null)
    setSavedCaseId(null)
    setUpdateCaseId(null)
    setMessageSentCaseId(null)
    setTechnicianTaskId(null)
    setPanelOpen(true)
  }

  function setConversationActiveCase(caseId: string) {
    if (!selectedConversation || !allCases.some((item) => item.id === caseId && item.contactId === selectedConversation.contactId)) return
    setActiveCaseByConversation((current) => ({ ...current, [selectedConversation.id]: caseId }))
    setInspectedCaseId(null)
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
    setSelectedContactRecordId(null)
    setCasesModuleOpen(true)
    setTasksModuleOpen(false)
    setSavedCaseId(id)
    setInspectedCaseId(null)
    setDraft(null)
    setUpdateCaseId(null)
    setTechnicianTaskId(null)
  }

  function openServiceCases() {
    setSelectedContactRecordId(null)
    setCasesModuleOpen(true)
    setTasksModuleOpen(false)
    setSavedCaseId(null)
    setDraft(null)
    setInspectedCaseId(null)
    setTechnicianTaskId(null)
  }

  function returnToConversations() {
    setSelectedContactRecordId(null)
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSavedCaseId(null)
    setTechnicianTaskId(null)
    setPanelOpen(true)
    if (!selectedConversationId) setSelectedConversationId('conversation-ravi')
  }

  function openLinkedConversation(conversationId: string) {
    setSelectedContactRecordId(null)
    setSelectedConversationId(conversationId)
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSavedCaseId(null)
    setTechnicianTaskId(null)
    setPanelOpen(true)
  }

  function viewContact(id: string) {
    if (!contacts.some((item) => item.id === id)) return
    setSelectedContactRecordId(id)
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSavedCaseId(null)
    setTechnicianTaskId(null)
    setDraft(null)
    setInspectedCaseId(null)
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
    setActiveCaseByConversation((current) => ({ ...current, [draft.sourceConversationId]: createdCase.id }))
    setAcknowledgementCaseId(createdCase.id)
    setMessageDraft(`Hi Ravi, I’ve created Case ${createdCase.id} for the conference-room AC. Our service team will review it under your maintenance agreement and share an update. The resolution target is ${agreement.resolutionTargetHours} hours.`)
    setMessageError('')
    setMessageSentCaseId(null)
    setMessageSentPurpose(null)
    setSavedCaseId(null)
    setDraft(null)
    setPanelOpen(true)
  }

  function createTask(caseId: string, subject: string, assigneeId: string, dueAt: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    if (!serviceCase || (serviceCase.status !== 'Open' && serviceCase.status !== 'In progress') || tasks.some((item) => item.caseId === caseId) || creatingTaskCaseIds.current.has(caseId)) return
    creatingTaskCaseIds.current.add(caseId)
    const task: ServiceTask = { id: nextRecordId('TASK', tasks, 201), caseId, subject, assigneeId, dueAt, status: 'Open', createdAt: new Date().toISOString() }
    setTasks((current) => [...current, task])
    if (serviceCase.status === 'Open') updateSavedCase(caseId, { status: 'In progress' })
    const description = `Created ${task.id} for ${getOwnerName(assigneeId)}; internal deadline ${formatDateTime(dueAt)}.${serviceCase.status === 'Open' ? ' Moved Case to In progress.' : ''}`
    addActivity(caseId, 'user-arun', description)
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
    if (!serviceCase || !['In progress', 'Waiting'].includes(serviceCase.status) || !tasks.some((item) => item.caseId === caseId && item.status === 'Completed') || !code || !summary.trim()) return
    const resolvedAt = new Date().toISOString()
    updateSavedCase(caseId, { status: 'Resolved', waitingReason: undefined, resolutionCode: code, resolutionSummary: summary.trim(), resolvedAt })
    addActivity(caseId, 'user-arun', `Resolved Case: ${code}. ${summary.trim()}`)
  }

  function openConversationForUpdate(caseId: string) {
    const serviceCase = savedCases.find((item) => item.id === caseId)
    const conversation = conversations.find((item) => item.contactId === serviceCase?.contactId)
    if (!serviceCase || serviceCase.status !== 'Resolved' || !conversation) return
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSelectedConversationId(conversation.id)
    setSavedCaseId(null)
    setUpdateCaseId(caseId)
    setAcknowledgementCaseId(null)
    setMessageDraft(`Hi Ravi, the conference-room AC has been repaired and cooling has been verified. Case ${caseId} is resolved.`)
    setMessageError('')
    setMessageSentCaseId(null)
    setPanelOpen(true)
  }

  function sendCaseAcknowledgement() {
    const serviceCase = savedCases.find((item) => item.id === acknowledgementCaseId)
    if (!serviceCase || !selectedConversation || activeCaseByConversation[selectedConversation.id] !== serviceCase.id) return
    const messageText = messageDraft.trim()
    if (!messageText.includes(serviceCase.id)) {
      setMessageError(`Mention ${serviceCase.id} in the acknowledgement.`)
      return
    }
    const createdAt = new Date().toISOString()
    const message: StoredMessage = { id: crypto.randomUUID(), conversationId: selectedConversation.id, text: messageText, direction: 'outbound', createdAt, time: formatDateTime(createdAt) }
    setOutboundMessages((current) => [...current, message])
    addActivity(serviceCase.id, 'user-priya', `Sent Case acknowledgement to Ravi in Conversations for ${serviceCase.id}.`)
    setAcknowledgementCaseId(null)
    setMessageDraft('')
    setMessageError('')
    setMessageSentCaseId(serviceCase.id)
    setMessageSentPurpose('acknowledgement')
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
    setMessageSentPurpose('repair')
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
    addActivity(caseId, 'user-arun', 'Closed Case after confirming the customer update.')
  }

  function resetDemo() {
    clearDemoState()
    creatingTaskCaseIds.current.clear()
    setLoggedIn(false)
    setCasesModuleOpen(false)
    setTasksModuleOpen(false)
    setSelectedConversationId(null)
    setSelectedContactRecordId(null)
    setSavedCaseId(null)
    setSavedCases([])
    setActiveCaseByConversation({})
    setTasks([])
    setBookings([])
    setActivities([])
    setOutboundMessages([])
    setUpdateCaseId(null)
    setAcknowledgementCaseId(null)
    setMessageDraft('')
    setMessageError('')
    setMessageSentCaseId(null)
    setMessageSentPurpose(null)
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
          <button type="button" className={inCaseWorkspace || inContactWorkspace || inTaskWorkspace ? 'rail-nav-button' : 'rail-nav-button active'} aria-label="Conversations" aria-current={!inCaseWorkspace && !inContactWorkspace && !inTaskWorkspace ? 'page' : undefined} onClick={returnToConversations}><MessageSquareText size={21} /><span>Conversations</span></button>
          <button type="button" className={inContactWorkspace ? 'rail-nav-button active' : 'rail-nav-button'} aria-label="Contacts" aria-current={inContactWorkspace ? 'page' : undefined} onClick={() => viewContact(selectedContactRecordId ?? 'contact-ravi')}><Users size={21} /><span>Contacts</span></button>
          <button type="button" className={inCaseWorkspace ? 'rail-nav-button active' : 'rail-nav-button'} aria-label="Service Cases" aria-current={inCaseWorkspace ? 'page' : undefined} onClick={openServiceCases}><BriefcaseBusiness size={21} /><span>Service Cases</span></button>
          <button type="button" className={inTaskWorkspace ? 'rail-nav-button active' : 'rail-nav-button'} aria-label="Tasks" aria-current={inTaskWorkspace ? 'page' : undefined} onClick={() => { setSelectedContactRecordId(null); setCasesModuleOpen(false); setTasksModuleOpen(true); setSavedCaseId(null); setTechnicianTaskId(null); setDraft(null); setInspectedCaseId(null) }}><ClipboardList size={21} /><span>Tasks</span></button>
        </nav>
        <div className="rail-spacer" />
        <div className="rail-avatar" title={activePersona ? activePersona.name + ' · ' + activePersona.role + ' (demo role)' : 'Demo role'}>{personaInitials}</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title"><span className="topbar-product">{inTaskWorkspace ? 'Tasks' : inContactWorkspace ? 'Contacts' : inCaseWorkspace ? 'Service Cases' : 'Conversations'}</span><span className="topbar-divider" /><span className="topbar-location">{technicianTaskId ? 'Technician work' : inTaskWorkspace ? 'Work items' : inContactWorkspace ? 'Contact record' : activeCase ? 'Case record' : inCaseWorkspace ? 'Records' : 'Team inbox'}</span></div>
          {inCaseWorkspace && <nav className="module-switch" aria-label="Module navigation"><button onClick={returnToConversations}>Conversations</button><ChevronRight size={14} /><strong aria-current="page">Service Cases</strong></nav>}
          {inTaskWorkspace && <nav className="module-switch" aria-label="Module navigation"><button onClick={returnToConversations}>Conversations</button><ChevronRight size={14} /><strong aria-current="page">Tasks</strong></nav>}
          <div className="topbar-right"><span className="workspace-label"><span className="workspace-dot" /> Northstar Service</span><button className="reset-demo" onClick={resetDemo}><RotateCcw size={13} /> Reset demo</button><span className="persona-label">Viewing as <strong>{activePersona?.name ?? 'Team member'} · {activePersona?.role ?? 'Demo role'}</strong></span><span className="agent-badge" title={activePersona ? activePersona.name + ' · ' + activePersona.role + ' (demo role)' : 'Demo role'}>{personaInitials}</span></div>
        </header>
        <div className="workspace-body">
          {inContactWorkspace ? <ContactsModuleSidebar selectedId={selectedContactRecordId} onSelect={viewContact} onBack={returnToConversations} /> : inTaskWorkspace ? <TasksModuleSidebar tasks={tasks} activeTaskId={technicianTaskId} onSelect={setTechnicianTaskId} onBack={returnToConversations} /> : inCaseWorkspace ? <CasesModuleSidebar cases={allCases} activeCaseId={savedCaseId} onSelect={viewInCases} onBack={returnToConversations} /> : <aside className="inbox-panel" aria-label="Conversations inbox">
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

          {contactRecord ? <ContactRecordView contact={contactRecord} relatedCases={allCases.filter((item) => item.contactId === contactRecord.id)} savedCases={savedCases} tasks={tasks} activities={activities} outboundMessages={outboundMessages} onViewCase={viewInCases} onViewTask={(taskId) => { setCasesModuleOpen(false); setTasksModuleOpen(true); setSavedCaseId(null); setTechnicianTaskId(taskId) }} onOpenConversation={() => { const conversation = conversations.find((item) => item.contactId === contactRecord.id); if (conversation) openLinkedConversation(conversation.id) }} onBack={returnToConversations} /> : draft && selectedContact ? <DraftView draft={draft} contact={selectedContact} onChange={setDraft} onBack={() => setDraft(null)} onCreate={createCase} /> : technicianTask ? <TechnicianTaskView task={technicianTask} onComplete={(note) => completeTask(technicianTask.id, note)} onViewCase={() => viewInCases(technicianTask.caseId)} onBack={() => setTechnicianTaskId(null)} /> : activeCase ? <CaseJourneyView key={activeCase.id} serviceCase={activeCase} allCases={allCases} tasks={tasks} activities={activities} customerUpdateSent={hasSentCustomerUpdate(activeCase)} canManage={savedCases.some((item) => item.id === activeCase.id)} linkedConversation={linkedConversationForCase} onViewLinkedConversation={() => linkedConversationForCase && openLinkedConversation(linkedConversationForCase.id)} onViewContact={() => viewContact(activeCase.contactId)} onBack={returnToConversations} onCreateTask={(subject, assigneeId, dueAt) => createTask(activeCase.id, subject, assigneeId, dueAt)} onOpenTask={(taskId) => { setCasesModuleOpen(false); setTasksModuleOpen(true); setSavedCaseId(null); setTechnicianTaskId(taskId) }} onResolve={(code, summary) => resolveCase(activeCase.id, code, summary)} onOpenConversation={() => openConversationForUpdate(activeCase.id)} onConfirmCustomerUpdate={() => confirmCustomerUpdate(activeCase.id)} onCloseCase={() => closeCase(activeCase.id)} /> : inTaskWorkspace ? <TasksModuleLanding taskCount={tasks.length} /> : inCaseWorkspace ? <CasesModuleLanding caseCount={allCases.length} /> : <>
            <main className="conversation-pane" aria-label="Conversation">
              {selectedConversation && selectedContact ? <>
                <div className="conversation-header"><div className="conversation-person"><Avatar contact={selectedContact} /><div><h2>{selectedContact.name}</h2><span><ChannelIcon channel={selectedConversation.channel} size={14} /> {selectedConversation.channel} conversation</span></div></div><button className="header-panel-button" onClick={() => setPanelOpen(!panelOpen)} aria-label={panelOpen ? 'Hide contact details' : 'Show contact details'}>{panelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}<span>{panelOpen ? 'Hide details' : 'Show details'}</span></button></div>
                <div className="message-area"><ActiveCasePanel serviceCase={conversationActiveCase} onViewInCases={() => conversationActiveCase && viewInCases(conversationActiveCase.id)} onChooseCase={() => setPanelOpen(true)} /><div className="date-divider"><span>Today · 22 Sep 2026</span></div><div className="thread-channel"><ChannelIcon channel={selectedConversation.channel} size={15} /> {selectedConversation.channel}</div>{selectedMessages.map((message, index) => <div key={message.id} className={`message-row ${message.direction === 'outbound' ? 'message-row--outbound' : ''}`}>{message.direction === 'inbound' && <Avatar contact={selectedContact} />}<div className="message-body"><div className="message-bubble">{message.text}</div><span className="message-time">{message.time}{selectedConversation.unread && message.direction === 'inbound' && index === selectedConversation.messages.length - 1 && <span className="new-label">NEW</span>}</span></div>{message.direction === 'outbound' && <span className="avatar avatar--blue message-agent-avatar">PN</span>}</div>)}</div>
                {acknowledgementCaseId ? <div className="conversation-composer"><div className="composer-heading"><strong>Confirm the new Case with Ravi</strong><span>Send a short acknowledgement, then Arun can manage the service work in Cases.</span></div><label htmlFor="case-acknowledgement">Message</label><textarea id="case-acknowledgement" rows={3} value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} />{messageError && <span className="field-error" role="alert">{messageError}</span>}<div className="composer-actions"><span>This confirms the Case was created; it does not say the AC is repaired.</span><button className="primary-button" onClick={sendCaseAcknowledgement}><Send size={15} /> Send Case confirmation</button></div></div> : updateCaseId ? <div className="conversation-composer"><div className="composer-heading"><strong>Manual WhatsApp update to Ravi</strong><span>Message delivery remains separate from recording a Case update.</span></div><label htmlFor="customer-update">Message</label><textarea id="customer-update" rows={3} value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} />{messageError && <span className="field-error" role="alert">{messageError}</span>}<div className="composer-actions"><span>Sending adds this message to Ravi’s conversation only. Confirm the update separately on {updateCaseId}.</span><button className="primary-button" onClick={sendCustomerUpdate}><Send size={15} /> Send WhatsApp update</button></div></div> : <div className="conversation-bottom"><div className="conversation-bottom-icon"><MessageSquareText size={19} /></div><div><strong>{messageSentCaseId ? 'Message sent to Ravi' : 'Turn this request into service work'}</strong><span>{messageSentPurpose === 'acknowledgement' ? `Case ${messageSentCaseId} confirmed. Arun can continue the service work in Cases.` : messageSentPurpose === 'repair' ? `Open ${messageSentCaseId} in Related Cases and record customer-update confirmation.` : 'Review related Cases in the contact panel before choosing the next step.'}</span></div></div>}
              </> : <div className="select-empty"><div className="select-empty-icon"><MessageSquareText size={30} /></div><h2>Select a conversation</h2><p>Open Ravi’s new WhatsApp message to review the customer and related Cases.</p></div>}
            </main>
            {selectedConversation && selectedContact && panelOpen && (inspectedCase ? <CaseInspection key={inspectedCase.id} serviceCase={inspectedCase} isActive={conversationActiveCase?.id === inspectedCase.id} onBack={() => setInspectedCaseId(null)} onViewInCases={() => viewInCases(inspectedCase.id)} /> : <ContactPanel contact={selectedContact} relatedCases={allCases.filter((item) => item.contactId === selectedContact.id)} activeCaseId={conversationActiveCase?.id ?? null} onInspectCase={setInspectedCaseId} onViewInCases={viewInCases} onSetActiveCase={setConversationActiveCase} onCreateCase={startDraft} onViewContact={() => viewContact(selectedContact.id)} onClose={() => setPanelOpen(false)} />)}
          </>}
        </div>
      </div>
    </div>
  )
}

export default App

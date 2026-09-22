import { useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight,
  CircleHelp, Clock3, Inbox, Mail, MessageCircle, MessageSquareText,
  PanelRightClose, PanelRightOpen, Plus, Search, ShieldCheck, Smartphone,
  Sparkles, X,
} from 'lucide-react'
import {
  contacts, conversations, createCaseDraft, serviceCases,
  type CaseDraft, type Channel, type Contact, type ServiceCase,
} from './data'

type InboxTab = 'All' | 'Unread'

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

function CaseSummary({ serviceCase, onOpen }: { serviceCase: ServiceCase; onOpen: () => void }) {
  return (
    <button className="case-summary" onClick={onOpen} aria-label={`Inspect ${serviceCase.id}, ${serviceCase.subject}`}>
      <span className="case-summary-top"><strong>{serviceCase.id}</strong><span className="status-pill"><span />{serviceCase.status}</span></span>
      <span className="case-title">{serviceCase.subject}</span>
      <span className="case-subline">{serviceCase.location} <span>·</span> Opened {serviceCase.openedAt}</span>
      <span className="case-open-link">Inspect Case <ChevronRight size={15} /></span>
    </button>
  )
}

function ContactPanel({ contact, relatedCases, onInspectCase, onCreateCase, onClose }: {
  contact: Contact
  relatedCases: ServiceCase[]
  onInspectCase: (id: string) => void
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
          {relatedCases.length > 0 ? relatedCases.map((item) => <CaseSummary key={item.id} serviceCase={item} onOpen={() => onInspectCase(item.id)} />) : <p className="empty-cases">No existing Cases for this contact.</p>}
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

function CaseInspection({ serviceCase, onBack }: { serviceCase: ServiceCase; onBack: () => void }) {
  return (
    <aside className="detail-panel" aria-label={`${serviceCase.id} Case details`}>
      <div className="panel-heading panel-heading--case"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to message</button></div>
      <div className="panel-scroll">
        <div className="inspection-header"><span className="panel-kicker">RELATED CASE · CANDIDATE</span><h2>{serviceCase.id}</h2><h3>{serviceCase.subject}</h3><span className="status-pill"><span />{serviceCase.status}</span></div>
        <div className="inspection-note"><CircleHelp size={19} /><span>This Case is related to Ravi’s contact. Decide whether the new message is about this same issue.</span></div>
        <div className="inspection-section"><span className="panel-kicker">ISSUE DETAILS</span><p>{serviceCase.description}</p></div>
        <dl className="case-facts"><div><dt>Location</dt><dd>{serviceCase.location}</dd></div><div><dt>Asset</dt><dd>{serviceCase.asset}</dd></div><div><dt>Priority</dt><dd>{serviceCase.priority}</dd></div><div><dt>Owner</dt><dd>{serviceCase.owner}</dd></div><div><dt>Opened</dt><dd>{serviceCase.openedAt}</dd></div></dl>
        <div className="inspection-footer"><p>Ravi’s new message mentions the <strong>conference-room AC</strong>. This Case is about the <strong>lobby AC</strong>.</p><button className="secondary-button full-width" onClick={onBack}><ArrowLeft size={17} /> Return to conversation</button></div>
      </div>
    </aside>
  )
}

function DraftView({ draft, contact, onChange, onBack }: {
  draft: CaseDraft
  contact: Contact
  onChange: (draft: CaseDraft) => void
  onBack: () => void
}) {
  return (
    <main className="draft-view" aria-labelledby="draft-title">
      <div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to conversation</button><span className="draft-status"><span /> Unsaved draft</span></div>
      <div className="draft-content">
        <div className="draft-breadcrumb">Conversations <ChevronRight size={14} /> Ravi Kumar <ChevronRight size={14} /> New Case</div>
        <div className="draft-hero"><div className="draft-hero-icon"><BriefcaseBusiness size={24} /></div><div><span className="panel-kicker">SERVICE CASE</span><h1 id="draft-title">New Case draft</h1><p>Review the request details before creating a Case.</p></div></div>
        <div className="draft-grid">
          <section className="draft-form-card"><div className="form-card-heading"><h2>Request details</h2><span>From this conversation</span></div>
            <div className="field"><label htmlFor="case-subject">Subject</label><input id="case-subject" value={draft.subject} onChange={(event) => onChange({ ...draft, subject: event.target.value })} /></div>
            <div className="field"><label htmlFor="case-description">Description</label><textarea id="case-description" rows={6} value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} /></div>
          </section>
          <div className="draft-side-stack"><section className="draft-form-card"><div className="form-card-heading"><h2>Context</h2></div><div className="draft-context-row"><span>Requester</span><strong><Avatar contact={contact} /> {contact.name}</strong></div><div className="draft-context-row"><span>Source</span><strong><ChannelIcon channel={draft.source} /> {draft.source}</strong></div><div className="draft-context-row"><span>Company</span><strong>{contact.company}</strong></div></section>
            <section className="source-card"><MessageSquareText size={18} /><div><strong>Started from a message</strong><p>The message is copied into this draft. No existing Case was selected for it.</p></div></section></div>
        </div>
        <div className="draft-bottom-note"><Clock3 size={17} /> This is a draft preview. Case creation and submission come in the next iteration.</div>
      </div>
    </main>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [inboxTab, setInboxTab] = useState<InboxTab>('All')
  const [search, setSearch] = useState('')
  const [inspectedCaseId, setInspectedCaseId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [draft, setDraft] = useState<CaseDraft | null>(null)

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null
  const selectedContact = selectedConversation ? getContact(selectedConversation.contactId) : null
  const inspectedCase = serviceCases.find((item) => item.id === inspectedCaseId) ?? null
  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    if (inboxTab === 'Unread' && !conversation.unread) return false
    const contact = getContact(conversation.contactId)
    const query = search.trim().toLowerCase()
    return !query || contact.name.toLowerCase().includes(query) || conversation.messages.some((message) => message.text.toLowerCase().includes(query))
  }), [inboxTab, search])

  function selectConversation(id: string) {
    setSelectedConversationId(id)
    setInspectedCaseId(null)
    setDraft(null)
    setPanelOpen(true)
  }

  function startDraft() {
    if (!selectedConversation) return
    setDraft(createCaseDraft(selectedConversation))
    setInspectedCaseId(null)
  }

  if (!loggedIn) return <Login onContinue={() => setLoggedIn(true)} />

  return (
    <div className="app-shell">
      <aside className="app-rail" aria-label="Workspace navigation"><div className="rail-brand" aria-label="HighLevel"><span>H<span>↑</span></span></div><div className="rail-divider" /><div className="rail-active" title="Conversations"><MessageSquareText size={21} /></div><div className="rail-spacer" /><div className="rail-avatar" title="Priya Nair">PN</div></aside>
      <div className="workspace">
        <header className="topbar"><div className="topbar-title"><span className="topbar-product">Conversations</span><span className="topbar-divider" /><span className="topbar-location">Team inbox</span></div><div className="topbar-right"><span className="workspace-label"><span className="workspace-dot" /> Northstar Service</span><span className="agent-badge">PN</span></div></header>
        <div className="workspace-body">
          <aside className="inbox-panel" aria-label="Conversations inbox">
            <div className="inbox-heading"><div><span className="eyebrow">INBOX</span><h1>Team inbox</h1></div><span className="inbox-total">{conversations.length}</span></div>
            <div className="inbox-tabs" role="tablist" aria-label="Conversation filter"><button role="tab" aria-selected={inboxTab === 'All'} className={inboxTab === 'All' ? 'active' : ''} onClick={() => setInboxTab('All')}>All</button><button role="tab" aria-selected={inboxTab === 'Unread'} className={inboxTab === 'Unread' ? 'active' : ''} onClick={() => setInboxTab('Unread')}>Unread <span>{conversations.filter((item) => item.unread).length}</span></button></div>
            <label className="search-box"><Search size={17} /><input aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label>
            <div className="conversation-list">{filteredConversations.length ? filteredConversations.map((conversation) => {
              const contact = getContact(conversation.contactId)
              const latest = conversation.messages[conversation.messages.length - 1]
              return <button key={conversation.id} className={`conversation-item ${selectedConversationId === conversation.id ? 'selected' : ''}`} onClick={() => selectConversation(conversation.id)} aria-label={`Open ${contact.name} conversation`}>
                <Avatar contact={contact} /><span className="conversation-text"><span className="conversation-row"><strong>{contact.name}</strong><time>{conversation.updatedAt}</time></span><span className="conversation-company">{contact.company}</span><span className="conversation-preview"><span className={`channel-mini ${conversation.channel === 'WhatsApp' ? 'channel-mini--whatsapp' : ''}`}><ChannelIcon channel={conversation.channel} size={13} /></span>{latest.text}</span></span>{conversation.unread && <span className="unread-dot" aria-label="Unread" />}
              </button>
            }) : <div className="empty-list">No conversations found.</div>}</div>
            <div className="inbox-footer"><Inbox size={16} /> {filteredConversations.length} conversations</div>
          </aside>

          {draft && selectedContact ? <DraftView draft={draft} contact={selectedContact} onChange={setDraft} onBack={() => setDraft(null)} /> : <>
            <main className="conversation-pane" aria-label="Conversation">
              {selectedConversation && selectedContact ? <>
                <div className="conversation-header"><div className="conversation-person"><Avatar contact={selectedContact} /><div><h2>{selectedContact.name}</h2><span><ChannelIcon channel={selectedConversation.channel} size={14} /> {selectedConversation.channel} conversation</span></div></div><button className="header-panel-button" onClick={() => setPanelOpen(!panelOpen)} aria-label={panelOpen ? 'Hide contact details' : 'Show contact details'}>{panelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}<span>{panelOpen ? 'Hide details' : 'Show details'}</span></button></div>
                <div className="message-area"><div className="date-divider"><span>Today · 22 Sep 2026</span></div><div className="thread-channel"><ChannelIcon channel={selectedConversation.channel} size={15} /> {selectedConversation.channel}</div>{selectedConversation.messages.map((message, index) => <div key={message.id} className="message-row"><Avatar contact={selectedContact} /><div className="message-body"><div className="message-bubble">{message.text}</div><span className="message-time">{message.time}{selectedConversation.unread && index === selectedConversation.messages.length - 1 && <span className="new-label">NEW</span>}</span></div></div>)}</div>
                <div className="conversation-bottom"><div className="conversation-bottom-icon"><MessageSquareText size={19} /></div><div><strong>Turn this request into service work</strong><span>Review related Cases in the contact panel before choosing the next step.</span></div></div>
              </> : <div className="select-empty"><div className="select-empty-icon"><MessageSquareText size={30} /></div><h2>Select a conversation</h2><p>Open Ravi’s new WhatsApp message to review the customer and related Cases.</p></div>}
            </main>
            {selectedConversation && selectedContact && panelOpen && (inspectedCase ? <CaseInspection serviceCase={inspectedCase} onBack={() => setInspectedCaseId(null)} /> : <ContactPanel contact={selectedContact} relatedCases={serviceCases.filter((item) => item.contactId === selectedContact.id)} onInspectCase={setInspectedCaseId} onCreateCase={startDraft} onClose={() => setPanelOpen(false)} />)}
          </>}
        </div>
      </div>
    </div>
  )
}

export default App

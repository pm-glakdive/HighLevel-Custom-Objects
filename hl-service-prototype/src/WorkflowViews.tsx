import { useState } from 'react'
import {
  ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight,
  CircleHelp, ClipboardList, Clock3, MessageSquareText, Plus, Wrench, X,
} from 'lucide-react'
import {
  agreements, assets, contacts, serviceUsers,
  type CaseActivity, type Contact, type CustomerAsset, type ServiceCase,
  type ServiceTask, type ServicesBooking,
} from './data'

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}

function localDateTimeInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

type RecordPreview = 'contact' | 'asset' | 'agreement' | null

interface CaseJourneyProps {
  serviceCase: ServiceCase
  allCases: ServiceCase[]
  tasks: ServiceTask[]
  bookings: ServicesBooking[]
  activities: CaseActivity[]
  customerUpdateSent: boolean
  onBack: () => void
  onStartWork: () => void
  onCreateTask: (subject: string, assigneeId: string, dueAt: string) => void
  onOpenBooking: () => void
  onRecordBooking: (bookingId: string) => void
  onSetWaiting: (reason: string) => void
  onOpenTask: (taskId: string) => void
  onResolve: (code: string, summary: string) => void
  onOpenConversation: () => void
  onConfirmCustomerUpdate: () => void
  onCloseCase: () => void
}

export function CaseJourneyView({
  serviceCase, allCases, tasks, bookings, activities, customerUpdateSent, onBack, onStartWork,
  onCreateTask, onOpenBooking, onRecordBooking, onSetWaiting, onOpenTask,
  onResolve, onOpenConversation, onConfirmCustomerUpdate, onCloseCase,
}: CaseJourneyProps) {
  const [preview, setPreview] = useState<RecordPreview>(null)
  const [taskSubject, setTaskSubject] = useState('Inspect and repair conference-room AC')
  const [taskAssigneeId, setTaskAssigneeId] = useState('user-sanjay')
  const [taskDueAt, setTaskDueAt] = useState(localDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const [bookingReference, setBookingReference] = useState('')
  const [waitingReason, setWaitingReason] = useState('')
  const [resolutionCode, setResolutionCode] = useState('')
  const [resolutionSummary, setResolutionSummary] = useState('')
  const [updateConfirmed, setUpdateConfirmed] = useState(false)
  const [formError, setFormError] = useState('')

  const contact = contacts.find((item) => item.id === serviceCase.contactId)
  const asset = assets.find((item) => item.id === serviceCase.assetId)
  const agreement = agreements.find((item) => item.id === serviceCase.agreementId)
  const owner = serviceUsers.find((item) => item.id === serviceCase.ownerId)
  const caseTasks = tasks.filter((item) => item.caseId === serviceCase.id)
  const task = caseTasks[0]
  const orderedActivities = activities.filter((item) => item.caseId === serviceCase.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const history = allCases.filter((item) => item.assetId === asset?.id && (item.status === 'Resolved' || item.status === 'Closed'))
  const recentBookings = bookings.filter((item) => item.contactId === serviceCase.contactId && item.assetId === serviceCase.assetId)
  if (!contact) return null

  function createTask() {
    if (!taskSubject.trim() || !taskAssigneeId || !taskDueAt || Number.isNaN(Date.parse(taskDueAt))) {
      setFormError('Enter a Task, technician and due time.')
      return
    }
    setFormError('')
    onCreateTask(taskSubject.trim(), taskAssigneeId, new Date(taskDueAt).toISOString())
  }

  function recordBooking() {
    const id = bookingReference.trim().toUpperCase()
    const matchingBooking = recentBookings.find((item) => item.id === id)
    if (!matchingBooking) {
      setFormError('Enter a Services booking ID for Ravi and this Asset. Book a visit first if needed.')
      return
    }
    setFormError('')
    onRecordBooking(id)
  }

  function saveWaiting() {
    if (!waitingReason) {
      setFormError('Choose why this Case is waiting.')
      return
    }
    setFormError('')
    onSetWaiting(waitingReason)
  }

  function saveResolution() {
    if (!resolutionCode || !resolutionSummary.trim()) {
      setFormError('Choose a resolution code and enter a summary.')
      return
    }
    setFormError('')
    onResolve(resolutionCode, resolutionSummary.trim())
  }

  return (
    <main className="draft-view" aria-labelledby="saved-case-title">
      <div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to Ravi’s conversation</button><span className="saved-status"><span /> Saved Case</span></div>
      <div className="draft-content">
        <div className="draft-breadcrumb">Service Cases <ChevronRight size={14} /> {serviceCase.id}</div>
        <div className="draft-hero"><div className="draft-hero-icon"><BriefcaseBusiness size={24} /></div><div><span className="panel-kicker">SERVICE CASE · {serviceCase.id}</span><h1 id="saved-case-title">{serviceCase.subject}</h1><p>Created {formatDateTime(serviceCase.createdAt)}</p></div></div>
        <div className="saved-case-grid">
          <div className="saved-case-main">
            <section className="draft-form-card">
              <div className="form-card-heading"><h2>Issue</h2><span className="status-pill"><span />{serviceCase.status}</span></div>
              <p className="saved-description">{serviceCase.description}</p>
              {serviceCase.status === 'Waiting' && <div className="waiting-callout">Waiting reason: <strong>{serviceCase.waitingReason}</strong></div>}
              <div className="saved-source"><MessageSquareText size={15} /> Created from {serviceCase.source} <span>· Source information only</span></div>
            </section>

            <section className="draft-form-card">
              <div className="form-card-heading"><h2>Service commitment</h2></div>
              <div className="commitment-value"><Clock3 size={21} /><div><strong>{serviceCase.appliedResolutionTargetHours === null ? 'No target applied' : `${serviceCase.appliedResolutionTargetHours}-hour resolution target`}</strong><span>Applied target snapshot on {serviceCase.id}</span></div></div>
              {serviceCase.targetResolutionAt && <div className="detail-line"><span>Target resolution</span><strong>{formatDateTime(serviceCase.targetResolutionAt)}</strong></div>}
            </section>

            {(task || serviceCase.status !== 'Open') && <section className="draft-form-card">
              <div className="form-card-heading"><h2>Work</h2><span>Task linked to this Case</span></div>
              {task ? <div className="work-record"><div className="work-record-head"><span className="record-id">{task.id}</span><span className={`task-state ${task.status === 'Completed' ? 'task-state--done' : ''}`}>{task.status}</span></div><strong>{task.subject}</strong><div className="work-record-meta">Assignee: {serviceUsers.find((item) => item.id === task.assigneeId)?.name ?? 'Unknown'} · Due {formatDateTime(task.dueAt)}</div>{task.completedAt && <div className="work-note"><strong>Technician work note</strong><p>{task.workNote}</p><small>Completed {formatDateTime(task.completedAt)}</small></div>}</div> : <p className="record-helper">No Task has been created yet.</p>}
              {serviceCase.bookingReferenceId && <div className="manual-reference"><strong>Services booking reference: {serviceCase.bookingReferenceId}</strong><span>Manually entered on this Case. The booking remains a separate Services record.</span></div>}
            </section>}

            {(serviceCase.status === 'Resolved' || serviceCase.status === 'Closed') && <section className="draft-form-card outcome-card">
              <div className="form-card-heading"><h2>Outcome</h2><CheckCircle2 size={19} /></div>
              <div className="detail-line"><span>Resolution code</span><strong>{serviceCase.resolutionCode}</strong></div>
              <p className="saved-description">{serviceCase.resolutionSummary}</p>
              <div className="detail-line"><span>Resolved</span><strong>{serviceCase.resolvedAt ? formatDateTime(serviceCase.resolvedAt) : '—'}</strong></div>
              {serviceCase.customerUpdateAt && <div className="update-confirmation"><CheckCircle2 size={17} /><div><strong>Customer update confirmed</strong><span>{formatDateTime(serviceCase.customerUpdateAt)} · Manually recorded by Priya</span><p>{serviceCase.customerUpdateText}</p></div></div>}
              {serviceCase.closedAt && <div className="detail-line"><span>Closed</span><strong>{formatDateTime(serviceCase.closedAt)}</strong></div>}
            </section>}

            <section className="draft-form-card case-next-step">
              <div className="form-card-heading"><h2>{serviceCase.status === 'Closed' ? 'Journey complete' : 'Next step'}</h2></div>
              {serviceCase.status === 'Open' && <><p>Priya takes ownership of the service work for this Case.</p><button className="primary-button" onClick={onStartWork}><Wrench size={16} /> Start work</button></>}
              {serviceCase.status === 'In progress' && !task && <><p>Create a Task for the technician. The Task will carry this Case ID.</p><div className="field"><label htmlFor="task-subject">Task</label><input id="task-subject" value={taskSubject} onChange={(event) => setTaskSubject(event.target.value)} /></div><div className="field-pair"><div className="field"><label htmlFor="task-assignee">Assignee</label><select id="task-assignee" value={taskAssigneeId} onChange={(event) => setTaskAssigneeId(event.target.value)}>{serviceUsers.filter((item) => item.role === 'Technician').map((item) => <option key={item.id} value={item.id}>{item.name} · Technician</option>)}</select></div><div className="field"><label htmlFor="task-due">Due time</label><input id="task-due" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /></div></div><button className="primary-button" onClick={createTask}><Plus size={16} /> Create Task</button></>}
              {serviceCase.status === 'In progress' && task && !serviceCase.bookingReferenceId && <><p>Book the on-site visit in Services, then enter its ID here as a manual reference.</p><button className="secondary-button" onClick={onOpenBooking}><CalendarDays size={16} /> Open Services booking</button>{recentBookings.length > 0 && <p className="booking-hint">Booking saved in Services: {recentBookings.map((item) => item.id).join(', ')}. Enter the ID below to reference it on this Case.</p>}<div className="field manual-id-field"><label htmlFor="booking-reference">Services booking ID</label><input id="booking-reference" placeholder="For example, BOOK-501" value={bookingReference} onChange={(event) => setBookingReference(event.target.value)} /></div><button className="primary-button" onClick={recordBooking}>Record booking ID on Case</button></>}
              {serviceCase.status === 'In progress' && serviceCase.bookingReferenceId && <><p>The visit is booked and its ID is recorded. Set the Case to Waiting while the appointment is pending.</p><div className="field"><label htmlFor="waiting-reason">Waiting reason</label><select id="waiting-reason" value={waitingReason} onChange={(event) => setWaitingReason(event.target.value)}><option value="">Choose a reason</option><option value="Waiting for appointment">Waiting for appointment</option><option value="Waiting for parts">Waiting for parts</option></select></div><button className="primary-button" onClick={saveWaiting}>Move to Waiting</button></>}
              {serviceCase.status === 'Waiting' && task?.status === 'Open' && <><p>The appointment is pending. Open the technician Task to record completed work.</p><button className="primary-button" onClick={() => onOpenTask(task.id)}><Wrench size={16} /> Open technician Task</button></>}
              {serviceCase.status === 'Waiting' && task?.status === 'Completed' && <><p>The technician has completed the repair. Priya can now resolve the Case.</p><div className="field"><label htmlFor="resolution-code">Resolution code</label><select id="resolution-code" value={resolutionCode} onChange={(event) => setResolutionCode(event.target.value)}><option value="">Choose a code</option><option value="Repair completed">Repair completed</option><option value="No fault found">No fault found</option></select></div><div className="field"><label htmlFor="resolution-summary">Resolution summary</label><textarea id="resolution-summary" rows={4} value={resolutionSummary} onChange={(event) => setResolutionSummary(event.target.value)} placeholder="What was done and what was verified?" /></div><button className="primary-button" onClick={saveResolution}><CheckCircle2 size={16} /> Resolve Case</button></>}
              {serviceCase.status === 'Resolved' && !serviceCase.customerUpdateAt && <><p>Open Ravi’s conversation through his Contact and send a manual update about the repair. Then return to this Case through Related Cases and record that you sent it.</p><button className="primary-button" onClick={onOpenConversation}><MessageSquareText size={16} /> Open Ravi’s conversation</button><div className="manual-update-confirmation"><label><input type="checkbox" checked={updateConfirmed} disabled={!customerUpdateSent} onChange={(event) => setUpdateConfirmed(event.target.checked)} /> I sent Ravi a repair update in Conversations.</label><button className="secondary-button" onClick={onConfirmCustomerUpdate} disabled={!customerUpdateSent || !updateConfirmed}>Record customer updated</button><span>{customerUpdateSent ? 'The WhatsApp message is sent. Record the confirmation separately on this Case.' : 'Send the WhatsApp update first. Sending does not update this Case automatically.'}</span></div></>}
              {serviceCase.status === 'Resolved' && serviceCase.customerUpdateAt && <><p>The customer update confirmation is recorded. Close this Case to finish the journey.</p><button className="primary-button" onClick={onCloseCase}><CheckCircle2 size={16} /> Close Case</button></>}
              {serviceCase.status === 'Closed' && <p>The repair, customer update and closure are recorded on this Case.</p>}
              {formError && <span className="field-error" role="alert">{formError}</span>}
            </section>
          </div>

          <div className="draft-side-stack">
            <section className="draft-form-card"><div className="form-card-heading"><h2>Case details</h2></div><div className="detail-line"><span>Status</span><strong>{serviceCase.status}</strong></div>{serviceCase.status === 'Waiting' && <div className="detail-line"><span>Waiting reason</span><strong>{serviceCase.waitingReason}</strong></div>}<div className="detail-line"><span>Owner</span><strong>{owner?.name ?? 'Unassigned'}</strong></div><div className="detail-line"><span>Priority</span><strong>{serviceCase.priority}</strong></div><div className="detail-line"><span>Created</span><strong>{formatDateTime(serviceCase.createdAt)}</strong></div></section>
            <section className="draft-form-card"><div className="form-card-heading"><h2>Linked records</h2></div><p className="record-helper">These links are on the Case record.</p><a href="#record-preview" className="record-link" onClick={(event) => { event.preventDefault(); setPreview('contact') }}><span><small>REQUESTER · CONTACT</small><strong>{contact.name}</strong></span><ChevronRight size={17} /></a>{asset && <a href="#record-preview" className="record-link" onClick={(event) => { event.preventDefault(); setPreview('asset') }}><span><small>CUSTOMER ASSET</small><strong>{asset.id} · {asset.name}</strong></span><ChevronRight size={17} /></a>}{agreement && <a href="#record-preview" className="record-link" onClick={(event) => { event.preventDefault(); setPreview('agreement') }}><span><small>SERVICE AGREEMENT</small><strong>{agreement.id} · {agreement.name}</strong></span><ChevronRight size={17} /></a>}</section>
            {preview && <section className="record-preview" id="record-preview" aria-label="Linked record details"><div className="record-preview-heading"><span className="panel-kicker">LINKED RECORD</span><button className="icon-button" onClick={() => setPreview(null)} aria-label="Close linked record details"><X size={16} /></button></div>{preview === 'contact' && <><h3>{contact.name}</h3><p>Contact · {contact.role}</p><div>{contact.company}</div><div>{contact.phone}</div><div>{contact.email}</div></>}{preview === 'asset' && asset && <><h3>{asset.id} · {asset.name}</h3><p>Customer Asset · {asset.status}</p><div>{asset.location}</div><div>{asset.type}</div><div>{asset.company}</div><div className="asset-history"><strong>Service history</strong>{history.length ? history.map((item) => <div key={item.id}>{item.id} · {item.subject} <span>{item.status}</span></div>) : <p>No completed Cases yet.</p>}</div></>}{preview === 'agreement' && agreement && <><h3>{agreement.id} · {agreement.name}</h3><p>Service Agreement · {agreement.status}</p><div>{agreement.coverage}</div><div>Covers: {agreement.coveredAssetIds.join(', ')}</div><div>Resolution target: {agreement.resolutionTargetHours} hours</div><div>Renews {agreement.renewalDate}</div></>}</section>}
            <section className="draft-form-card"><div className="form-card-heading"><h2>Case activity</h2><span>{orderedActivities.length + 1} events</span></div><ol className="activity-list"><li><span className="activity-dot" /><strong>Case created from {serviceCase.source}</strong><small>{formatDateTime(serviceCase.createdAt)} · Priya Nair</small></li>{orderedActivities.map((item) => <li key={item.id}><span className="activity-dot" /><strong>{item.description}</strong><small>{formatDateTime(item.createdAt)} · {serviceUsers.find((user) => user.id === item.actorId)?.name ?? 'Team'}</small></li>)}</ol></section>
          </div>
        </div>
        <div className="saved-boundary"><CircleHelp size={17} /> The Task belongs to this Case. The Services booking is referenced by a manually entered ID. Ravi’s WhatsApp conversation is reached through his Contact.</div>
      </div>
    </main>
  )
}

export function BookingView({ contact, asset, createdBooking, onSave, onBack }: {
  contact: Contact
  asset: CustomerAsset
  createdBooking: ServicesBooking | null
  onSave: (scheduledAt: string, location: string) => void
  onBack: () => void
}) {
  const [scheduledAt, setScheduledAt] = useState(localDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const [location, setLocation] = useState(`${contact.company} · ${asset.location}`)
  const [error, setError] = useState('')

  function save() {
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt)) || !location.trim()) {
      setError('Choose a visit time and location.')
      return
    }
    onSave(new Date(scheduledAt).toISOString(), location.trim())
  }

  return <main className="draft-view" aria-labelledby="booking-view-title"><div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to Case</button><span className="draft-status"><span /> Services booking</span></div><div className="draft-content"><div className="draft-breadcrumb">Services <ChevronRight size={14} /> On-site visit</div><div className="draft-hero"><div className="draft-hero-icon"><CalendarDays size={24} /></div><div><span className="panel-kicker">SERVICES</span><h1 id="booking-view-title">On-site visit</h1><p>A separate booking record for {contact.name} and {asset.name}.</p></div></div><div className="standalone-card draft-form-card">{createdBooking ? <><div className="booking-success-icon"><CheckCircle2 size={23} /></div><h2>Booking created</h2><p>The Services booking has its own ID: <strong>{createdBooking.id}</strong>.</p><div className="detail-line"><span>Visit</span><strong>{formatDateTime(createdBooking.scheduledAt)}</strong></div><div className="detail-line"><span>Location</span><strong>{createdBooking.location}</strong></div><p className="booking-boundary">This booking is not linked to the Case. Return and manually record {createdBooking.id} on SC-104.</p><button className="primary-button" onClick={onBack}>Return to Case</button></> : <><div className="form-card-heading"><h2>Visit details</h2><span>Separate Services record</span></div><div className="draft-context-row"><span>Customer</span><strong>{contact.name}</strong></div><div className="draft-context-row"><span>Asset</span><strong>{asset.id} · {asset.name}</strong></div><div className="field"><label htmlFor="visit-time">Visit time</label><input id="visit-time" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></div><div className="field"><label htmlFor="visit-location">Location</label><input id="visit-location" value={location} onChange={(event) => setLocation(event.target.value)} /></div>{error && <span className="field-error" role="alert">{error}</span>}<button className="primary-button" onClick={save}><Plus size={16} /> Book on-site visit</button><p className="booking-boundary">The booking receives its own ID. It will not appear on the Case until Priya enters that ID there.</p></>}</div></div></main>
}

export function TechnicianTaskView({ task, onComplete, onBack }: { task: ServiceTask; onComplete: (note: string) => void; onBack: () => void }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const assignee = serviceUsers.find((item) => item.id === task.assigneeId)
  return <main className="draft-view" aria-labelledby="technician-task-title"><div className="draft-topbar"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to Case</button><span className="draft-status"><span /> Technician Task</span></div><div className="draft-content"><div className="draft-breadcrumb">Tasks <ChevronRight size={14} /> {task.id}</div><div className="demo-role-banner"><span className="demo-role-avatar">SR</span><div><strong>Viewing as {assignee?.name ?? 'Sanjay Rao'} · Technician</strong><span>Demo role switch · Back to Case returns to Priya Nair.</span></div></div><div className="draft-hero"><div className="draft-hero-icon"><ClipboardList size={24} /></div><div><span className="panel-kicker">{task.id} · CASE {task.caseId}</span><h1 id="technician-task-title">{task.subject}</h1><p>Assigned to {assignee?.name ?? 'Technician'} · Due {formatDateTime(task.dueAt)}</p></div></div><section className="standalone-card draft-form-card"><div className="form-card-heading"><h2>Complete the work</h2><span>Technician work note</span></div><p className="work-instruction">Record what was repaired and how cooling was verified.</p><div className="field"><label htmlFor="technician-note">Work note</label><textarea id="technician-note" rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe the repair and verification" /></div>{error && <span className="field-error" role="alert">{error}</span>}<button className="primary-button" onClick={() => { if (!note.trim()) { setError('Enter a work note before completing the Task.'); return } onComplete(note.trim()) }}><CheckCircle2 size={16} /> Complete Task</button></section></div></main>
}

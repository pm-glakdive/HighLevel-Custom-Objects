import { useEffect, useState } from 'react'
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
  canManage: boolean
  onBack: () => void
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
  serviceCase, allCases, tasks, bookings, activities, customerUpdateSent, canManage, onBack,
  onCreateTask, onOpenBooking, onRecordBooking, onSetWaiting, onOpenTask,
  onResolve, onOpenConversation, onConfirmCustomerUpdate, onCloseCase,
}: CaseJourneyProps) {
  const [preview, setPreview] = useState<RecordPreview>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')
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
  const orderedActivities = activities.filter((item) => item.caseId === serviceCase.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latestActivity = orderedActivities[0]
  const history = allCases.filter((item) => item.assetId === asset?.id && (item.status === 'Resolved' || item.status === 'Closed'))
  const recentBookings = bookings.filter((item) => item.contactId === serviceCase.contactId && item.assetId === serviceCase.assetId)
  useEffect(() => {
    setActiveTab('overview')
    setPreview(null)
  }, [serviceCase.id])
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
    <main className="draft-view case-record-view" aria-labelledby="saved-case-title">
      <div className="draft-topbar">
        <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Back to Conversations</button>
        <span className="saved-status"><span /> Service Cases · Custom module</span>
      </div>
      <div className="case-record-content">
        <div className="draft-breadcrumb">Service Cases <ChevronRight size={14} /> {serviceCase.id}</div>
        <header className="case-record-masthead">
          <div className="case-record-masthead-title">
            <span className="case-record-icon"><BriefcaseBusiness size={20} /></span>
            <div>
              <span className="panel-kicker">SERVICE CASE · {serviceCase.id}</span>
              <h1 id="saved-case-title">{serviceCase.subject}</h1>
              <div className="case-masthead-meta">
                <span className="status-pill"><span />{serviceCase.status}</span>
                <span>{serviceCase.priority} priority</span>
                <span>Owned by {owner?.name ?? 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="case-workbench">
          <aside className="case-field-inspector" aria-label="Case fields">
            <div className="case-inspector-heading"><h2>Case fields</h2><span>Custom object</span></div>
            <dl>
              <div><dt>Case ID</dt><dd>{serviceCase.id}</dd></div>
              <div><dt>Status</dt><dd>{serviceCase.status}</dd></div>
              <div><dt>Owner</dt><dd>{owner?.name ?? 'Unassigned'}</dd></div>
              <div><dt>Priority</dt><dd>{serviceCase.priority}</dd></div>
              <div><dt>Created</dt><dd>{formatDateTime(serviceCase.createdAt)}</dd></div>
              <div><dt>Source</dt><dd>{serviceCase.source}<small>Source only; no Case chat binding</small></dd></div>
              {serviceCase.waitingReason && <div><dt>Waiting reason</dt><dd>{serviceCase.waitingReason}</dd></div>}
            </dl>
            <div className="case-inspector-target">
              <Clock3 size={16} />
              <div>
                <span>RESOLUTION TARGET</span>
                <strong>{serviceCase.appliedResolutionTargetHours === null ? 'No target applied' : serviceCase.appliedResolutionTargetHours + ' hours'}</strong>
                <small>Applied snapshot on {serviceCase.id}</small>
                {serviceCase.targetResolutionAt && <small>Due {formatDateTime(serviceCase.targetResolutionAt)}</small>}
              </div>
            </div>
          </aside>

          <div className="case-workspace">
            <div className="case-record-tabs" role="tablist" aria-label="Case record sections">
              <button id="case-overview-tab" type="button" role="tab" aria-controls="case-overview-panel" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
              <button id="case-activity-tab" type="button" role="tab" aria-controls="case-activity-panel" aria-selected={activeTab === 'activity'} className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>Activity <span>{orderedActivities.length + 1}</span></button>
            </div>

            <div id="case-overview-panel" role="tabpanel" aria-labelledby="case-overview-tab" hidden={activeTab !== 'overview'} className="case-overview">
              <section className="case-issue-block">
                <span className="panel-kicker">ISSUE</span>
                <h2>The customer request</h2>
                <p>{serviceCase.description}</p>
              </section>

              {canManage && <section className="case-action-block">
                <div className="case-action-heading"><div><span className="panel-kicker">WORKFLOW</span><h2>{serviceCase.status === 'Closed' ? 'Journey complete' : 'Next step'}</h2></div><span>{serviceCase.status}</span></div>
                {(serviceCase.status === 'Open' || serviceCase.status === 'In progress') && !task && <><p>Create a Task for the technician. The Task will carry this Case ID and move an Open Case to In progress.</p><div className="field"><label htmlFor="task-subject">Task</label><input id="task-subject" value={taskSubject} onChange={(event) => setTaskSubject(event.target.value)} /></div><div className="field-pair"><div className="field"><label htmlFor="task-assignee">Assignee</label><select id="task-assignee" value={taskAssigneeId} onChange={(event) => setTaskAssigneeId(event.target.value)}>{serviceUsers.filter((item) => item.role === 'Technician').map((item) => <option key={item.id} value={item.id}>{item.name} · Technician</option>)}</select></div><div className="field"><label htmlFor="task-due">Due time</label><input id="task-due" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /></div></div><button className="primary-button" onClick={createTask}><Plus size={16} /> Create Task</button></>}
                {serviceCase.status === 'In progress' && task && !serviceCase.bookingReferenceId && <><p>Book the on-site visit in Services, then enter its ID here as a manual reference.</p><button className="secondary-button" onClick={onOpenBooking}><CalendarDays size={16} /> Open Services booking</button>{recentBookings.length > 0 && <p className="booking-hint">Booking saved in Services: {recentBookings.map((item) => item.id).join(', ')}. Enter the ID below to reference it on this Case.</p>}<div className="field manual-id-field"><label htmlFor="booking-reference">Services booking ID</label><input id="booking-reference" placeholder="For example, BOOK-501" value={bookingReference} onChange={(event) => setBookingReference(event.target.value)} /></div><button className="primary-button" onClick={recordBooking}>Record booking ID on Case</button></>}
                {serviceCase.status === 'In progress' && serviceCase.bookingReferenceId && <><p>The visit is booked and its ID is recorded. Set the Case to Waiting while the appointment is pending.</p><div className="field"><label htmlFor="waiting-reason">Waiting reason</label><select id="waiting-reason" value={waitingReason} onChange={(event) => setWaitingReason(event.target.value)}><option value="">Choose a reason</option><option value="Waiting for appointment">Waiting for appointment</option><option value="Waiting for parts">Waiting for parts</option></select></div><button className="primary-button" onClick={saveWaiting}>Move to Waiting</button></>}
                {serviceCase.status === 'Waiting' && task?.status === 'Open' && <><p>The appointment is pending. Open the technician Task to record completed work.</p><button className="primary-button" onClick={() => onOpenTask(task.id)}><Wrench size={16} /> Open technician Task</button></>}
                {serviceCase.status === 'Waiting' && task?.status === 'Completed' && <><p>The technician has completed the repair. Priya can now resolve the Case.</p><div className="field"><label htmlFor="resolution-code">Resolution code</label><select id="resolution-code" value={resolutionCode} onChange={(event) => setResolutionCode(event.target.value)}><option value="">Choose a code</option><option value="Repair completed">Repair completed</option><option value="No fault found">No fault found</option></select></div><div className="field"><label htmlFor="resolution-summary">Resolution summary</label><textarea id="resolution-summary" rows={4} value={resolutionSummary} onChange={(event) => setResolutionSummary(event.target.value)} placeholder="What was done and what was verified?" /></div><button className="primary-button" onClick={saveResolution}><CheckCircle2 size={16} /> Resolve Case</button></>}
                {serviceCase.status === 'Resolved' && !serviceCase.customerUpdateAt && <><p>Open Ravi’s conversation through his Contact and send a manual update about the repair. Then return to this Case through Related Cases and record that you sent it.</p><button className="primary-button" onClick={onOpenConversation}><MessageSquareText size={16} /> Open Ravi’s conversation</button><div className="manual-update-confirmation"><label><input type="checkbox" checked={updateConfirmed} disabled={!customerUpdateSent} onChange={(event) => setUpdateConfirmed(event.target.checked)} /> I sent Ravi a repair update in Conversations.</label><button className="secondary-button" onClick={onConfirmCustomerUpdate} disabled={!customerUpdateSent || !updateConfirmed}>Record customer updated</button><span>{customerUpdateSent ? 'The WhatsApp message is sent. Record the confirmation separately on this Case.' : 'Send the WhatsApp update first. Sending does not update this Case automatically.'}</span></div></>}
                {serviceCase.status === 'Resolved' && serviceCase.customerUpdateAt && <><p>The customer update confirmation is recorded. Close this Case to finish the journey.</p><button className="primary-button" onClick={onCloseCase}><CheckCircle2 size={16} /> Close Case</button></>}
                {serviceCase.status === 'Closed' && <p>The repair, customer update and closure are recorded on this Case.</p>}
                {formError && <span className="field-error" role="alert">{formError}</span>}
              </section>}

              {(serviceCase.status === 'Resolved' || serviceCase.status === 'Closed') && <section className="case-outcome-block">
                <div className="case-section-heading"><h2>Outcome</h2><CheckCircle2 size={18} /></div>
                <div className="detail-line"><span>Resolution code</span><strong>{serviceCase.resolutionCode}</strong></div>
                <p className="case-resolution-summary">{serviceCase.resolutionSummary}</p>
                <div className="detail-line"><span>Resolved</span><strong>{serviceCase.resolvedAt ? formatDateTime(serviceCase.resolvedAt) : '—'}</strong></div>
                {serviceCase.customerUpdateAt && <div className="update-confirmation"><CheckCircle2 size={17} /><div><strong>Customer update confirmed</strong><span>{formatDateTime(serviceCase.customerUpdateAt)} · Manually recorded by Priya</span><p>{serviceCase.customerUpdateText}</p></div></div>}
                {serviceCase.closedAt && <div className="detail-line"><span>Closed</span><strong>{formatDateTime(serviceCase.closedAt)}</strong></div>}
              </section>}

              <div className="case-relations-title"><h2>Related records &amp; work</h2><span>Case-linked context, not a contact conversation</span></div>
              <div className="case-relations-grid">
                <section className="case-related-section" aria-label="Linked records">
                  <h3>Linked records</h3>
                  <a href="#case-record-preview" className="case-related-row" onClick={(event) => { event.preventDefault(); setPreview('contact') }}><span>Requester · Contact</span><strong>{contact.name} <ChevronRight size={15} /></strong></a>
                  {asset && <a href="#case-record-preview" className="case-related-row" onClick={(event) => { event.preventDefault(); setPreview('asset') }}><span>Customer Asset</span><strong>{asset.id} · {asset.name} <ChevronRight size={15} /></strong></a>}
                  {agreement ? <a href="#case-record-preview" className="case-related-row" onClick={(event) => { event.preventDefault(); setPreview('agreement') }}><span>Service Agreement</span><strong>{agreement.id} · {agreement.name} <ChevronRight size={15} /></strong></a> : <div className="case-related-row"><span>Service Agreement</span><strong>None linked</strong></div>}
                  {preview && <div className="record-preview case-related-preview" id="case-record-preview" aria-label="Linked record details"><div className="record-preview-heading"><span className="panel-kicker">LINKED RECORD</span><button className="icon-button" onClick={() => setPreview(null)} aria-label="Close linked record details"><X size={16} /></button></div>{preview === 'contact' && <><h3>{contact.name}</h3><p>Contact · {contact.role}</p><div>{contact.company}</div><div>{contact.phone}</div><div>{contact.email}</div></>}{preview === 'asset' && asset && <><h3>{asset.id} · {asset.name}</h3><p>Customer Asset · {asset.status}</p><div>{asset.location}</div><div>{asset.type}</div><div>{asset.company}</div><div className="asset-history"><strong>Service history</strong>{history.length ? history.map((item) => <div key={item.id}>{item.id} · {item.subject} <span>{item.status}</span></div>) : <p>No completed Cases yet.</p>}</div></>}{preview === 'agreement' && agreement && <><h3>{agreement.id} · {agreement.name}</h3><p>Service Agreement · {agreement.status}</p><div>{agreement.coverage}</div><div>Covers: {agreement.coveredAssetIds.join(', ')}</div><div>Resolution target: {agreement.resolutionTargetHours} hours</div><div>Renews {agreement.renewalDate}</div></>}</div>}
                </section>

                <section className="case-related-section" aria-label="Related work">
                  <h3>Related work</h3>
                  {caseTasks.length ? caseTasks.map((item) => <div className="case-related-row" key={item.id}><span>Task · {item.id}</span><strong>{item.subject} <em className={item.status === 'Completed' ? 'task-state task-state--done' : 'task-state'}>{item.status}</em></strong><small>Assigned to {serviceUsers.find((user) => user.id === item.assigneeId)?.name ?? 'Unknown'} · Due {formatDateTime(item.dueAt)}</small>{item.completedAt && <div className="work-note"><strong>Technician work note</strong><p>{item.workNote}</p><small>Completed {formatDateTime(item.completedAt)}</small></div>}</div>) : <div className="case-related-row"><span>Tasks</span><strong>No Task created yet</strong></div>}
                  <div className="case-related-row"><span>Services booking · manual reference</span><strong>{serviceCase.bookingReferenceId ?? 'No booking ID recorded'}</strong>{serviceCase.bookingReferenceId && <small>Separate Services record; ID entered on this Case</small>}</div>
                </section>
              </div>

              <div className="case-latest-activity">
                <div><h3>Latest Case activity</h3><span>{latestActivity ? latestActivity.description : 'Case created from ' + serviceCase.source} · {formatDateTime(latestActivity?.createdAt ?? serviceCase.createdAt)}</span></div>
                <button type="button" onClick={() => setActiveTab('activity')}>View activity <ChevronRight size={15} /></button>
              </div>
            </div>

            <div id="case-activity-panel" role="tabpanel" aria-labelledby="case-activity-tab" hidden={activeTab !== 'activity'} className="case-activity-panel">
              <div className="case-activity-heading"><h2>Case activity</h2><p>A Case event log—not Ravi’s WhatsApp thread.</p></div>
              <ol className="case-event-list">
                {orderedActivities.map((item) => <li key={item.id}><strong>{item.description}</strong><small>{formatDateTime(item.createdAt)} · {serviceUsers.find((user) => user.id === item.actorId)?.name ?? 'Team'}</small></li>)}
                <li><strong>Case created from {serviceCase.source}</strong><small>{formatDateTime(serviceCase.createdAt)} · Priya Nair</small></li>
              </ol>
            </div>
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

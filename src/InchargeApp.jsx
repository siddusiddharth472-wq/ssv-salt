import React, { useState, useCallback } from 'react'
import {
    LayoutDashboard, Package, SendHorizonal, LogOut,
    AlertTriangle, CheckCircle, Clock, XCircle,
    Building2, MapPin, ChevronRight, RefreshCw,
    ClipboardList, Save, FolderOpen, Bell
} from 'lucide-react'
import {
    PRODUCTS, loadState, saveState, genId, getProduct, getBranch, fmtDate, todayISO
} from './data/store.js'
import './incharge.css'

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
    const [toasts, setToasts] = useState([])
    const show = useCallback((type, title, msg) => {
        const id = genId()
        setToasts(t => [...t, { id, type, title, msg }])
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    }, [])
    return { toasts, show }
}

function ToastContainer({ toasts }) {
    return (
        <div className="ic-toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`ic-toast ${t.type}`}>
                    <div className="ic-toast-icon">{t.type === 'success' ? '✅' : '❌'}</div>
                    <div className="ic-toast-text">
                        <h4>{t.title}</h4>
                        {t.msg && <p>{t.msg}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending: { label: 'Pending', icon: <Clock size={11} />, cls: 'pending' },
        approved: { label: 'Approved', icon: <CheckCircle size={11} />, cls: 'approved' },
        rejected: { label: 'Rejected', icon: <XCircle size={11} />, cls: 'rejected' },
    }
    const s = map[status] || map.pending
    return (
        <span className={`req-status-badge ${s.cls}`}>
            {s.icon} {s.label}
        </span>
    )
}

// ─── Product Pill ─────────────────────────────────────────────────────────────
function ProductPill({ productId }) {
    const p = getProduct(productId)
    if (!p) return null
    return (
        <span className="ic-product-pill" style={{ background: p.bg, color: p.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.brand} {p.size}
        </span>
    )
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function ICDashboard({ state, user, branch, onNavigate }) {
    const branchId = user.branchId
    const myStock = (state.branchStock || {})[branchId] || {}
    const myRequests = (state.stockRequests || []).filter(r => r.inchargeId === user.id)
    const pending = myRequests.filter(r => r.status === 'pending')
    const today = todayISO()

    const totalPackets = PRODUCTS.reduce((s, p) => s + (myStock[p.id] || 0), 0)

    return (
        <>
            {/* Branch header card */}
            <div className="ic-branch-header">
                <div className="ic-bh-icon"><Building2 size={24} /></div>
                <div className="ic-bh-info">
                    <p className="ic-bh-label">Your Branch</p>
                    <h2 className="ic-bh-name">{branch?.name || 'Unassigned'}</h2>
                    {branch?.location && (
                        <span className="ic-bh-loc"><MapPin size={11} /> {branch.location}</span>
                    )}
                </div>
                <div className="ic-bh-stat">
                    <div className="ic-bh-statval">{totalPackets.toLocaleString()}</div>
                    <div className="ic-bh-statlab">Total Packets</div>
                </div>
            </div>

            {/* Pending requests alert */}
            {pending.length > 0 && (
                <div className="ic-pending-banner" onClick={() => onNavigate('requests')}>
                    <Bell size={18} className="ic-pb-icon" />
                    <div className="ic-pb-text">
                        <strong>{pending.length} request{pending.length > 1 ? 's' : ''} pending</strong>
                        <span>Waiting for admin approval</span>
                    </div>
                    <ChevronRight size={16} className="ic-pb-arrow" />
                </div>
            )}

            {/* Stock grid */}
            <div className="ic-section-label">📦 Current Branch Stock</div>
            <div className="ic-stock-grid">
                {PRODUCTS.map(p => {
                    const qty = myStock[p.id] || 0
                    const isLow = qty < 100
                    return (
                        <div key={p.id} className={`ic-stock-card ${isLow ? 'low' : ''}`}
                            style={{ borderColor: isLow ? 'rgba(239,68,68,0.25)' : p.border }}>
                            <div className="ic-sc-dot" style={{ background: p.color }} />
                            <div className="ic-sc-name">{p.brand}</div>
                            <div className="ic-sc-size">{p.size}</div>
                            <div className="ic-sc-qty" style={{ color: isLow ? '#ef4444' : p.color }}>
                                {qty.toLocaleString()}
                            </div>
                            <div className="ic-sc-unit">packets</div>
                            {isLow && (
                                <div className="ic-sc-alert">
                                    <AlertTriangle size={10} /> Low stock
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Quick actions */}
            <div className="ic-section-label" style={{ marginTop: 20 }}>⚡ Quick Actions</div>
            <div className="ic-quick-grid">
                <div className="ic-quick-btn" onClick={() => onNavigate('stock')}>
                    <div className="ic-qb-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                        <RefreshCw size={20} />
                    </div>
                    <div className="ic-qb-text">
                        <h4>Update Stock</h4>
                        <p>Log current packet counts</p>
                    </div>
                    <ChevronRight size={14} className="ic-qb-arrow" />
                </div>
                <div className="ic-quick-btn" onClick={() => onNavigate('requests')}>
                    <div className="ic-qb-icon" style={{ background: 'rgba(245,193,62,0.12)', color: '#f5c13e' }}>
                        <SendHorizonal size={20} />
                    </div>
                    <div className="ic-qb-text">
                        <h4>Request Stock</h4>
                        <p>Ask admin for more packets</p>
                    </div>
                    <ChevronRight size={14} className="ic-qb-arrow" />
                </div>
            </div>

            {/* Recent requests */}
            {myRequests.length > 0 && (
                <>
                    <div className="ic-section-label" style={{ marginTop: 20 }}>🕐 Recent Requests</div>
                    <div className="ic-recent-requests">
                        {myRequests.slice(-3).reverse().map(r => {
                            const p = getProduct(r.productId)
                            return (
                                <div key={r.id} className="ic-rr-item">
                                    <div className="ic-rr-left">
                                        <ProductPill productId={r.productId} />
                                        <span className="ic-rr-qty">{r.quantity.toLocaleString()} pkts</span>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </>
    )
}

// ─── MY STOCK PAGE ────────────────────────────────────────────────────────────
function MyStockPage({ state, user, branch, onUpdate, showToast }) {
    const branchId = user.branchId
    const myStock = (state.branchStock || {})[branchId] || {}

    // Form: one product at a time
    const [form, setForm] = useState({ productId: '', newQty: '', note: '' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const selectedProduct = getProduct(form.productId)
    const currentQty = form.productId ? (myStock[form.productId] || 0) : 0
    const newQty = parseInt(form.newQty) || 0
    const diff = newQty - currentQty

    function handleSubmit(e) {
        e.preventDefault()
        if (!form.productId) { showToast('error', 'Select a product', ''); return }
        if (form.newQty === '') { showToast('error', 'Enter new quantity', ''); return }
        if (newQty < 0) { showToast('error', 'Invalid quantity', 'Cannot be negative.'); return }

        const logEntry = {
            id: genId(), date: todayISO(),
            inchargeId: user.id, branchId,
            productId: form.productId,
            previousQty: currentQty, newQty,
            note: form.note
        }

        const newBranchStock = {
            ...state.branchStock,
            [branchId]: { ...myStock, [form.productId]: newQty }
        }

        onUpdate({
            ...state,
            branchStock: newBranchStock,
            stockUpdateLog: [...(state.stockUpdateLog || []), logEntry]
        })

        const diffStr = diff > 0 ? `+${diff}` : `${diff}`
        showToast('success', 'Stock Updated!',
            `${selectedProduct.fullName} (${selectedProduct.size}): ${currentQty} → ${newQty} (${diffStr})`)
        setForm({ productId: '', newQty: '', note: '' })
    }

    // Update log for this branch
    const myLog = (state.stockUpdateLog || [])
        .filter(e => e.branchId === branchId)
        .sort((a, b) => b.id.localeCompare(a.id))

    return (
        <div className="ic-two-col">
            {/* Update form */}
            <form className="ic-card" onSubmit={handleSubmit}>
                <div className="ic-card-title"><RefreshCw size={17} /> Update Branch Stock</div>
                <div className="ic-card-sub">Log your current packet count for any product</div>

                {/* Current stock overview */}
                <div className="ic-current-stock-preview">
                    {PRODUCTS.map(p => (
                        <div key={p.id}
                            className={`ic-csp-row ${form.productId === p.id ? 'selected' : ''}`}
                            onClick={() => set('productId', p.id)}
                            style={{ borderColor: form.productId === p.id ? p.color : 'transparent' }}>
                            <div className="ic-csp-dot" style={{ background: p.color }} />
                            <div className="ic-csp-name">
                                <span>{p.brand}</span>
                                <span className="ic-csp-size">{p.size}</span>
                            </div>
                            <div className="ic-csp-qty" style={{ color: p.color }}>
                                {(myStock[p.id] || 0).toLocaleString()} pkts
                            </div>
                        </div>
                    ))}
                </div>

                {selectedProduct && (
                    <>
                        <div className="ic-divider" />

                        <div className="ic-form-group">
                            <label className="ic-form-label">
                                New Count for {selectedProduct.fullName} ({selectedProduct.size})
                            </label>
                            <input className="ic-form-control" type="number" min="0"
                                placeholder={`Current: ${currentQty.toLocaleString()} packets`}
                                value={form.newQty}
                                onChange={e => set('newQty', e.target.value)}
                                autoFocus />
                        </div>

                        {form.newQty !== '' && (
                            <div className={`ic-diff-preview ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'}`}>
                                <div className="ic-diff-row">
                                    <span>Previous</span><strong>{currentQty.toLocaleString()}</strong>
                                </div>
                                <div className="ic-diff-row">
                                    <span>New count</span><strong>{newQty.toLocaleString()}</strong>
                                </div>
                                <div className="ic-diff-row change">
                                    <span>Change</span>
                                    <strong style={{ color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : 'var(--text-sub)' }}>
                                        {diff > 0 ? '+' : ''}{diff} packets
                                    </strong>
                                </div>
                            </div>
                        )}

                        <div className="ic-form-group">
                            <label className="ic-form-label">Reason / Note <span className="ic-optional">(optional)</span></label>
                            <input className="ic-form-control" type="text"
                                placeholder="e.g. End of day count, after dispatch"
                                value={form.note} onChange={e => set('note', e.target.value)} />
                        </div>

                        <button className="ic-submit-btn" type="submit"
                            disabled={form.newQty === '' || newQty < 0}>
                            <Save size={15} /> Save Stock Update
                        </button>
                    </>
                )}

                {!selectedProduct && (
                    <div className="ic-select-hint">
                        👆 Tap a product above to update its count
                    </div>
                )}
            </form>

            {/* Update log */}
            <div className="ic-card">
                <div className="ic-card-title"><ClipboardList size={17} /> Update History</div>
                <div className="ic-card-sub">All stock updates for your branch</div>

                {myLog.length === 0 ? (
                    <div className="ic-empty-state">
                        <FolderOpen size={36} />
                        <p>No updates yet.<br />Start logging your stock counts.</p>
                    </div>
                ) : (
                    <div className="ic-log-list">
                        {myLog.map(e => {
                            const d = e.newQty - e.previousQty
                            return (
                                <div key={e.id} className="ic-log-item">
                                    <div className="ic-log-left">
                                        <ProductPill productId={e.productId} />
                                        <div className="ic-log-meta">
                                            <span className="ic-log-date">{fmtDate(e.date)}</span>
                                            {e.note && <span className="ic-log-note">"{e.note}"</span>}
                                        </div>
                                    </div>
                                    <div className="ic-log-right">
                                        <span className="ic-log-prev">{e.previousQty.toLocaleString()}</span>
                                        <span className="ic-log-arrow">→</span>
                                        <span className="ic-log-new">{e.newQty.toLocaleString()}</span>
                                        <span className={`ic-log-diff ${d > 0 ? 'up' : d < 0 ? 'down' : ''}`}>
                                            {d > 0 ? '+' : ''}{d}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── REQUEST STOCK PAGE ───────────────────────────────────────────────────────
function RequestStockPage({ state, user, branch, onUpdate, showToast }) {
    const [form, setForm] = useState({ productId: '', quantity: '', note: '', urgency: 'normal' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const qty = parseInt(form.quantity) || 0
    const myRequests = (state.stockRequests || [])
        .filter(r => r.inchargeId === user.id)
        .sort((a, b) => b.id.localeCompare(a.id))

    const hasPendingForProduct = form.productId &&
        myRequests.some(r => r.productId === form.productId && r.status === 'pending')

    function handleSubmit(e) {
        e.preventDefault()
        if (!form.productId) { showToast('error', 'Select a product', ''); return }
        if (qty <= 0) { showToast('error', 'Enter quantity needed', ''); return }
        if (hasPendingForProduct) {
            showToast('error', 'Already Pending', 'You already have a pending request for this product.')
            return
        }

        const entry = {
            id: genId(),
            date: todayISO(), createdAt: todayISO(),
            inchargeId: user.id,
            branchId: user.branchId,
            productId: form.productId,
            quantity: qty,
            note: form.note,
            urgency: form.urgency,
            status: 'pending',
        }

        onUpdate({ ...state, stockRequests: [...(state.stockRequests || []), entry] })
        const p = getProduct(form.productId)
        showToast('success', 'Request Sent!',
            `Requested ${qty.toLocaleString()} packets of ${p.fullName} (${p.size}). Admin will review soon.`)
        setForm({ productId: '', quantity: '', note: '', urgency: 'normal' })
    }

    const pendingCount = myRequests.filter(r => r.status === 'pending').length
    const approvedCount = myRequests.filter(r => r.status === 'approved').length
    const rejectedCount = myRequests.filter(r => r.status === 'rejected').length

    return (
        <div className="ic-two-col">
            {/* Request form */}
            <form className="ic-card" onSubmit={handleSubmit}>
                <div className="ic-card-title"><SendHorizonal size={17} /> Request Stock</div>
                <div className="ic-card-sub">Submit a request to the admin for more packets</div>

                <div className="ic-form-group">
                    <label className="ic-form-label">Product</label>
                    <select className="ic-form-control" value={form.productId}
                        onChange={e => set('productId', e.target.value)}>
                        <option value="">— Select product —</option>
                        {PRODUCTS.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.fullName} ({p.size})
                            </option>
                        ))}
                    </select>
                    {hasPendingForProduct && (
                        <p className="ic-field-warn">
                            ⚠ You already have a pending request for this product
                        </p>
                    )}
                </div>

                <div className="ic-form-group">
                    <label className="ic-form-label">Quantity Needed (packets)</label>
                    <input className="ic-form-control" type="number" min="1"
                        placeholder="e.g. 500"
                        value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>

                <div className="ic-form-group">
                    <label className="ic-form-label">Urgency</label>
                    <div className="ic-urgency-row">
                        {[
                            { val: 'normal', label: '🟢 Normal', desc: 'Within a week' },
                            { val: 'urgent', label: '🟠 Urgent', desc: '1–2 days' },
                            { val: 'critical', label: '🔴 Critical', desc: 'Today' },
                        ].map(u => (
                            <div key={u.val}
                                className={`ic-urgency-btn ${form.urgency === u.val ? 'active' : ''}`}
                                onClick={() => set('urgency', u.val)}>
                                <span>{u.label}</span>
                                <span className="ic-urgency-desc">{u.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ic-form-group">
                    <label className="ic-form-label">Note to Admin <span className="ic-optional">(optional)</span></label>
                    <textarea className="ic-form-control" rows={3}
                        placeholder="e.g. Stock nearly out, urgent restock needed before Friday"
                        value={form.note} onChange={e => set('note', e.target.value)} />
                </div>

                <button className="ic-submit-btn gold" type="submit"
                    disabled={!form.productId || qty <= 0 || hasPendingForProduct}>
                    <SendHorizonal size={15} /> Send Request to Admin
                </button>
            </form>

            {/* Request list */}
            <div className="ic-card">
                <div className="ic-card-title"><ClipboardList size={17} /> My Requests</div>

                {/* Stats row */}
                <div className="ic-req-stats">
                    <div className="ic-rs-item pending"><Clock size={13} /> {pendingCount} Pending</div>
                    <div className="ic-rs-item approved"><CheckCircle size={13} /> {approvedCount} Approved</div>
                    <div className="ic-rs-item rejected"><XCircle size={13} /> {rejectedCount} Rejected</div>
                </div>

                {myRequests.length === 0 ? (
                    <div className="ic-empty-state">
                        <SendHorizonal size={36} />
                        <p>No requests yet.<br />Request stock from the admin anytime.</p>
                    </div>
                ) : (
                    <div className="ic-req-list">
                        {myRequests.map(r => {
                            const urgencyColors = {
                                normal: { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                                urgent: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                                critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                            }
                            const uc = urgencyColors[r.urgency] || urgencyColors.normal
                            return (
                                <div key={r.id} className={`ic-req-item ${r.status}`}>
                                    <div className="ic-req-top">
                                        <ProductPill productId={r.productId} />
                                        <StatusBadge status={r.status} />
                                    </div>
                                    <div className="ic-req-body">
                                        <div className="ic-req-qty">
                                            {r.quantity.toLocaleString()} packets requested
                                        </div>
                                        <div className="ic-req-date">{fmtDate(r.createdAt)}</div>
                                    </div>
                                    {r.urgency && r.urgency !== 'normal' && (
                                        <div className="ic-req-urgency"
                                            style={{ color: uc.color, background: uc.bg }}>
                                            {r.urgency === 'urgent' ? '🟠 Urgent' : '🔴 Critical'}
                                        </div>
                                    )}
                                    {r.note && (
                                        <div className="ic-req-note">💬 "{r.note}"</div>
                                    )}
                                    {r.adminNote && (
                                        <div className="ic-req-admin-note">
                                            <strong>Admin:</strong> {r.adminNote}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── INCHARGE APP SHELL ───────────────────────────────────────────────────────
export default function InchargeApp({ user, branch, onLogout }) {
    const [page, setPage] = useState('dashboard')
    const [state, setState] = useState(() => loadState())
    const { toasts, show: showToast } = useToast()

    function handleUpdate(newState) {
        setState(newState)
        saveState(newState)
    }

    // Re-resolve branch in case it was updated
    const currentBranch = getBranch(state.branches, user.branchId) || branch

    const PAGES = {
        dashboard: { label: 'Dashboard', icon: LayoutDashboard },
        stock: { label: 'My Stock', icon: Package },
        requests: { label: 'Requests', icon: SendHorizonal },
    }

    const meta = PAGES[page]

    const myPendingCount = (state.stockRequests || [])
        .filter(r => r.inchargeId === user.id && r.status === 'pending').length

    return (
        <div className="ic-shell">
            <ToastContainer toasts={toasts} />

            {/* ── HEADER ── */}
            <header className="ic-header">
                <div className="ic-header-left">
                    <div className="ic-header-logo">🧂</div>
                    <div className="ic-header-brand">
                        <span className="ic-header-title">SSV SALT</span>
                        <span className="ic-header-sub">Incharge Portal</span>
                    </div>
                </div>

                <nav className="ic-top-nav">
                    {Object.entries(PAGES).map(([id, { label, icon: Icon }]) => (
                        <button key={id}
                            className={`ic-nav-btn ${page === id ? 'active' : ''}`}
                            onClick={() => setPage(id)}>
                            <Icon size={15} />
                            <span>{label}</span>
                            {id === 'requests' && myPendingCount > 0 && (
                                <span className="ic-nav-badge">{myPendingCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="ic-header-right">
                    <div className="ic-user-chip">
                        <div className="ic-user-avatar">
                            {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ic-user-info">
                            <span className="ic-user-name">{user.name}</span>
                            <span className="ic-user-branch">{currentBranch?.name || 'No branch'}</span>
                        </div>
                    </div>
                    <button className="ic-logout-btn" onClick={onLogout} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* ── PAGE CONTENT ── */}
            <main className="ic-main">
                <div className="ic-page-header">
                    <h1 className="ic-page-title">{meta.label}</h1>
                    {currentBranch && (
                        <span className="ic-page-branch">
                            <Building2 size={12} /> {currentBranch.name}
                            {currentBranch.location && <> · <MapPin size={11} /> {currentBranch.location}</>}
                        </span>
                    )}
                </div>

                <div className="ic-page-content">
                    {page === 'dashboard' && (
                        <ICDashboard
                            state={state} user={user} branch={currentBranch}
                            onNavigate={setPage}
                        />
                    )}
                    {page === 'stock' && (
                        <MyStockPage
                            state={state} user={user} branch={currentBranch}
                            onUpdate={handleUpdate} showToast={showToast}
                        />
                    )}
                    {page === 'requests' && (
                        <RequestStockPage
                            state={state} user={user} branch={currentBranch}
                            onUpdate={handleUpdate} showToast={showToast}
                        />
                    )}
                </div>
            </main>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav className="ic-mobile-nav">
                {Object.entries(PAGES).map(([id, { label, icon: Icon }]) => (
                    <button key={id}
                        className={`ic-mob-item ${page === id ? 'active' : ''}`}
                        onClick={() => setPage(id)}>
                        {id === 'requests' && myPendingCount > 0 && (
                            <span className="ic-mob-badge">{myPendingCount}</span>
                        )}
                        <Icon size={21} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </div>
    )
}

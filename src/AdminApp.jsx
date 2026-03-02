import React, { useState, useCallback } from 'react'
import {
    LayoutDashboard, PackagePlus, Factory, PackageMinus,
    FileBarChart2, Settings, LogOut, Menu, Bell,
    AlertTriangle, TrendingUp, Package, ArrowDownToLine,
    ArrowUpFromLine, Boxes, ChevronRight, RotateCcw,
    CheckCircle, Save, Trash2, Users, Building2, MapPin,
    Eye, EyeOff, UserPlus, UserX, Truck, Phone, Link2, Unlink,
    Edit2, X
} from 'lucide-react'
import {
    PRODUCTS, loadState, saveState, resetState, genId, getProduct,
    getPossibleProduction, getTotalRolls, getTotalKg, getTotalFinishedStock,
    getTotalPossiblePackets, getTotalWastage, getStockLevel, fmtDate, todayISO,
    getCurrentMaterialStock
} from './data/store.js'
import './admin.css'

// ─── Toast System ─────────────────────────────────────────────────────────────
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
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    <div className="toast-icon">{t.type === 'success' ? '✅' : '❌'}</div>
                    <div className="toast-text">
                        <h4>{t.title}</h4>
                        {t.msg && <p>{t.msg}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProductPill({ productId }) {
    const p = getProduct(productId)
    if (!p) return null
    return (
        <span className="product-pill" style={{ background: p.bg, color: p.color }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.brand} {p.size}
        </span>
    )
}

function getLowStockCount(packingRolls, thresholds) {
    return PRODUCTS.filter(p => (packingRolls[p.id] || 0) <= thresholds[p.id]).length
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function Dashboard({ state, onNavigate, activeBranch, onLogout, userName, isIncharge }) {
    // Filter logs by active branch
    const filterByBranch = (log) => activeBranch === 'all'
        ? log
        : log.filter(e => e.branchId === activeBranch)

    const inwardLog = filterByBranch(state.inwardLog)
    const productionLog = filterByBranch(state.productionLog)
    const outwardLog = filterByBranch(state.outwardLog)

    // Derived Stock from Logs (Most accurate)
    const currentStockMap = getCurrentMaterialStock(inwardLog, productionLog)
    const derivedRolls = {}
    const derivedKg = {}
    PRODUCTS.forEach(p => {
        derivedRolls[p.id] = currentStockMap[p.id].rolls
        derivedKg[p.id] = currentStockMap[p.id].kg
    })

    const possible = getPossibleProduction(derivedKg)
    const totalRolls = getTotalRolls(derivedRolls)
    const totalKg = getTotalKg(derivedKg)
    const totalFinished = getTotalFinishedStock(state.finishedStock)
    const totalPossible = getTotalPossiblePackets(derivedKg)
    const totalWastage = getTotalWastage(productionLog)
    const today = todayISO()

    const todayProduction = productionLog
        .filter(e => e.date === today)
        .reduce((s, e) => s + (e.actualPackets || e.packetsProduced || 0), 0)

    const todayWastage = productionLog
        .filter(e => e.date === today)
        .reduce((s, e) => s + (e.wastage || 0), 0)

    const allActivity = [
        ...inwardLog.map(e => ({ ...e, kind: 'inward' })),
        ...productionLog.map(e => ({ ...e, kind: 'produce' })),
        ...outwardLog.map(e => ({ ...e, kind: 'outward' })),
    ].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8)

    return (
        <>
            {/* Welcome header with logout */}
            <div className="dash-welcome-bar">
                <div className="dash-welcome-text">
                    <h3>Welcome back{userName ? `, ${userName}` : ''} 👋</h3>
                    <p>{isIncharge ? 'Incharge Dashboard' : 'Admin Dashboard'} — Here’s your overview for today</p>
                </div>
                <button className="dash-logout-btn" onClick={onLogout}>
                    <LogOut size={15} /> Logout
                </button>
            </div>

            {/* KPI Row */}
            <div className="kpi-grid">
                <div className="kpi-card-admin teal">
                    <div className="kpi-icon-wrap teal"><Package size={20} /></div>
                    <div className="kpi-label">Total Material</div>
                    <div className="kpi-value">{totalKg.toLocaleString()} kg</div>
                    <div className="kpi-sub">{totalRolls.toLocaleString()} rolls available</div>
                </div>
                <div className="kpi-card-admin blue">
                    <div className="kpi-icon-wrap blue"><Factory size={20} /></div>
                    <div className="kpi-label">Possible Production</div>
                    <div className="kpi-value">{totalPossible.toLocaleString()}</div>
                    <div className="kpi-sub">packets from current rolls</div>
                </div>
                <div className="kpi-card-admin green">
                    <div className="kpi-icon-wrap green"><Boxes size={20} /></div>
                    <div className="kpi-label">Finished Stock</div>
                    <div className="kpi-value">{totalFinished.toLocaleString()}</div>
                    <div className="kpi-sub">packets ready to dispatch</div>
                </div>
                <div className="kpi-card-admin cyan">
                    <div className="kpi-icon-wrap cyan"><TrendingUp size={20} /></div>
                    <div className="kpi-label">Today's Production</div>
                    <div className="kpi-value">{todayProduction.toLocaleString()}</div>
                    <div className="kpi-sub">actual packets produced today</div>
                </div>
            </div>

            {/* Wastage Banner — shown prominently if any wastage today */}
            {todayWastage > 0 && (
                <div className="wastage-banner">
                    <div className="wastage-banner-icon"><AlertTriangle size={20} /></div>
                    <div className="wastage-banner-text">
                        <strong>Today's Wastage: {todayWastage.toLocaleString()} packets</strong>
                        <span>Packets lost due to roll inefficiency today — review production records</span>
                    </div>
                    <div className="wastage-banner-total">
                        All-time wastage: <strong>{totalWastage.toLocaleString()}</strong> pkts
                    </div>
                </div>
            )}

            {/* Product Stock Cards */}
            <div className="ic-section-label" style={{ marginBottom: 12 }}>
                Product Stock Overview
            </div>
            <div className="products-grid">
                {PRODUCTS.map(p => {
                    const rolls = derivedRolls[p.id] || 0
                    const weight = derivedKg[p.id] || 0
                    const finished = state.finishedStock[p.id] || 0
                    const poss = possible[p.id] || 0
                    const threshold = state.alertThresholds[p.id] || 50
                    const level = getStockLevel(rolls, threshold)
                    const maxRolls = Math.max(rolls + 200, 500)
                    const pct = Math.min((rolls / maxRolls) * 100, 100)

                    // per-product wastage
                    const productWastage = productionLog
                        .filter(e => e.productId === p.id)
                        .reduce((s, e) => s + (e.wastage || 0), 0)

                    return (
                        <div key={p.id} className={`product-stock-card ${level === 'critical' || level === 'empty' ? 'critical' : level === 'low' ? 'low' : ''}`}>
                            <div className="psc-header">
                                <div className="psc-brand-dot" style={{ background: p.color }} />
                                <div className="psc-title">
                                    <h3>{p.fullName}</h3>
                                    <p>{p.size} packets — {p.rollRatio} pkts/roll</p>
                                </div>
                                <span className="psc-size-badge" style={{ background: p.bg, color: p.color }}>{p.size}</span>
                            </div>

                            {(level === 'critical' || level === 'empty') && (
                                <div className="stock-alert-chip critical"><AlertTriangle size={12} /> CRITICAL — Packing rolls very low!</div>
                            )}
                            {level === 'low' && (
                                <div className="stock-alert-chip low"><AlertTriangle size={12} /> LOW STOCK — Consider restocking rolls</div>
                            )}
                            {level === 'good' && (
                                <div className="stock-alert-chip good"><CheckCircle size={12} /> Roll stock healthy</div>
                            )}

                            <div className="psc-stats">
                                <div className="psc-stat">
                                    <div className="psc-stat-val" style={{ color: p.color }}>{rolls.toLocaleString()}</div>
                                    <div className="psc-stat-lbl">Rolls</div>
                                </div>
                                <div className="psc-stat">
                                    <div className="psc-stat-val" style={{ color: '#f5c13e' }}>{weight.toLocaleString()} kg</div>
                                    <div className="psc-stat-lbl">Weight</div>
                                </div>
                                <div className="psc-stat">
                                    <div className="psc-stat-val">{poss.toLocaleString()}</div>
                                    <div className="psc-stat-lbl">Capacity</div>
                                </div>
                                <div className="psc-stat">
                                    <div className="psc-stat-val" style={{ color: '#10b981' }}>{finished.toLocaleString()}</div>
                                    <div className="psc-stat-lbl">Finished</div>
                                </div>
                            </div>

                            {productWastage > 0 && (
                                <div className="psc-wastage-row">
                                    <Trash2 size={11} />
                                    Total wastage: <strong>{productWastage.toLocaleString()} packets</strong>
                                </div>
                            )}

                            <div className="psc-progress-wrap">
                                <div className="psc-progress-label">
                                    <span>Roll stock ({rolls} rolls)</span>
                                    <span>Alert at {threshold}</span>
                                </div>
                                <div className="psc-progress-bar">
                                    <div className="psc-progress-fill" style={{
                                        width: `${pct}%`,
                                        background: level === 'good' ? p.color : level === 'low' ? '#f59e0b' : '#ef4444'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Bottom: Activity + Quick Actions */}
            <div className="bottom-grid">
                <div className="a-card">
                    <div className="activity-feed-header">
                        <div>
                            <div className="activity-feed-title">Recent Activity</div>
                            <div className="activity-feed-sub">Latest inward, production & outward entries</div>
                        </div>
                    </div>
                    {allActivity.length === 0 ? (
                        <div className="empty-state"><p>No activity yet. Start adding stock!</p></div>
                    ) : allActivity.map(a => {
                        const p = getProduct(a.productId)
                        const actual = a.actualPackets ?? a.packetsProduced
                        const wastage = a.wastage || 0
                        return (
                            <div key={a.id} className="activity-item">
                                <div className={`activity-icon ${a.kind}`}>
                                    {a.kind === 'inward' && '📥'}
                                    {a.kind === 'produce' && '🏭'}
                                    {a.kind === 'outward' && '📤'}
                                </div>
                                <div className="activity-body">
                                    <h4>
                                        {a.kind === 'inward' && `+${a.quantity} packing rolls received`}
                                        {a.kind === 'produce' && `${actual?.toLocaleString()} packets produced${wastage > 0 ? ` (⚠ ${wastage} wasted)` : ''}`}
                                        {a.kind === 'outward' && `${a.packets?.toLocaleString()} packets dispatched`}
                                    </h4>
                                    <p>{p?.fullName} — {p?.size}</p>
                                </div>
                                <div className="activity-time">{fmtDate(a.date)}</div>
                            </div>
                        )
                    })}
                </div>

                <div className="a-card">
                    <div className="qa-title">Quick Actions</div>
                    <div className="quick-actions-grid">
                        {[
                            { icon: '📥', label: 'Record Inward', sub: 'Add packing rolls received', page: 'inward', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                            { icon: '🏭', label: 'Record Production', sub: 'Enter today\'s production', page: 'production', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                            { icon: '📤', label: 'Record Outward', sub: 'Dispatch finished packets', page: 'outward', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                            { icon: '📋', label: 'View Reports', sub: 'Full history & analytics', page: 'reports', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                        ].map(a => (
                            <div key={a.page} className="qa-btn" onClick={() => onNavigate(a.page)}>
                                <div className="qa-btn-icon" style={{ background: a.bg, color: a.color, fontSize: '1.1rem' }}>{a.icon}</div>
                                <div className="qa-btn-text"><h4>{a.label}</h4><p>{a.sub}</p></div>
                                <ChevronRight size={16} style={{ color: 'var(--text-sub)', opacity: 0.5, marginLeft: 'auto' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── INWARD PAGE ──────────────────────────────────────────────────────────────
function InwardPage({ state, onUpdate, showToast, activeBranch }) {
    const [form, setForm] = useState({
        productId: '', quantity: '', kgPerRoll: '', vendorName: '',
        invoiceMode: 'text', invoiceNumber: '', invoicePhoto: '',
        notes: '', date: todayISO()
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const product = getProduct(form.productId)
    const qty = parseInt(form.quantity) || 0
    const kgPerRoll = parseFloat(form.kgPerRoll) || 0
    const totalKg = kgPerRoll * qty

    // Derived Stock for accurate preview
    const currentStockMap = getCurrentMaterialStock(state.inwardLog, state.productionLog)
    const currentWeight = form.productId ? (currentStockMap[form.productId]?.kg || 0) : 0
    const currentRolls = form.productId ? (currentStockMap[form.productId]?.rolls || 0) : 0

    function handlePhotoUpload(e) {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { showToast('error', 'File Too Large', 'Invoice photo must be under 5 MB.'); return }
        const reader = new FileReader()
        reader.onload = ev => set('invoicePhoto', ev.target.result)
        reader.readAsDataURL(file)
    }

    function handleSubmit(e) {
        e.preventDefault()
        if (!form.productId || kgPerRoll <= 0 || qty <= 0) { showToast('error', 'Invalid Input', 'Please select a product and enter KG per roll and number of rolls.'); return }
        if (!form.vendorName.trim()) { showToast('error', 'Invalid Input', 'Please enter the vendor/supplier name.'); return }
        const newEntry = {
            id: genId(),
            date: form.date,
            productId: form.productId,
            quantity: qty,
            kgPerRoll: kgPerRoll,
            quantityKg: totalKg,
            totalKg: totalKg,
            vendorName: form.vendorName.trim(),
            invoiceNumber: form.invoiceMode === 'text' ? form.invoiceNumber.trim() : '',
            invoicePhoto: form.invoiceMode === 'photo' ? form.invoicePhoto : '',
            notes: form.notes,
            branchId: activeBranch !== 'all' ? activeBranch : undefined,
        }
        const newState = { ...state }
        newState.inwardLog = [...state.inwardLog, newEntry]
        // ✅ Dual Stock Tracking: Rolls count and Total Weight (KG)
        newState.packingRolls = { ...state.packingRolls, [form.productId]: (state.packingRolls[form.productId] || 0) + qty }
        newState.packingKg = { ...state.packingKg, [form.productId]: (state.packingKg[form.productId] || 0) + totalKg }
        onUpdate(newState)
        showToast('success', 'Inward Recorded!', `${totalKg.toLocaleString()} kg (${qty} rolls) from ${form.vendorName.trim()} added.`)
        setForm({ productId: '', quantity: '', kgPerRoll: '', vendorName: '', invoiceMode: 'text', invoiceNumber: '', invoicePhoto: '', notes: '', date: todayISO() })
    }

    const sortedLog = [...state.inwardLog]
        .filter(e => activeBranch === 'all' || e.branchId === activeBranch)
        .sort((a, b) => b.id.localeCompare(a.id))
    const [viewPhoto, setViewPhoto] = useState(null)

    return (
        <div className="form-page-grid">
            {/* Photo Lightbox */}
            {viewPhoto && (
                <div className="invoice-lightbox" onClick={() => setViewPhoto(null)}>
                    <div className="invoice-lightbox-inner" onClick={e => e.stopPropagation()}>
                        <button className="invoice-lightbox-close" onClick={() => setViewPhoto(null)}>✕</button>
                        <img src={viewPhoto} alt="Invoice" />
                    </div>
                </div>
            )}

            <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-card-title">📥 Record Inward</div>
                <div className="form-card-sub">Add packing rolls received from supplier</div>

                <div className="a-form-group">
                    <label className="a-form-label">Product</label>
                    <select className="a-form-control" value={form.productId} onChange={e => set('productId', e.target.value)}>
                        <option value="">— Select product —</option>
                        {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.size})</option>)}
                    </select>
                </div>

                {/* PRIMARY: KG per roll */}
                <div className="a-form-group">
                    <label className="a-form-label">Weight Per Roll (KG)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="a-form-control"
                            type="number" min="0.1" step="0.1"
                            placeholder="e.g. 54"
                            value={form.kgPerRoll}
                            onChange={e => set('kgPerRoll', e.target.value)}
                            style={{ paddingRight: 44 }}
                        />
                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 700, pointerEvents: 'none' }}>KG</span>
                    </div>
                </div>

                {/* SECONDARY: Rolls count */}
                <div className="a-form-group">
                    <label className="a-form-label">Number of Rolls</label>
                    <input className="a-form-control" type="number" min="1" placeholder="e.g. 45" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>

                {/* Total KG calculation */}
                {kgPerRoll > 0 && qty > 0 && (
                    <div className="total-kg-display">
                        <span className="total-kg-label">Total KG</span>
                        <span className="total-kg-formula">{kgPerRoll} kg × {qty} rolls</span>
                        <span className="total-kg-value">= {totalKg.toLocaleString()} KG</span>
                    </div>
                )}

                <div className="a-form-group">
                    <label className="a-form-label">Vendor / Supplier Name</label>
                    {(state.vendors || []).length === 0 ? (
                        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: '0.78rem', color: '#f59e0b' }}>
                            ⚠ No vendors found. Go to the <strong>Vendors</strong> page to add one first.
                        </div>
                    ) : (
                        <select
                            className="a-form-control"
                            value={form.vendorName}
                            onChange={e => set('vendorName', e.target.value)}
                        >
                            <option value="">— Select vendor —</option>
                            {(state.vendors || []).map(v => (
                                <option key={v.id} value={v.name}>{v.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Invoice Section */}
                <div className="a-form-group">
                    <label className="a-form-label">Invoice</label>
                    <div className="invoice-mode-toggle">
                        <button type="button"
                            className={`inv-mode-btn ${form.invoiceMode === 'text' ? 'active' : ''}`}
                            onClick={() => set('invoiceMode', 'text')}
                        >🔢 Enter Invoice No.</button>
                        <button type="button"
                            className={`inv-mode-btn ${form.invoiceMode === 'photo' ? 'active' : ''}`}
                            onClick={() => set('invoiceMode', 'photo')}
                        >📷 Upload Photo</button>
                    </div>
                    {form.invoiceMode === 'text' ? (
                        <input
                            className="a-form-control" style={{ marginTop: 10 }}
                            type="text"
                            placeholder="e.g. INV-2026-0042"
                            value={form.invoiceNumber}
                            onChange={e => set('invoiceNumber', e.target.value)}
                        />
                    ) : (
                        <div style={{ marginTop: 10 }}>
                            {form.invoicePhoto ? (
                                <div className="invoice-thumb-wrap">
                                    <img src={form.invoicePhoto} alt="Invoice preview" className="invoice-thumb" />
                                    <div className="invoice-thumb-actions">
                                        <button type="button" className="inv-thumb-btn view" onClick={() => setViewPhoto(form.invoicePhoto)}>🔍 View</button>
                                        <button type="button" className="inv-thumb-btn remove" onClick={() => set('invoicePhoto', '')}>✕ Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <label className="invoice-upload-zone">
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                                    <div className="invoice-upload-icon">📄</div>
                                    <div className="invoice-upload-text">Click to upload invoice photo</div>
                                    <div className="invoice-upload-hint">JPG, PNG, HEIC — max 5 MB</div>
                                </label>
                            )}
                        </div>
                    )}
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Date</label>
                    <input className="a-form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Notes (optional)</label>
                    <input className="a-form-control" type="text" placeholder="e.g. Monthly purchase" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>

                {product && totalKg > 0 && (
                    <div className="calc-preview">
                        <div className="calc-preview-title">📊 Preview</div>
                        <div className="calc-row"><span className="calc-row-label">Current Weight</span><span className="calc-row-val">{currentWeight.toLocaleString()} kg</span></div>
                        <div className="calc-row"><span className="calc-row-label">Adding Weight</span><span className="calc-row-val green">+{totalKg.toLocaleString()} kg</span></div>
                        <div className="calc-row"><span className="calc-row-label">New Total Rolls</span><span className="calc-row-val highlight">{currentRolls + qty} rolls</span></div>
                        <div className="calc-row"><span className="calc-row-label">Max Packets Possible</span><span className="calc-row-val">~{((currentWeight + totalKg) * product.kgRatio).toLocaleString()} pkts</span></div>
                    </div>
                )}

                <button className="a-submit-btn" type="submit" disabled={!form.productId || kgPerRoll <= 0 || qty <= 0}>
                    <ArrowDownToLine size={16} /> Save Inward Entry
                </button>
            </form>

            <div className="history-card">
                <div className="history-card-header">
                    <div><h3>Inward History</h3><p>{sortedLog.length} entries total</p></div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="a-table">
                        <thead><tr><th>Date</th><th>Product</th><th>KG/Roll</th><th>Rolls</th><th>Total KG</th><th>Vendor</th><th>Invoice</th><th>Notes</th></tr></thead>
                        <tbody>
                            {sortedLog.length === 0
                                ? <tr><td colSpan={8}><div className="empty-state"><p>No inward records yet.</p></div></td></tr>
                                : sortedLog.map(r => (
                                    <tr key={r.id}>
                                        <td>{fmtDate(r.date)}</td>
                                        <td><ProductPill productId={r.productId} /></td>
                                        <td style={{ color: 'var(--text-sub)', fontWeight: 600 }}>{r.kgPerRoll ? `${r.kgPerRoll} kg` : r.quantityKg && r.quantity ? `${(r.quantityKg / r.quantity).toFixed(1)} kg` : '—'}</td>
                                        <td style={{ color: '#10b981', fontWeight: 600 }}>{r.quantity ? `${r.quantity}` : '—'}</td>
                                        <td className="bold" style={{ color: 'var(--text-main)' }}>+{r.totalKg ? `${r.totalKg} kg` : r.quantityKg ? `${r.quantityKg} kg` : '—'}</td>
                                        <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{r.vendorName || '—'}</td>
                                        <td>
                                            {r.invoicePhoto
                                                ? <button type="button" className="inv-view-btn" onClick={() => setViewPhoto(r.invoicePhoto)}>📷 View</button>
                                                : r.invoiceNumber
                                                    ? <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '0.8rem' }}>#{r.invoiceNumber}</span>
                                                    : <span style={{ color: 'var(--text-sub)', opacity: 0.3 }}>—</span>
                                            }
                                        </td>
                                        <td>{r.notes || '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ─── PRODUCTION PAGE ──────────────────────────────────────────────────────────
function ProductionPage({ state, onUpdate, showToast, activeBranch }) {
    const [form, setForm] = useState({
        productId: '', rollsUsed: '', kgPerRoll: '', actualPackets: '', notes: '', date: todayISO()
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    // Default KG per roll if not entered
    const product = getProduct(form.productId)
    const rollsCount = parseInt(form.rollsUsed) || 0
    const kgPerRollUsed = parseFloat(form.kgPerRoll) || (product?.defaultKgPerRoll || 0)

    const weightUsed = rollsCount * kgPerRollUsed
    const expectedPackets = product ? Math.round(weightUsed * product.kgRatio) : 0
    const actualPackets = parseInt(form.actualPackets) || 0

    const wastage = expectedPackets > 0 ? Math.max(0, expectedPackets - actualPackets) : 0

    // Derived Stock for accurate validation
    const currentStockMap = getCurrentMaterialStock(state.inwardLog, state.productionLog)
    const availRolls = product ? (currentStockMap[form.productId]?.rolls || 0) : 0
    const availKg = product ? (currentStockMap[form.productId]?.kg || 0) : 0

    const notEnoughRolls = rollsCount > availRolls
    const overInput = actualPackets > expectedPackets && expectedPackets > 0

    function handleSubmit(e) {
        e.preventDefault()
        if (!form.productId || rollsCount <= 0) { showToast('error', 'Invalid Input', 'Select product and enter rolls used.'); return }
        if (notEnoughRolls) { showToast('error', 'Not Enough Rolls', `Only ${availRolls} rolls in stock.`); return }
        if (actualPackets <= 0) { showToast('error', 'Invalid Input', 'Enter actual packets produced.'); return }
        if (overInput) { showToast('error', 'Invalid Quantity', `Actual packets (${actualPackets}) cannot exceed expected (${expectedPackets.toLocaleString()}).`); return }

        const newState = { ...state }
        const entry = {
            id: genId(),
            date: form.date,
            productId: form.productId,
            rollsUsed: rollsCount,
            kgPerRoll: kgPerRollUsed,
            weightUsed: weightUsed,
            expectedPackets,
            actualPackets,
            wastage,
            notes: form.notes,
            packetsProduced: actualPackets,
            branchId: activeBranch !== 'all' ? activeBranch : undefined,
        }
        newState.productionLog = [...state.productionLog, entry]

        // ✅ Deduct from both counters
        newState.packingRolls = { ...state.packingRolls, [form.productId]: availRolls - rollsCount }
        newState.packingKg = { ...state.packingKg, [form.productId]: availKg - weightUsed }

        newState.finishedStock = { ...state.finishedStock, [form.productId]: (state.finishedStock[form.productId] || 0) + actualPackets }
        onUpdate(newState)

        if (wastage > 0) {
            showToast('error', `⚠ Wastage: ${wastage.toLocaleString()} packets`, `${actualPackets.toLocaleString()} produced vs ${expectedPackets.toLocaleString()} expected from ${weightUsed.toFixed(1)} kg material.`)
        } else {
            showToast('success', 'Production Recorded!', `${actualPackets.toLocaleString()} packets — no wastage! 🎉`)
        }
        setForm({ productId: '', rollsUsed: '', kgPerRoll: '', actualPackets: '', notes: '', date: todayISO() })
    }

    const sortedLog = [...state.productionLog]
        .filter(e => activeBranch === 'all' || e.branchId === activeBranch)
        .sort((a, b) => b.id.localeCompare(a.id))

    return (
        <div className="form-page-grid">
            <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-card-title">🏭 Record Production</div>
                <div className="form-card-sub">Enter rolls used + actual output — wastage auto-calculated</div>

                <div className="a-form-group">
                    <label className="a-form-label">Product</label>
                    <select className="a-form-control" value={form.productId} onChange={e => set('productId', e.target.value)}>
                        <option value="">— Select product —</option>
                        {PRODUCTS.map(p => {
                            const rolls = currentStockMap[p.id]?.rolls || 0
                            return <option key={p.id} value={p.id}>{p.fullName} ({p.size}) — {rolls} rolls available</option>
                        })}
                    </select>
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Packing Rolls Used</label>
                    <input className="a-form-control" type="number" min="1" placeholder="e.g. 2" value={form.rollsUsed}
                        onChange={e => set('rollsUsed', e.target.value)}
                        style={notEnoughRolls ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Weight Per Roll (KG)</label>
                    <input className="a-form-control" type="number" min="0.1" step="0.1"
                        placeholder={`Typical: ${product?.defaultKgPerRoll || 30} kg`}
                        value={form.kgPerRoll} onChange={e => set('kgPerRoll', e.target.value)} />
                    {notEnoughRolls && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 6 }}>⚠ Only {availRolls} rolls in stock!</p>}
                    {product && rollsCount > 0 && !notEnoughRolls && (
                        <div className="total-kg-display" style={{ marginTop: 10 }}>
                            <span className="total-kg-label">Usage Impact</span>
                            <span className="total-kg-formula">{rollsCount} rolls × {kgPerRollUsed} kg</span>
                            <span className="total-kg-value">−{weightUsed.toFixed(1)} KG</span>
                        </div>
                    )}
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Actual Packets Produced</label>
                    <input className="a-form-control" type="number" min="1"
                        placeholder={expectedPackets > 0 ? `Expected: ${expectedPackets.toLocaleString()}` : 'e.g. 5000'}
                        value={form.actualPackets}
                        onChange={e => set('actualPackets', e.target.value)}
                        style={overInput ? { borderColor: 'rgba(239,68,68,0.5)' } : wastage > 0 && actualPackets > 0 ? { borderColor: 'rgba(245,158,11,0.5)' } : {}} />
                    {product && rollsCount > 0 && (
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem', marginTop: 6, fontWeight: 600 }}>
                            Based on {weightUsed.toFixed(1)}kg material: <strong style={{ color: 'var(--text-main)' }}>{expectedPackets.toLocaleString()} packets</strong> expected.
                        </p>
                    )}
                    {overInput && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 6 }}>⚠ Can't produced more than max capacity ({expectedPackets.toLocaleString()})!</p>}
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Date</label>
                    <input className="a-form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Notes (optional)</label>
                    <input className="a-form-control" type="text" placeholder="e.g. Morning shift, machine issue" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>

                {/* Calculation preview */}
                {product && rollsCount > 0 && actualPackets > 0 && (
                    <div className="calc-preview">
                        <div className="calc-preview-title">⚙️ Production Breakdown</div>
                        <div className="calc-row"><span className="calc-row-label">Material weight</span><span className="calc-row-val red">−{weightUsed.toFixed(1)} kg</span></div>
                        <div className="calc-row"><span className="calc-row-label">Rolls used</span><span className="calc-row-val red">−{rollsCount} rolls</span></div>
                        <div className="calc-row"><span className="calc-row-label">Expected packets</span><span className="calc-row-val">{expectedPackets.toLocaleString()}</span></div>
                        <div className="calc-row"><span className="calc-row-label">Actual packets</span><span className="calc-row-val highlight">+{actualPackets.toLocaleString()}</span></div>
                        <div className="calc-row"><span className="calc-row-label">New finished stock</span><span className="calc-row-val green">{((state.finishedStock[form.productId] || 0) + actualPackets).toLocaleString()}</span></div>

                        {/* Wastage highlight */}
                        {wastage > 0 ? (
                            <div className="wastage-calc-block">
                                <div className="wastage-calc-icon"><AlertTriangle size={18} /></div>
                                <div className="wastage-calc-text">
                                    <strong>WASTAGE: {wastage.toLocaleString()} packets</strong>
                                    <span>({expectedPackets.toLocaleString()} expected − {actualPackets.toLocaleString()} actual)</span>
                                    <span className="wastage-pct">{((wastage / expectedPackets) * 100).toFixed(1)}% loss rate</span>
                                </div>
                            </div>
                        ) : actualPackets > 0 && (
                            <div className="wastage-calc-block zero">
                                <div className="wastage-calc-icon">✅</div>
                                <div className="wastage-calc-text"><strong>No Wastage! Full output achieved.</strong></div>
                            </div>
                        )}
                    </div>
                )}

                <button className="a-submit-btn" type="submit"
                    disabled={!form.productId || rollsCount <= 0 || actualPackets <= 0 || notEnoughRolls || overInput}>
                    <Factory size={16} /> Save Production Entry
                </button>
            </form>

            <div className="history-card">
                <div className="history-card-header">
                    <div><h3>Production History</h3><p>{sortedLog.length} entries total</p></div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th>Date</th><th>Product</th><th>Rolls Used</th>
                                <th>Expected</th><th>Actual</th><th>Wastage</th><th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLog.length === 0
                                ? <tr><td colSpan={7}><div className="empty-state"><p>No production records yet.</p></div></td></tr>
                                : sortedLog.map(r => {
                                    const w = r.wastage ?? (r.expectedPackets - r.actualPackets) ?? 0
                                    const actual = r.actualPackets ?? r.packetsProduced ?? 0
                                    const expected = r.expectedPackets ?? actual
                                    return (
                                        <tr key={r.id}>
                                            <td>{fmtDate(r.date)}</td>
                                            <td><ProductPill productId={r.productId} /></td>
                                            <td>
                                                <div style={{ color: 'var(--text-main)', fontWeight: 800 }}>{r.rollsUsed} rolls</div>
                                                <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 600 }}>Weight: {(r.weightUsed || 0).toFixed(1)} kg</div>
                                            </td>
                                            <td style={{ color: 'var(--text-sub)', fontWeight: 600 }}>{expected.toLocaleString()}</td>
                                            <td className="bold" style={{ color: '#10b981' }}>+{actual.toLocaleString()}</td>
                                            <td>
                                                {w > 0
                                                    ? <span className="wastage-chip">⚠ {w.toLocaleString()}</span>
                                                    : <span style={{ color: '#10b981', fontSize: '0.75rem' }}>✅ None</span>
                                                }
                                            </td>
                                            <td>{r.notes || '—'}</td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ─── OUTWARD PAGE ─────────────────────────────────────────────────────────────
function OutwardPage({ state, onUpdate, showToast, activeBranch }) {
    const [form, setForm] = useState({ productId: '', packets: '', customer: '', notes: '', date: todayISO() })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const product = getProduct(form.productId)
    const qty = parseInt(form.packets) || 0
    const available = product ? (state.finishedStock[form.productId] || 0) : 0
    const notEnough = qty > available

    function handleSubmit(e) {
        e.preventDefault()
        if (!form.productId || qty <= 0) { showToast('error', 'Invalid Input', 'Select product and enter packets count.'); return }
        if (notEnough) { showToast('error', 'Not Enough Stock', `Only ${available.toLocaleString()} packets in finished stock.`); return }
        const newState = { ...state }
        newState.outwardLog = [...state.outwardLog, {
            id: genId(), date: form.date, productId: form.productId,
            packets: qty, customer: form.customer, notes: form.notes,
            branchId: activeBranch !== 'all' ? activeBranch : undefined,
        }]
        newState.finishedStock = { ...state.finishedStock, [form.productId]: available - qty }
        onUpdate(newState)
        showToast('success', 'Outward Recorded!', `${qty.toLocaleString()} packets dispatched.`)
        setForm({ productId: '', packets: '', customer: '', notes: '', date: todayISO() })
    }

    const sortedLog = [...state.outwardLog]
        .filter(e => activeBranch === 'all' || e.branchId === activeBranch)
        .sort((a, b) => b.id.localeCompare(a.id))

    return (
        <div className="form-page-grid">
            <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-card-title">📤 Record Outward</div>
                <div className="form-card-sub">Dispatch finished packets to customers</div>

                <div className="a-form-group">
                    <label className="a-form-label">Product</label>
                    <select className="a-form-control" value={form.productId} onChange={e => set('productId', e.target.value)}>
                        <option value="">— Select product —</option>
                        {PRODUCTS.map(p => (
                            <option key={p.id} value={p.id}>{p.fullName} ({p.size}) — {(state.finishedStock[p.id] || 0).toLocaleString()} packets</option>
                        ))}
                    </select>
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Packets to Dispatch</label>
                    <input className="a-form-control" type="number" min="1" placeholder="e.g. 500" value={form.packets}
                        onChange={e => set('packets', e.target.value)}
                        style={notEnough ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                    {notEnough && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 6 }}>⚠ Only {available.toLocaleString()} packets available!</p>}
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Customer Name</label>
                    <input className="a-form-control" type="text" placeholder="e.g. City Market" value={form.customer} onChange={e => set('customer', e.target.value)} />
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Date</label>
                    <input className="a-form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>

                <div className="a-form-group">
                    <label className="a-form-label">Notes (optional)</label>
                    <input className="a-form-control" type="text" placeholder="e.g. Urgent order" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>

                {product && qty > 0 && (
                    <div className="calc-preview">
                        <div className="calc-preview-title">📦 Dispatch Preview</div>
                        <div className="calc-row"><span className="calc-row-label">Available packets</span><span className="calc-row-val">{available.toLocaleString()}</span></div>
                        <div className="calc-row"><span className="calc-row-label">Dispatching</span><span className="calc-row-val red">−{qty.toLocaleString()}</span></div>
                        <div className="calc-row"><span className="calc-row-label">Remaining stock</span><span className="calc-row-val highlight">{(available - qty).toLocaleString()}</span></div>
                    </div>
                )}

                <button className="a-submit-btn" type="submit" disabled={!form.productId || qty <= 0 || notEnough}>
                    <ArrowUpFromLine size={16} /> Save Outward Entry
                </button>
            </form>

            <div className="history-card">
                <div className="history-card-header">
                    <div><h3>Outward History</h3><p>{sortedLog.length} entries total</p></div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="a-table">
                        <thead><tr><th>Date</th><th>Product</th><th>Packets Dispatched</th><th>Customer</th><th>Notes</th></tr></thead>
                        <tbody>
                            {sortedLog.length === 0
                                ? <tr><td colSpan={5}><div className="empty-state"><p>No outward records yet.</p></div></td></tr>
                                : sortedLog.map(r => (
                                    <tr key={r.id}>
                                        <td>{fmtDate(r.date)}</td>
                                        <td><ProductPill productId={r.productId} /></td>
                                        <td className="bold" style={{ color: '#f59e0b' }}>−{r.packets.toLocaleString()}</td>
                                        <td>{r.customer || '—'}</td>
                                        <td>{r.notes || '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({ state, activeBranch }) {
    const [tab, setTab] = useState('all')

    // Filter logs by active branch
    const filterByBranch = (log) => activeBranch === 'all'
        ? log
        : log.filter(e => e.branchId === activeBranch)

    const inwardLog = filterByBranch(state.inwardLog)
    const productionLog = filterByBranch(state.productionLog)
    const outwardLog = filterByBranch(state.outwardLog)

    const allEntries = [
        ...inwardLog.map(e => ({
            ...e, kind: 'Inward',
            qty: `+${(e.totalKg || e.quantityKg || 0).toLocaleString()} kg`,
            color: '#10b981',
            extra: `${e.quantity || 0} rolls`
        })),
        ...productionLog.map(e => ({
            ...e, kind: 'Production',
            qty: `+${(e.actualPackets ?? e.packetsProduced ?? 0).toLocaleString()} pkts`,
            color: '#3b82f6',
            extra: `${e.weightUsed?.toFixed(1) || 0} kg used | ${e.rollsUsed || e.bagsUsed || 0} rolls`
        })),
        ...outwardLog.map(e => ({ ...e, kind: 'Outward', qty: `−${e.packets?.toLocaleString()} pkts`, color: '#f59e0b', extra: e.customer })),
    ].sort((a, b) => b.id.localeCompare(a.id))

    const filtered = tab === 'all' ? allEntries
        : tab === 'inward' ? allEntries.filter(e => e.kind === 'Inward')
            : tab === 'prod' ? allEntries.filter(e => e.kind === 'Production')
                : allEntries.filter(e => e.kind === 'Outward')

    const summary = PRODUCTS.map(p => {
        const totalInKg = inwardLog.filter(e => e.productId === p.id).reduce((s, e) => s + (e.totalKg || e.quantityKg || 0), 0)
        const totalInRolls = inwardLog.filter(e => e.productId === p.id).reduce((s, e) => s + (e.quantity || 0), 0)
        const totalProd = productionLog.filter(e => e.productId === p.id).reduce((s, e) => s + (e.actualPackets ?? e.packetsProduced ?? 0), 0)
        const totalOut = outwardLog.filter(e => e.productId === p.id).reduce((s, e) => s + e.packets, 0)
        const totalWaste = productionLog.filter(e => e.productId === p.id).reduce((s, e) => s + (e.wastage || 0), 0)
        return { ...p, totalInKg, totalInRolls, totalProd, totalOut, totalWaste }
    })

    return (
        <>
            <div className="products-grid" style={{ marginBottom: 24 }}>
                {summary.map(p => (
                    <div key={p.id} className="a-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                            <span style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.92rem' }}>{p.fullName}</span>
                            <span style={{ marginLeft: 'auto', background: p.bg, color: p.color, padding: '2px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>{p.size}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                            {[
                                { lbl: 'Material In', val: `${p.totalInKg.toLocaleString()} kg`, color: '#10b981' },
                                { lbl: 'Produced', val: `${p.totalProd.toLocaleString()} pkts`, color: '#3b82f6' },
                                { lbl: 'Dispatched', val: `${p.totalOut.toLocaleString()} pkts`, color: '#f59e0b' },
                                { lbl: 'Wastage', val: `${p.totalWaste.toLocaleString()} pkts`, color: p.totalWaste > 0 ? '#ef4444' : '#10b981' },
                            ].map(s => (
                                <div key={s.lbl} style={{ textAlign: 'center', background: '#fff', borderRadius: 10, padding: '10px 4px', border: `1px solid ${s.lbl === 'Wastage' && p.totalWaste > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.06)'}` }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 950, color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>{s.lbl}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="history-card">
                <div className="history-card-header">
                    <div><h3>Complete Log</h3><p>{filtered.length} entries</p></div>
                    <div className="reports-tabs">
                        {[['all', 'All'], ['inward', 'Inward'], ['prod', 'Production'], ['outward', 'Outward']].map(([v, l]) => (
                            <button key={v} className={`report-tab ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="a-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Quantity</th><th>Details</th></tr></thead>
                        <tbody>
                            {filtered.length === 0
                                ? <tr><td colSpan={5}><div className="empty-state"><p>No records in this category.</p></div></td></tr>
                                : filtered.map(r => (
                                    <tr key={r.id}>
                                        <td>{fmtDate(r.date)}</td>
                                        <td><span className={`type-chip ${r.kind === 'Inward' ? 'in' : r.kind === 'Production' ? 'prod' : 'out'}`}>{r.kind}</span></td>
                                        <td><ProductPill productId={r.productId} /></td>
                                        <td className="bold" style={{ color: r.color }}>{r.qty}</td>
                                        <td style={{ color: r.extra?.includes('wasted') ? '#f59e0b' : undefined }}>{r.extra || r.notes || '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ state, onUpdate, showToast }) {
    const [thresholds, setThresholds] = useState({ ...state.alertThresholds })

    function handleSave() {
        onUpdate({ ...state, alertThresholds: { ...thresholds } })
        showToast('success', 'Settings Saved!', 'Alert thresholds updated.')
    }

    function handleReset() {
        if (!confirm('This will reset ALL data to demo values. Are you sure?')) return
        resetState()
        showToast('success', 'Data Reset!', 'All data has been reset to demo values.')
        window.location.reload()
    }

    return (
        <>
            <div style={{ maxWidth: 720 }}>
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: 'var(--ocean-deep)', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>Low Stock Alert Thresholds</h3>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>
                        Set the minimum packing roll count for each product. You will see a warning when stock drops to or below this level.
                    </p>
                </div>

                <div className="settings-grid" style={{ marginBottom: 24 }}>
                    {PRODUCTS.map(p => (
                        <div key={p.id} className="threshold-card">
                            <div className="threshold-header">
                                <div className="threshold-icon" style={{ background: p.bg, color: p.color, fontSize: '1.3rem' }}>🎞️</div>
                                <div className="threshold-title">
                                    <h3>{p.fullName}</h3>
                                    <p>{p.size} — {p.rollRatio} packets/roll</p>
                                </div>
                            </div>
                            <label className="a-form-label">Alert when rolls below</label>
                            <div className="threshold-input-wrap">
                                <input type="number" min="1" value={thresholds[p.id]}
                                    onChange={e => setThresholds(t => ({ ...t, [p.id]: parseInt(e.target.value) || 1 }))}
                                    style={{ borderColor: p.border }} />
                                <span className="threshold-unit">rolls</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: 8, fontWeight: 600 }}>
                                Alert triggers at ≤ {thresholds[p.id]} rolls = {(thresholds[p.id] * p.rollRatio).toLocaleString()} packets
                            </p>
                        </div>
                    ))}
                </div>

                <button className="a-submit-btn" onClick={handleSave} style={{ maxWidth: 280 }}>
                    <Save size={16} /> Save Thresholds
                </button>

                <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <h3 style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.92rem', marginBottom: 4 }}>Danger Zone</h3>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: 16, fontWeight: 600 }}>Resetting data will remove all logs and restore demo data.</p>
                    <button onClick={handleReset}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <RotateCcw size={14} /> Reset All Data
                    </button>
                </div>
            </div>
        </>
    )
}

// ─── TEAM PAGE ──────────────────────────────────────────────────────────
function TeamPage({ state, onUpdate, showToast }) {
    const [tab, setTab] = useState('incharges')

    // ── Branch form state ──
    const [branchForm, setBranchForm] = useState({ name: '', location: '' })
    const setB = (k, v) => setBranchForm(f => ({ ...f, [k]: v }))

    function handleAddBranch(e) {
        e.preventDefault()
        if (!branchForm.name.trim()) { showToast('error', 'Required', 'Branch name is required.'); return }
        const newBranch = { id: genId(), name: branchForm.name.trim(), location: branchForm.location.trim(), createdAt: todayISO() }
        onUpdate({ ...state, branches: [...state.branches, newBranch] })
        showToast('success', 'Branch Added!', `"${newBranch.name}" has been created.`)
        setBranchForm({ name: '', location: '' })
    }

    function handleDeleteBranch(branchId) {
        const assigned = (state.incharges || []).filter(i => i.branchId === branchId)
        if (assigned.length > 0) {
            showToast('error', 'Cannot Delete', `${assigned.length} incharge(s) are assigned to this branch. Remove them first.`)
            return
        }
        if (!confirm('Delete this branch?')) return
        onUpdate({ ...state, branches: state.branches.filter(b => b.id !== branchId) })
        showToast('success', 'Branch Deleted', '')
    }

    // ── Incharge form state ──
    const [icForm, setIcForm] = useState({ name: '', email: '', password: '', branchId: '', allowedPages: ['inward', 'production', 'outward', 'reports', 'settings'] })
    const setIC = (k, v) => setIcForm(f => ({ ...f, [k]: v }))
    const [showPass, setShowPass] = useState(false)

    // Page permission options (dashboard always accessible, not listed here)
    const PAGE_PERMISSIONS = [
        { id: 'inward', label: 'Inward', icon: '📥', desc: 'Record packing rolls received' },
        { id: 'production', label: 'Production', icon: '🏭', desc: 'Record production with wastage' },
        { id: 'outward', label: 'Outward', icon: '📤', desc: 'Dispatch finished packets' },
        { id: 'reports', label: 'Reports', icon: '📋', desc: 'View activity history' },
        { id: 'settings', label: 'Settings', icon: '⚙️', desc: 'Thresholds & configuration' },
    ]

    function togglePagePermission(pageId) {
        setIcForm(f => {
            const has = f.allowedPages.includes(pageId)
            return {
                ...f,
                allowedPages: has
                    ? f.allowedPages.filter(p => p !== pageId)
                    : [...f.allowedPages, pageId]
            }
        })
    }

    function handleAddIncharge(e) {
        e.preventDefault()
        if (!icForm.name.trim() || !icForm.email.trim() || !icForm.password.trim()) {
            showToast('error', 'Required', 'Name, email and password are required.'); return
        }
        if (!icForm.branchId) { showToast('error', 'Required', 'Please assign a branch.'); return }
        if (icForm.allowedPages.length === 0) { showToast('error', 'Required', 'Select at least one page permission.'); return }
        const emailExists = (state.incharges || []).find(i => i.email.toLowerCase() === icForm.email.toLowerCase())
        if (emailExists) { showToast('error', 'Duplicate Email', 'An incharge with this email already exists.'); return }

        const newIC = {
            id: genId(),
            name: icForm.name.trim(),
            email: icForm.email.trim().toLowerCase(),
            password: icForm.password,
            branchId: icForm.branchId,
            allowedPages: [...icForm.allowedPages],
            createdAt: todayISO()
        }
        onUpdate({ ...state, incharges: [...(state.incharges || []), newIC] })
        showToast('success', 'Incharge Created!', `${newIC.name} can now login with their credentials.`)
        setIcForm({ name: '', email: '', password: '', branchId: '', allowedPages: ['inward', 'production', 'outward', 'reports', 'settings'] })
    }

    function handleDeleteIncharge(icId, icName) {
        if (!confirm(`Remove incharge "${icName}"? They will no longer be able to login.`)) return
        onUpdate({ ...state, incharges: state.incharges.filter(i => i.id !== icId) })
        showToast('success', 'Incharge Removed', `${icName} has been removed.`)
    }

    // ── Edit incharge state ──
    const [editIC, setEditIC] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '', branchId: '', allowedPages: [] })
    const [editShowPass, setEditShowPass] = useState(false)

    function handleEditIncharge(ic) {
        setEditForm({
            name: ic.name,
            email: ic.email,
            password: ic.password,
            branchId: ic.branchId,
            allowedPages: [...(ic.allowedPages || ['inward', 'production', 'outward', 'reports', 'settings'])]
        })
        setEditShowPass(false)
        setEditIC(ic)
    }

    function toggleEditPermission(pageId) {
        setEditForm(f => {
            const has = f.allowedPages.includes(pageId)
            return {
                ...f,
                allowedPages: has
                    ? f.allowedPages.filter(p => p !== pageId)
                    : [...f.allowedPages, pageId]
            }
        })
    }

    function handleSaveEdit() {
        if (!editForm.name.trim() || !editForm.email.trim() || !editForm.password.trim()) {
            showToast('error', 'Required', 'Name, email and password are required.'); return
        }
        if (!editForm.branchId) { showToast('error', 'Required', 'Please assign a branch.'); return }
        if (editForm.allowedPages.length === 0) { showToast('error', 'Required', 'Select at least one page permission.'); return }
        // Check email uniqueness (except for current incharge)
        const emailDup = (state.incharges || []).find(i =>
            i.id !== editIC.id && i.email.toLowerCase() === editForm.email.toLowerCase()
        )
        if (emailDup) { showToast('error', 'Duplicate Email', 'Another incharge already uses this email.'); return }

        const updated = state.incharges.map(ic =>
            ic.id === editIC.id
                ? {
                    ...ic,
                    name: editForm.name.trim(),
                    email: editForm.email.trim().toLowerCase(),
                    password: editForm.password,
                    branchId: editForm.branchId,
                    allowedPages: [...editForm.allowedPages],
                }
                : ic
        )
        onUpdate({ ...state, incharges: updated })
        showToast('success', 'Incharge Updated!', `${editForm.name.trim()}'s account has been updated.`)
        setEditIC(null)
    }

    const branches = state.branches || []
    const incharges = state.incharges || []

    return (
        <>
            {/* Tab bar */}
            <div className="team-tabs">
                <button className={`team-tab ${tab === 'incharges' ? 'active' : ''}`} onClick={() => setTab('incharges')}>
                    <Users size={15} /> Incharges <span className="team-tab-count">{incharges.length}</span>
                </button>
                <button className={`team-tab ${tab === 'branches' ? 'active' : ''}`} onClick={() => setTab('branches')}>
                    <Building2 size={15} /> Branches <span className="team-tab-count">{branches.length}</span>
                </button>
            </div>

            {/* ── INCHARGES TAB ── */}
            {tab === 'incharges' && (
                <div className="form-page-grid">
                    {/* Create Incharge Form */}
                    <form className="form-card" onSubmit={handleAddIncharge}>
                        <div className="form-card-title"><UserPlus size={18} /> Create Incharge</div>
                        <div className="form-card-sub">Set credentials for a new branch incharge</div>

                        <div className="a-form-group">
                            <label className="a-form-label">Full Name</label>
                            <input className="a-form-control" type="text" placeholder="e.g. Ravi Kumar"
                                value={icForm.name} onChange={e => setIC('name', e.target.value)} />
                        </div>

                        <div className="a-form-group">
                            <label className="a-form-label">Email Address</label>
                            <input className="a-form-control" type="email" placeholder="e.g. ravi@ssvsalt.com"
                                value={icForm.email} onChange={e => setIC('email', e.target.value)} />
                        </div>

                        <div className="a-form-group">
                            <label className="a-form-label">Password</label>
                            <div className="password-input-wrap">
                                <input className="a-form-control" type={showPass ? 'text' : 'password'}
                                    placeholder="Set a secure password"
                                    value={icForm.password} onChange={e => setIC('password', e.target.value)} />
                                <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="a-form-group">
                            <label className="a-form-label">Assign Branch</label>
                            <select className="a-form-control" value={icForm.branchId} onChange={e => setIC('branchId', e.target.value)}>
                                <option value="">— Select branch —</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.location ? ` (${b.location})` : ''}</option>)}
                            </select>
                            {branches.length === 0 && (
                                <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: 6 }}>
                                    ⚠ No branches yet. Create a branch first in the Branches tab.
                                </p>
                            )}
                        </div>

                        {/* Page Permissions */}
                        <div className="a-form-group">
                            <label className="a-form-label">Page Access Permissions</label>
                            <p className="perm-hint">Dashboard is always accessible. Select additional pages this incharge can access:</p>
                            <div className="perm-grid">
                                {PAGE_PERMISSIONS.map(pp => (
                                    <label key={pp.id} className={`perm-checkbox ${icForm.allowedPages.includes(pp.id) ? 'checked' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={icForm.allowedPages.includes(pp.id)}
                                            onChange={() => togglePagePermission(pp.id)}
                                        />
                                        <span className="perm-check-icon">{icForm.allowedPages.includes(pp.id) ? '✅' : '⬜'}</span>
                                        <span className="perm-icon">{pp.icon}</span>
                                        <div className="perm-text">
                                            <span className="perm-label">{pp.label}</span>
                                            <span className="perm-desc">{pp.desc}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button className="a-submit-btn" type="submit"
                            disabled={!icForm.name || !icForm.email || !icForm.password || !icForm.branchId || icForm.allowedPages.length === 0}>
                            <UserPlus size={16} /> Create Incharge Account
                        </button>
                    </form>

                    {/* Incharges List */}
                    <div className="history-card">
                        <div className="history-card-header">
                            <div>
                                <h3>All Incharges</h3>
                                <p>{incharges.length} account{incharges.length !== 1 ? 's' : ''} created by Admin</p>
                            </div>
                        </div>

                        {incharges.length === 0 ? (
                            <div className="team-empty">
                                <div className="team-empty-icon"><Users size={36} /></div>
                                <h4>No Incharges Yet</h4>
                                <p>Create the first incharge account using the form.</p>
                            </div>
                        ) : (
                            <div className="incharge-cards">
                                {incharges.map(ic => {
                                    const branch = branches.find(b => b.id === ic.branchId)
                                    return (
                                        <div key={ic.id} className="incharge-card">
                                            <div className="ic-avatar">
                                                {ic.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="ic-info">
                                                <h4>{ic.name}</h4>
                                                <p className="ic-email">{ic.email}</p>
                                                {branch ? (
                                                    <span className="ic-branch-pill">
                                                        <Building2 size={10} /> {branch.name}
                                                        {branch.location && <><MapPin size={9} /> {branch.location}</>}
                                                    </span>
                                                ) : (
                                                    <span className="ic-branch-pill unassigned">No branch assigned</span>
                                                )}
                                                {/* Page permission pills */}
                                                <div className="ic-perm-pills">
                                                    <span className="ic-perm-pill always">📊 Dashboard</span>
                                                    {(ic.allowedPages || []).map(pageId => {
                                                        const labels = { inward: '📥 Inward', production: '🏭 Production', outward: '📤 Outward', reports: '📋 Reports', settings: '⚙️ Settings' }
                                                        return <span key={pageId} className="ic-perm-pill">{labels[pageId] || pageId}</span>
                                                    })}
                                                    {(!ic.allowedPages || ic.allowedPages.length === 0) && (
                                                        <span className="ic-perm-pill warning">⚠ No pages assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ic-meta">
                                                <span className="ic-created">Since {fmtDate(ic.createdAt)}</span>
                                                <div className="ic-actions">
                                                    <button className="ic-edit-btn" onClick={() => handleEditIncharge(ic)}
                                                        title="Edit incharge">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="ic-delete-btn" onClick={() => handleDeleteIncharge(ic.id, ic.name)}
                                                        title="Remove incharge">
                                                        <UserX size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── BRANCHES TAB ── */}
            {tab === 'branches' && (
                <div className="form-page-grid">
                    {/* Create Branch Form */}
                    <form className="form-card" onSubmit={handleAddBranch}>
                        <div className="form-card-title"><Building2 size={18} /> Create Branch</div>
                        <div className="form-card-sub">Add a new branch location</div>

                        <div className="a-form-group">
                            <label className="a-form-label">Branch Name</label>
                            <input className="a-form-control" type="text" placeholder="e.g. Main Factory"
                                value={branchForm.name} onChange={e => setB('name', e.target.value)} />
                        </div>

                        <div className="a-form-group">
                            <label className="a-form-label">Location / City</label>
                            <input className="a-form-control" type="text" placeholder="e.g. Chennai"
                                value={branchForm.location} onChange={e => setB('location', e.target.value)} />
                        </div>

                        <button className="a-submit-btn" type="submit" disabled={!branchForm.name.trim()}>
                            <Building2 size={16} /> Create Branch
                        </button>
                    </form>

                    {/* Branches List */}
                    <div className="history-card">
                        <div className="history-card-header">
                            <div>
                                <h3>All Branches</h3>
                                <p>{branches.length} branch{branches.length !== 1 ? 'es' : ''} total</p>
                            </div>
                        </div>

                        {branches.length === 0 ? (
                            <div className="team-empty">
                                <div className="team-empty-icon"><Building2 size={36} /></div>
                                <h4>No Branches Yet</h4>
                                <p>Add your first branch location.</p>
                            </div>
                        ) : (
                            <div className="branch-cards">
                                {branches.map(b => {
                                    const assignedCount = incharges.filter(i => i.branchId === b.id).length
                                    return (
                                        <div key={b.id} className="branch-card">
                                            <div className="branch-card-icon"><Building2 size={22} /></div>
                                            <div className="branch-card-info">
                                                <h4>{b.name}</h4>
                                                {b.location && (
                                                    <p className="branch-location"><MapPin size={11} /> {b.location}</p>
                                                )}
                                                <span className="branch-ic-count">
                                                    <Users size={11} /> {assignedCount} incharge{assignedCount !== 1 ? 's' : ''} assigned
                                                </span>
                                            </div>
                                            <div className="branch-card-meta">
                                                <span className="ic-created">Added {fmtDate(b.createdAt)}</span>
                                                <button className="ic-delete-btn" onClick={() => handleDeleteBranch(b.id)}
                                                    title="Delete branch">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── EDIT INCHARGE MODAL ── */}
            {editIC && (
                <div className="edit-modal-overlay" onClick={() => setEditIC(null)}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <div>
                                <h3><Edit2 size={18} /> Edit Incharge</h3>
                                <p>Modify account details for {editIC.name}</p>
                            </div>
                            <button className="edit-modal-close" onClick={() => setEditIC(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="edit-modal-body">
                            <div className="a-form-group">
                                <label className="a-form-label">Full Name</label>
                                <input className="a-form-control" type="text" placeholder="e.g. Ravi Kumar"
                                    value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                            </div>

                            <div className="a-form-group">
                                <label className="a-form-label">Email Address</label>
                                <input className="a-form-control" type="email" placeholder="e.g. ravi@ssvsalt.com"
                                    value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                            </div>

                            <div className="a-form-group">
                                <label className="a-form-label">Password</label>
                                <div className="password-input-wrap">
                                    <input className="a-form-control" type={editShowPass ? 'text' : 'password'}
                                        placeholder="Set a secure password"
                                        value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
                                    <button type="button" className="pass-toggle" onClick={() => setEditShowPass(s => !s)}>
                                        {editShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="a-form-group">
                                <label className="a-form-label">Assign Branch</label>
                                <select className="a-form-control" value={editForm.branchId}
                                    onChange={e => setEditForm(f => ({ ...f, branchId: e.target.value }))}>
                                    <option value="">— Select branch —</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.location ? ` (${b.location})` : ''}</option>)}
                                </select>
                            </div>

                            <div className="a-form-group">
                                <label className="a-form-label">Page Access Permissions</label>
                                <p className="perm-hint">Dashboard is always accessible. Select pages this incharge can access:</p>
                                <div className="perm-grid">
                                    {PAGE_PERMISSIONS.map(pp => (
                                        <label key={pp.id} className={`perm-checkbox ${editForm.allowedPages.includes(pp.id) ? 'checked' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.allowedPages.includes(pp.id)}
                                                onChange={() => toggleEditPermission(pp.id)}
                                            />
                                            <span className="perm-check-icon">{editForm.allowedPages.includes(pp.id) ? '✅' : '⬜'}</span>
                                            <span className="perm-icon">{pp.icon}</span>
                                            <div className="perm-text">
                                                <span className="perm-label">{pp.label}</span>
                                                <span className="perm-desc">{pp.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="edit-modal-footer">
                            <button className="edit-modal-cancel" onClick={() => setEditIC(null)}>Cancel</button>
                            <button className="edit-modal-save" onClick={handleSaveEdit}
                                disabled={!editForm.name || !editForm.email || !editForm.password || !editForm.branchId || editForm.allowedPages.length === 0}>
                                <Save size={15} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// ─── VENDORS PAGE ────────────────────────────────────────────────────────────
function VendorsPage({ state, onUpdate, showToast }) {
    const [addForm, setAddForm] = useState({ name: '', phone: '', address: '' })
    const setA = (k, v) => setAddForm(f => ({ ...f, [k]: v }))

    const vendors = state.vendors || []
    const branches = state.branches || []
    const incharges = state.incharges || []

    // Total KG received from all inward log entries
    const totalKgAll = (state.inwardLog || []).reduce((s, e) => s + (e.quantityKg || 0), 0)

    // Per-vendor: total KG they delivered (matched by name in inward log)
    function vendorKg(vendorName) {
        return (state.inwardLog || [])
            .filter(e => e.vendorName === vendorName)
            .reduce((s, e) => s + (e.totalKg || e.quantityKg || 0), 0)
    }

    // Incharge assigned to a branch
    function branchIncharge(branchId) {
        return incharges.find(ic => ic.branchId === branchId) || null
    }

    // Pending stock requests for a branch
    function branchPendingRequests(branchId) {
        return (state.stockRequests || []).filter(r => r.branchId === branchId && r.status === 'pending')
    }

    function handleAddVendor(e) {
        e.preventDefault()
        if (!addForm.name.trim()) { showToast('error', 'Invalid', 'Enter vendor name.'); return }
        const v = { id: genId(), name: addForm.name.trim(), phone: addForm.phone.trim(), address: addForm.address.trim(), createdAt: todayISO() }
        onUpdate({ ...state, vendors: [...vendors, v] })
        showToast('success', 'Vendor Added!', `${v.name} registered.`)
        setAddForm({ name: '', phone: '', address: '' })
    }

    function handleDeleteVendor(vendorId) {
        const v = vendors.find(x => x.id === vendorId)
        if (!confirm(`Delete vendor "${v?.name}"?`)) return
        onUpdate({ ...state, vendors: vendors.filter(x => x.id !== vendorId) })
        showToast('success', 'Vendor Deleted', `${v?.name} removed.`)
    }

    // Count pending requests across ALL branches
    const totalPending = (state.stockRequests || []).filter(r => r.status === 'pending').length

    return (
        <>
            {/* KPI Row */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
                <div className="kpi-card-admin gold">
                    <div className="kpi-icon-wrap gold"><Truck size={20} /></div>
                    <div className="kpi-label">Total Vendors</div>
                    <div className="kpi-value">{vendors.length}</div>
                    <div className="kpi-sub">registered packing roll suppliers</div>
                </div>
                <div className="kpi-card-admin blue">
                    <div className="kpi-icon-wrap blue"><Building2 size={20} /></div>
                    <div className="kpi-label">Total Branches</div>
                    <div className="kpi-value">{branches.length}</div>
                    <div className="kpi-sub">active distribution branches</div>
                </div>
                <div className="kpi-card-admin green">
                    <div className="kpi-icon-wrap green"><Package size={20} /></div>
                    <div className="kpi-label">Total KG Received</div>
                    <div className="kpi-value">{totalKgAll.toLocaleString()}</div>
                    <div className="kpi-sub">kg of packing rolls (all vendors)</div>
                </div>
            </div>

            <div className="vendor-page-grid">
                {/* ── LEFT: Vendor List + Add Form ── */}
                <div className="a-card vendor-list-card">
                    <div className="a-card-title">Packing Roll Suppliers</div>

                    {vendors.length === 0 && (
                        <div className="empty-state" style={{ marginBottom: 20 }}><p>No vendors yet. Add one below.</p></div>
                    )}

                    <div className="vendor-card-list">
                        {vendors.map(v => {
                            const kg = vendorKg(v.name)
                            return (
                                <div key={v.id} className="vendor-card">
                                    <div className="vendor-card-top">
                                        <div className="vendor-avatar">{v.name[0].toUpperCase()}</div>
                                        <div className="vendor-info">
                                            <h4>{v.name}</h4>
                                            {v.phone && <p><Phone size={11} /> {v.phone}</p>}
                                            {v.address && <p style={{ color: 'var(--text-sub)', marginTop: 2, fontSize: '0.75rem', fontWeight: 600 }}>{v.address}</p>}
                                        </div>
                                        <button className="ic-delete-btn" onClick={() => handleDeleteVendor(v.id)} title="Delete vendor">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="vendor-card-badges">
                                        <span className="vendor-badge kg"><Package size={11} /> {kg.toLocaleString()} kg delivered</span>
                                        <span className="vendor-badge branches" style={{ color: 'var(--text-sub)', background: '#fff', borderColor: 'rgba(0,0,0,0.08)', fontWeight: 700 }}>Added {fmtDate(v.createdAt)}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="vendor-add-divider"><span>Add New Vendor</span></div>
                    <form onSubmit={handleAddVendor}>
                        <div className="a-form-group">
                            <label className="a-form-label">Vendor / Supplier Name *</label>
                            <input className="a-form-control" type="text" placeholder="e.g. Vijay Packaging Pvt Ltd" value={addForm.name} onChange={e => setA('name', e.target.value)} />
                        </div>
                        <div className="a-form-group">
                            <label className="a-form-label">Phone Number</label>
                            <input className="a-form-control" type="tel" placeholder="e.g. 9876543210" value={addForm.phone} onChange={e => setA('phone', e.target.value)} />
                        </div>
                        <div className="a-form-group">
                            <label className="a-form-label">Address</label>
                            <input className="a-form-control" type="text" placeholder="e.g. No 12, Industrial Area, Chennai" value={addForm.address} onChange={e => setA('address', e.target.value)} />
                        </div>
                        <button className="a-submit-btn" type="submit" style={{ marginTop: 4 }}>
                            <UserPlus size={15} /> Add Vendor
                        </button>
                    </form>
                </div>

                {/* ── RIGHT: Branch Overview (all Team branches) ── */}
                <div className="a-card vendor-detail-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div className="a-card-title" style={{ marginBottom: 0 }}>Branch Overview</div>
                        {totalPending > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b' }}>
                                ⚠ {totalPending} pending request{totalPending !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {branches.length === 0 ? (
                        <div className="vendor-no-selection">
                            <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.25 }}>🏢</div>
                            <h3>No Branches Yet</h3>
                            <p>Go to the <strong>Team</strong> page to create branches and assign incharges to them.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {branches.map(branch => {
                                const ic = branchIncharge(branch.id)
                                const bStock = state.branchStock?.[branch.id] || {}
                                const pendingReqs = branchPendingRequests(branch.id)
                                const totalStock = PRODUCTS.reduce((s, p) => s + (bStock[p.id] || 0), 0)

                                return (
                                    <div key={branch.id} className="vendor-branch-panel">
                                        {/* Branch Header */}
                                        <div className="vbp-header">
                                            <div>
                                                <div className="vbp-branch-name"><Building2 size={13} /> {branch.name}</div>
                                                <div className="vbp-branch-loc"><MapPin size={11} /> {branch.location}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {ic ? (
                                                    <>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f5c13e' }}>{ic.name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', fontWeight: 600 }}>{ic.email}</div>
                                                    </>
                                                ) : (
                                                    <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>No incharge assigned</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stock Grid */}
                                        <div className="vbp-section-title">Current Stock</div>
                                        <div className="vbp-stock-grid">
                                            {PRODUCTS.map(p => (
                                                <div key={p.id} className="vbp-stock-cell">
                                                    <div className="vbp-cell-val" style={{ color: (bStock[p.id] || 0) === 0 ? '#ef4444' : p.color }}>
                                                        {(bStock[p.id] || 0).toLocaleString()}
                                                    </div>
                                                    <div className="vbp-cell-lbl">{p.brand}<br />{p.size}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="vbp-total-row">Total packets: <strong>{totalStock.toLocaleString()}</strong></div>

                                        {/* Pending Requests */}
                                        {pendingReqs.length > 0 && (
                                            <>
                                                <div className="vbp-section-title" style={{ color: '#f59e0b', marginTop: 12 }}>
                                                    ⚠ Pending Stock Requests ({pendingReqs.length})
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {pendingReqs.map(req => (
                                                        <div key={req.id} className="vbp-request-row">
                                                            <ProductPill productId={req.productId} />
                                                            <span style={{ color: '#f59e0b', fontWeight: 700, marginLeft: 'auto' }}>+{req.quantity.toLocaleString()} pkts</span>
                                                            <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontStyle: 'italic' }}>{req.note}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {pendingReqs.length === 0 && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: 8, fontWeight: 700, opacity: 0.5 }}>✓ No pending requests</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

// ─── PAGE META ─────────────────────────────────────────────────
const PAGES = {
    dashboard: { label: 'Dashboard', sub: 'Overview & stock status', icon: LayoutDashboard },
    inward: { label: 'Inward', sub: 'Record packing rolls received', icon: PackagePlus },
    production: { label: 'Production', sub: 'Record production with wastage', icon: Factory },
    outward: { label: 'Outward', sub: 'Dispatch finished packets', icon: PackageMinus },
    vendors: { label: 'Vendors', sub: 'Manage roll suppliers & branches', icon: Truck },
    reports: { label: 'Reports', sub: 'Full activity history', icon: FileBarChart2 },
    team: { label: 'Team', sub: 'Manage branches & incharges', icon: Users },
    settings: { label: 'Settings', sub: 'Thresholds & configuration', icon: Settings },
}

// ─── ADMIN APP SHELL ──────────────────────────────────────────────────────────
export default function AdminApp({ onLogout, role = 'admin', user = null, branch = null }) {
    const isIncharge = role === 'incharge'
    const [page, setPage] = useState('dashboard')
    const [state, setState] = useState(loadState)
    const [collapsed, setCollapsed] = useState(false)
    const { toasts, show: showToast } = useToast()

    // Branch filtering: incharge locked to their branch, admin can choose
    const [selectedBranch, setSelectedBranch] = useState(
        isIncharge && user ? user.branchId : 'all'
    )
    // For incharge, always enforce their branch
    const activeBranch = isIncharge && user ? user.branchId : selectedBranch

    const lowCount = getLowStockCount(state.packingRolls, state.alertThresholds)

    function handleUpdate(newState) {
        setState(newState)
        saveState(newState)
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    const meta = PAGES[page]

    const allNav = [
        ['dashboard', LayoutDashboard, null],
        ['inward', PackagePlus, null],
        ['production', Factory, null],
        ['outward', PackageMinus, null],
        ['vendors', Truck, null],
        ['reports', FileBarChart2, null],
        ['team', Users, null],
        ['settings', Settings, null],
    ]

    // Incharge: filter by allowedPages (dashboard always visible, team/vendors always hidden)
    // Admin: show everything
    const inchargeAllowed = user?.allowedPages || []
    const nav = isIncharge
        ? allNav.filter(([id]) => id === 'dashboard' || inchargeAllowed.includes(id))
            .filter(([id]) => id !== 'team' && id !== 'vendors')
        : allNav

    // Helper: check if incharge can access a page
    const canAccess = (pageId) => !isIncharge || pageId === 'dashboard' || inchargeAllowed.includes(pageId)

    return (
        <div className="admin-shell">
            <ToastContainer toasts={toasts} />

            {/* ── SIDEBAR ── */}
            <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🧂</div>
                    {!collapsed && (
                        <div className="sidebar-brand-text">
                            <h1>SSV SALT</h1>
                            <p>{isIncharge ? 'Incharge Portal' : 'Admin Portal'}</p>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {!collapsed && <div className="nav-section-label">Main Menu</div>}
                    {nav.slice(0, 4).map(([id, Icon]) => (
                        <div key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
                            <div className="nav-item-icon"><Icon size={18} /></div>
                            {!collapsed && <span className="nav-item-label">{PAGES[id].label}</span>}
                            {!collapsed && id === 'dashboard' && lowCount > 0 && <span className="nav-badge">{lowCount}</span>}
                        </div>
                    ))}
                    {!collapsed && <div className="nav-section-label" style={{ marginTop: 8 }}>Tools</div>}
                    {nav.slice(4).map(([id, Icon]) => (
                        <div key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
                            <div className="nav-item-icon"><Icon size={18} /></div>
                            {!collapsed && <span className="nav-item-label">{PAGES[id].label}</span>}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-user-card" onClick={onLogout} title="Logout">
                        <div className="admin-avatar">
                            {isIncharge && user
                                ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                                : 'AD'}
                        </div>
                        {!collapsed && (
                            <div className="admin-user-info">
                                <h4>{isIncharge && user ? user.name : 'Admin User'}</h4>
                                <p>{isIncharge && branch ? branch.name : 'SSV Salt Industries'}</p>
                            </div>
                        )}
                        {!collapsed && <LogOut className="logout-icon" size={16} />}
                    </div>
                </div>
            </div>

            {/* ── MAIN ── */}
            <div className="admin-main">
                <div className="admin-topbar">
                    <div className="topbar-toggle" onClick={() => setCollapsed(c => !c)}>
                        <Menu size={18} />
                    </div>
                    <div className="topbar-title">
                        <h2>{meta.label}</h2>
                        <p>{meta.sub}</p>
                    </div>
                    <div className="topbar-right">
                        {/* Branch Selector — admin gets dropdown, incharge sees locked label */}
                        {!isIncharge ? (
                            <div className="branch-selector-wrap">
                                <Building2 size={14} className="branch-selector-icon" />
                                <select
                                    className="branch-selector"
                                    value={selectedBranch}
                                    onChange={e => setSelectedBranch(e.target.value)}
                                >
                                    <option value="all">All Branches</option>
                                    {(state.branches || []).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}{b.location ? ` (${b.location})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="branch-locked-pill">
                                <Building2 size={13} />
                                {(state.branches || []).find(b => b.id === activeBranch)?.name || 'My Branch'}
                            </div>
                        )}
                        <div className="topbar-date">{dateStr}</div>
                        {lowCount > 0 && (
                            <div className="topbar-alert-btn" title={`${lowCount} product(s) low on packing rolls`} onClick={() => setPage('dashboard')}>
                                <Bell size={16} />
                                <div className="alert-dot" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="admin-page">
                    {page === 'dashboard' && <Dashboard state={state} onNavigate={setPage} activeBranch={activeBranch} onLogout={onLogout} userName={isIncharge && user ? user.name : 'Admin'} isIncharge={isIncharge} />}
                    {canAccess('inward') && page === 'inward' && <InwardPage state={state} onUpdate={handleUpdate} showToast={showToast} activeBranch={activeBranch} />}
                    {canAccess('production') && page === 'production' && <ProductionPage state={state} onUpdate={handleUpdate} showToast={showToast} activeBranch={activeBranch} />}
                    {canAccess('outward') && page === 'outward' && <OutwardPage state={state} onUpdate={handleUpdate} showToast={showToast} activeBranch={activeBranch} />}
                    {!isIncharge && page === 'vendors' && <VendorsPage state={state} onUpdate={handleUpdate} showToast={showToast} />}
                    {canAccess('reports') && page === 'reports' && <ReportsPage state={state} activeBranch={activeBranch} />}
                    {!isIncharge && page === 'team' && <TeamPage state={state} onUpdate={handleUpdate} showToast={showToast} />}
                    {canAccess('settings') && page === 'settings' && <SettingsPage state={state} onUpdate={handleUpdate} showToast={showToast} />}

                    {/* Access Restricted fallback for incharge */}
                    {isIncharge && page !== 'dashboard' && !canAccess(page) && (
                        <div className="access-restricted">
                            <div className="access-restricted-card">
                                <div className="access-restricted-icon">🔒</div>
                                <h3>Access Restricted</h3>
                                <p>You don’t have permission to access the <strong>{PAGES[page]?.label || page}</strong> page.</p>
                                <p className="access-restricted-hint">Contact your admin to request access to this page.</p>
                                <button className="access-restricted-btn" onClick={() => setPage('dashboard')}>
                                    <LayoutDashboard size={15} /> Go to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav className="admin-mobile-nav">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
                    ...(canAccess('inward') ? [{ id: 'inward', icon: PackagePlus, label: 'Inward' }] : []),
                    ...(canAccess('production') ? [{ id: 'production', icon: Factory, label: 'Produce' }] : []),
                    ...(canAccess('outward') ? [{ id: 'outward', icon: PackageMinus, label: 'Outward' }] : []),
                    ...(!isIncharge ? [{ id: 'vendors', icon: Truck, label: 'Vendors' }] : []),
                    ...(!isIncharge ? [{ id: 'team', icon: Users, label: 'Team' }] : []),
                    ...(canAccess('settings') ? [{ id: 'settings', icon: Settings, label: 'Settings' }] : []),
                ].map(({ id, icon: Icon, label }) => (
                    <div key={id} className={`mob-nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
                        {id === 'dashboard' && lowCount > 0 && <span className="mob-nav-badge">{lowCount}</span>}
                        <Icon size={20} />
                        <span className="mob-nav-label">{label}</span>
                    </div>
                ))}
            </nav>
        </div>
    )
}

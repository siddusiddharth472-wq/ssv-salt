// ─── Product Configuration ─────────────────────────────────────────────────
export const PRODUCTS = [
    {
        id: 'crystal_1kg',
        brand: 'Sri Murugan',
        name: 'Crystal Salt',
        fullName: 'Sri Murugan Crystal Salt',
        size: '1 kg',
        rollRatio: 0,   // Unused, we use kgRatio now
        kgRatio: 175,   // packets per KG of packing material
        defaultKgPerRoll: 30,
        color: '#3b82f6',
        colorDark: '#1d4ed8',
        bg: 'rgba(59,130,246,0.12)',
        border: 'rgba(59,130,246,0.25)',
    },
    {
        id: 'crystal_half',
        brand: 'Sri Murugan',
        name: 'Crystal Salt',
        fullName: 'Sri Murugan Crystal Salt',
        size: '½ kg',
        rollRatio: 0,
        kgRatio: 350,   // estimated double for half size
        defaultKgPerRoll: 30,
        color: '#8b5cf6',
        colorDark: '#6d28d9',
        bg: 'rgba(139,92,246,0.12)',
        border: 'rgba(139,92,246,0.25)',
    },
    {
        id: 'flow_1kg',
        brand: 'Sammudra',
        name: 'Free Flow Salt',
        fullName: 'Sammudra Free Flow Salt',
        size: '1 kg',
        rollRatio: 0,
        kgRatio: 200,   // packets per KG of packing material
        defaultKgPerRoll: 30,
        color: '#10b981',
        colorDark: '#047857',
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.25)',
    },
    {
        id: 'flow_half',
        brand: 'Sammudra',
        name: 'Free Flow Salt',
        fullName: 'Sammudra Free Flow Salt',
        size: '½ kg',
        rollRatio: 0,
        kgRatio: 400,   // estimated double for half size
        defaultKgPerRoll: 30,
        color: '#06b6d4',
        colorDark: '#0e7490',
        bg: 'rgba(6,182,212,0.12)',
        border: 'rgba(6,182,212,0.25)',
    },
]

// ─── Default Demo State ─────────────────────────────────────────────────────
function getDefaultState() {
    return {
        // ── Packing material stock tracked in KG (primary unit) ────────
        packingRolls: { crystal_1kg: 0, crystal_half: 0, flow_1kg: 0, flow_half: 0 },
        packingKg: { crystal_1kg: 0, crystal_half: 0, flow_1kg: 0, flow_half: 0 },
        finishedStock: { crystal_1kg: 0, flow_1kg: 0, crystal_half: 0, flow_half: 0 },
        alertThresholds: {
            crystal_1kg: 50,
            crystal_half: 50,
            flow_1kg: 50,
            flow_half: 50,
        },

        // ── Branches (created by Admin) ────────────────────────────────
        branches: [],

        // ── Incharges (created & assigned by Admin) ───────────────────
        incharges: [],

        // ── Logs ──────────────────────────────────────────────────────
        inwardLog: [],
        productionLog: [],
        outwardLog: [],

        // ── Branch stock (each branch has its own packet stock per product) ──
        branchStock: {},

        // ── Stock update log (audit trail for branch stock changes) ──────────
        stockUpdateLog: [],

        // ── Stock requests (incharge → admin) ─────────────────────────────
        stockRequests: [],

        // ── Vendors (packing roll suppliers) ───────────────────────────
        vendors: [],

        // ── Vendor → Branch links (which vendor supplies which branch) ─────
        vendorBranches: [],
    }
}

// ─── Storage Helpers ────────────────────────────────────────────────────────
const KEY = 'ssvsalt_v5'

export function loadState() {
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) { const s = getDefaultState(); saveState(s); return s }
        const parsed = JSON.parse(raw)
        const defaults = getDefaultState()
        // Migration guards — ensure new fields exist in old saves
        if (!parsed.branches) parsed.branches = defaults.branches
        if (!parsed.incharges) parsed.incharges = defaults.incharges
        if (!parsed.packingRolls) parsed.packingRolls = defaults.packingRolls
        if (!parsed.packingKg) parsed.packingKg = defaults.packingKg
        if (!parsed.branchStock) parsed.branchStock = defaults.branchStock
        if (!parsed.stockUpdateLog) parsed.stockUpdateLog = defaults.stockUpdateLog
        if (!parsed.stockRequests) parsed.stockRequests = defaults.stockRequests
        if (!parsed.vendors) parsed.vendors = defaults.vendors
        if (!parsed.vendorBranches) parsed.vendorBranches = defaults.vendorBranches
        // Migrate old inwardLog entries missing new fields
        if (parsed.inwardLog) {
            parsed.inwardLog = parsed.inwardLog.map(e => {
                const entry = {
                    quantityKg: 0, vendorName: '', invoiceNumber: '', invoicePhoto: '',
                    ...e
                }
                // Migrate to new kgPerRoll/totalKg format
                if (!entry.totalKg && entry.quantityKg) {
                    entry.totalKg = entry.quantityKg
                }
                if (!entry.kgPerRoll && entry.quantityKg && entry.quantity) {
                    entry.kgPerRoll = entry.quantityKg / entry.quantity
                }
                return entry
            })
        }
        // Migrate old incharges missing allowedPages — give full access by default
        if (parsed.incharges) {
            parsed.incharges = parsed.incharges.map(ic => ({
                allowedPages: ['inward', 'production', 'outward', 'reports', 'settings'],
                ...ic
            }))
        }
        return parsed
    } catch { return getDefaultState() }
}

export function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetState() {
    const s = getDefaultState()
    saveState(s)
    return s
}

// ─── Utility ────────────────────────────────────────────────────────────────
export function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function getProduct(id) {
    return PRODUCTS.find(p => p.id === id)
}

export function getBranch(branches, id) {
    return (branches || []).find(b => b.id === id)
}

export function getIncharge(incharges, id) {
    return (incharges || []).find(i => i.id === id)
}

// Validate incharge login credentials against stored incharges
export function findInchargeByCredentials(incharges, email, password) {
    return (incharges || []).find(i =>
        i.email.toLowerCase() === email.toLowerCase() && i.password === password
    ) || null
}

export function getPossibleProduction(packingKg) {
    const result = {}
    const pkg = packingKg || {}
    PRODUCTS.forEach(p => { result[p.id] = Math.floor((pkg[p.id] || 0) * p.kgRatio) })
    return result
}

export function getTotalPossiblePackets(packingKg) {
    const pkg = packingKg || {}
    return PRODUCTS.reduce((sum, p) => sum + Math.floor((pkg[p.id] || 0) * p.kgRatio), 0)
}

export function getTotalFinishedStock(finishedStock) {
    return PRODUCTS.reduce((sum, p) => sum + (finishedStock[p.id] || 0), 0)
}

export function getTotalRolls(packingRolls) {
    return PRODUCTS.reduce((sum, p) => sum + (packingRolls[p.id] || 0), 0)
}

export function getTotalKg(packingKg) {
    return PRODUCTS.reduce((sum, p) => sum + (packingKg[p.id] || 0), 0)
}

export function getTotalWastage(productionLog) {
    return (productionLog || []).reduce((sum, e) => sum + (e.wastage || 0), 0)
}

/**
 * Calculates current material stock (Rolls & KG) by aggregating all logs.
 * This is more reliable than separate counters which can get out of sync.
 */
export function getCurrentMaterialStock(inwardLog, productionLog) {
    const stock = {}
    PRODUCTS.forEach(p => {
        stock[p.id] = { rolls: 0, kg: 0 }
    })

    // Add everything from Inward records
    if (inwardLog) {
        inwardLog.forEach(e => {
            if (stock[e.productId]) {
                stock[e.productId].rolls += (parseInt(e.quantity) || 0)
                stock[e.productId].kg += (parseFloat(e.totalKg || e.quantityKg) || 0)
            }
        })
    }

    // Subtract everything from Production records
    if (productionLog) {
        productionLog.forEach(e => {
            if (stock[e.productId]) {
                stock[e.productId].rolls -= (parseInt(e.rollsUsed) || 0)
                stock[e.productId].kg -= (parseFloat(e.weightUsed) || 0)
            }
        })
    }

    return stock
}

export function getStockLevel(rolls, threshold) {
    if (rolls <= 0) return 'empty'
    if (rolls <= threshold) return 'critical'
    if (rolls <= threshold * 2) return 'low'
    return 'good'
}

export function fmtDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

export function todayISO() {
    return new Date().toISOString().split('T')[0]
}

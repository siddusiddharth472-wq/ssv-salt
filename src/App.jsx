import React, { useState } from 'react'
import {
    ShieldCheck, Warehouse, ArrowRight, Lock,
    User, BarChart2, Package, TrendingUp,
    FileText, Database, Settings, Home
} from 'lucide-react'
import AdminApp from './AdminApp.jsx'
import { loadState, findInchargeByCredentials, getBranch } from './data/store.js'
import './index.css'

export default function App() {
    const [role, setRole] = useState('admin')    // 'admin' | 'incharge'
    const [loggedIn, setLoggedIn] = useState(false)
    const [inchargeUser, setInchargeUser] = useState(null)       // the matched incharge object

    // Admin credentials (hardcoded — only one admin)
    const ADMIN_CREDS = { email: 'admin@ssvsalt.com', pass: 'admin123' }

    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [err, setErr] = useState('')

    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    function handleLogout() {
        setLoggedIn(false);
        setInchargeUser(null);
        setEmail('');
        setPass('');
        setRole('admin');
        setErr('');
    }

    function handleLogin(e) {
        e.preventDefault()

        if (role === 'admin') {
            if (email === ADMIN_CREDS.email && pass === ADMIN_CREDS.pass) {
                setLoggedIn(true)
            } else {
                setErr('Invalid admin credentials. Please try again.')
            }
        } else {
            const state = loadState()
            const matched = findInchargeByCredentials(state.incharges, email, pass)
            if (matched) {
                setInchargeUser(matched)
                setLoggedIn(true)
            } else {
                setErr('Invalid credentials. Contact your admin for access.')
            }
        }
    }

    // ── After login routing ────────────────────────────────────
    if (loggedIn && role === 'admin') {
        return <AdminApp onLogout={handleLogout} />
    }
    if (loggedIn && role === 'incharge' && inchargeUser) {
        const state = loadState()
        const branch = getBranch(state.branches, inchargeUser.branchId)
        return <AdminApp role="incharge" user={inchargeUser} branch={branch} onLogout={handleLogout} />
    }

    return (
        <>
            {/* ─────── NEW PREMIUM LOGIN PORTAL ─────── */}
            <div className="login-page-container">
                {/* Branding Highlights */}
                <div className="portal-branding">
                    <h1 className="brand-highlight-main">SSV SALT</h1>
                    <div className="brand-subtext">Premium Stock Analysis Portal</div>
                </div>

                {/* Salt Particles */}
                <div className="salt-particles">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="salt-particle"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${5 + Math.random() * 10}s`,
                                animationDelay: `${Math.random() * 10}s`,
                                opacity: 0.3 + Math.random() * 0.7,
                                width: `${2 + Math.random() * 4}px`,
                                height: `${2 + Math.random() * 4}px`
                            }}
                        />
                    ))}
                </div>

                <div className="login-container-wrapper">
                    <div className="right-panel">
                        {/* Role Selection Tabs */}
                        <div className="role-tabs">
                            <button
                                className={`role-tab ${role === 'admin' ? 'active gold' : ''}`}
                                onClick={() => { setRole('admin'); setErr(''); setEmail(''); setPass('') }}
                            >
                                <ShieldCheck size={16} /> Admin
                            </button>
                            <button
                                className={`role-tab ${role === 'incharge' ? 'active green' : ''}`}
                                onClick={() => { setRole('incharge'); setErr(''); setEmail(''); setPass('') }}
                            >
                                <Warehouse size={16} /> Incharge
                            </button>
                        </div>

                        <div className="form-header">
                            <h2>Sign In</h2>
                            <p>Access your {role} workspace</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <User className="input-icon" />
                                    <input
                                        type="email"
                                        placeholder={role === 'admin' ? 'admin@ssvsalt.com' : 'your-email@ssvsalt.com'}
                                        value={email} onChange={e => { setEmail(e.target.value); setErr('') }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" />
                                    <input type="password" placeholder="••••••••" value={pass} onChange={e => { setPass(e.target.value); setErr('') }} />
                                </div>
                            </div>

                            {err && (
                                <div className="login-error-toast" style={{ color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '15px', textAlign: 'center' }}>
                                    {err}
                                </div>
                            )}

                            <button type="submit" className="login-btn">
                                Access Dashboard <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* CLEAN TASKBAR */}
            <div className="taskbar">
                <div className="tb-app-icon"><BarChart2 size={14} /> SSV Salt System</div>
                <div className="tb-spacer" />
                <div className="tb-info">
                    <div className="tb-status"><div className="tb-dot" /> Online</div>
                    <span className="tb-info-sep">|</span>
                    <span className="tb-time-display">{dateStr} {timeStr}</span>
                </div>
            </div>
        </>
    );
}

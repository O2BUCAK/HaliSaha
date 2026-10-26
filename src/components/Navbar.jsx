import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, LogOut, User } from 'lucide-react';
import packageJson from '../../package.json';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header style={{
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '64px',
                gap: '2rem'
            }}>
                {/* Zone 1: HalıSaha Brand Logo */}
                <Link to="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    fontSize: '1.45rem',
                    fontWeight: '800',
                    color: 'var(--accent-primary)',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    flexShrink: 0
                }}>
                    <Trophy size={28} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 2px 8px rgba(34, 197, 94, 0.45))' }} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff' }}>
                        <span>HalıSaha</span>
                        <span style={{
                            fontSize: '0.78rem',
                            background: 'var(--accent-secondary)',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            lineHeight: 1.2
                        }}>
                            v{packageJson.version}
                        </span>
                    </span>
                </Link>

                {/* Zone 2: Navigation Links */}
                <nav style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.75rem',
                    fontSize: '0.88rem',
                    fontWeight: '500'
                }}>
                    {currentUser ? (
                        <>
                            <Link to="/dashboard" style={{
                                color: 'var(--text-primary)',
                                transition: 'color 0.15s ease'
                            }} className="hover:text-emerald-400">
                                Genel Bakış
                            </Link>
                            <Link to="/dashboard/groups" style={{
                                color: 'var(--text-secondary)',
                                transition: 'color 0.15s ease'
                            }} className="hover:text-emerald-400">
                                Gruplar
                            </Link>
                            <Link to="/profile" style={{
                                color: 'var(--text-secondary)',
                                transition: 'color 0.15s ease'
                            }} className="hover:text-emerald-400">
                                Profilim
                            </Link>
                        </>
                    ) : (
                        <>
                            <a href="#ozellikler" style={{
                                color: 'var(--text-secondary)',
                                transition: 'color 0.15s ease'
                            }} className="hover:text-emerald-400">
                                Özellikler
                            </a>
                            <a href="#nasil-calisir" style={{
                                color: 'var(--text-secondary)',
                                transition: 'color 0.15s ease'
                            }} className="hover:text-emerald-400">
                                Nasıl Çalışır?
                            </a>
                        </>
                    )}
                </nav>

                {/* Zone 3: Primary Action / User Profile */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexShrink: 0
                }}>
                    {currentUser ? (
                        <>
                            <Link to="/profile" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.4rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.84rem',
                                color: 'var(--text-primary)',
                                fontWeight: '500'
                            }}>
                                <User size={15} color="var(--accent-primary)" />
                                <span>{currentUser.name}</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                title="Çıkış Yap"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    background: 'transparent',
                                    transition: 'all 0.15s ease'
                                }}
                                className="hover:text-red-400 hover:border-red-500/30"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}>
                                Giriş Yap
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}>
                                Ücretsiz Başla
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;

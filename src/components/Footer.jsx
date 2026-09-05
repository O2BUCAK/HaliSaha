import React from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import packageJson from '../../package.json';

const Footer = () => {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '1.25rem 1rem',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)'
        }}>
            <div className="container" style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <MessageSquare size={15} color="var(--accent-primary)" />
                        Öneri, istek ve görüşleriniz için:
                    </span>
                    <a
                        href="mailto:ersin@ozbucak.com.tr?subject=Hal%C4%B1%20Saha%20%C4%B0statistik%20-%20%C3%96neri%20%2F%20%C4%B0stek"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--accent-primary)',
                            fontWeight: '500',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.25)',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                        }}
                    >
                        <Mail size={13} />
                        ersin@ozbucak.com.tr
                    </a>
                </div>

                <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    opacity: 0.85
                }}>
                    Halı Saha İstatistik v{packageJson.version}
                </div>
            </div>
        </footer>
    );
};

export default Footer;

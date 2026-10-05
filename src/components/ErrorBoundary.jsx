import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="card" style={{
                        maxWidth: '520px',
                        width: '100%',
                        textAlign: 'center',
                        padding: '2.5rem 1.5rem',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem auto'
                        }}>
                            <AlertTriangle size={32} color="var(--accent-danger)" />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                            Beklenmeyen Bir Hata Oluştu
                        </h2>
                        <p style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6',
                            marginBottom: '1.5rem'
                        }}>
                            İşlem gerçekleştirilirken geçici bir teknik aksaklık meydana geldi. Sayfayı yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={this.handleReload}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <RefreshCw size={16} /> Sayfayı Yenile
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <Home size={16} /> Ana Sayfaya Dön
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

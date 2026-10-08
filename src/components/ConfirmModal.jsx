import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    title = 'Emin misiniz?',
    message = 'Bu işlem geri alınamaz.',
    confirmText = 'Evet, Onayla',
    cancelText = 'Vazgeç',
    isDanger = true,
    isLoading = false,
    error = null,
    onConfirm,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) {
                    onClose();
                }
            }}
        >
            <div
                className="card"
                style={{
                    maxWidth: '480px',
                    width: '100%',
                    position: 'relative',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg, 12px)',
                    animation: 'fadeIn 0.15s ease-out'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: isDanger ? '#ef4444' : '#3b82f6',
                                flexShrink: 0
                            }}
                        >
                            {isDanger ? <AlertTriangle size={22} /> : <AlertTriangle size={22} />}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {title}
                            </h3>
                        </div>
                    </div>
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '4px'
                            }}
                            aria-label="Kapat"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {message}
                </div>

                {/* Error Banner */}
                {error && (
                    <div
                        style={{
                            marginBottom: '1.25rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontSize: '0.875rem'
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        style={{ padding: '0.6rem 1.25rem' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="btn"
                        style={{
                            padding: '0.6rem 1.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: isDanger ? '#dc2626' : 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                İşleniyor...
                            </>
                        ) : (
                            <>
                                {isDanger && <Trash2 size={16} />}
                                {confirmText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

import React, { useState, useMemo, useEffect } from 'react';
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Shield,
    Copy,
    Check,
    Users,
    DollarSign,
    Send,
    RotateCcw,
    Sparkles,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Save,
    AlertCircle,
    Hand,
    Calculator,
    BookmarkCheck,
    Wallet
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const FeeCollectionTracker = ({
    match,
    group,
    isAdmin = false,
    onSaveSuccess
}) => {
    const { updateMatchPaymentTracking, updateGroupFeeSettings } = useData();

    // Load initial settings from match.paymentTracking, fallback to group.feeSettings
    const savedTracking = match?.paymentTracking || {};
    const defaultGroupFees = group?.feeSettings || {};

    const [totalPitchFee, setTotalPitchFee] = useState(
        savedTracking.totalPitchFee !== undefined ? savedTracking.totalPitchFee : (defaultGroupFees.defaultPitchFee || 2100)
    );
    const [splitMode, setSplitMode] = useState(savedTracking.splitMode || 'auto'); // 'auto' | 'manual'
    const [manualPerPlayerFee, setManualPerPlayerFee] = useState(
        savedTracking.manualPerPlayerFee || defaultGroupFees.defaultPerPlayerFee || 150
    );

    // Kapora / Down payment settings (Yer ayırtırken verilen kapora)
    const [depositPaid, setDepositPaid] = useState(
        savedTracking.depositPaid !== undefined
            ? Boolean(savedTracking.depositPaid)
            : Boolean(savedTracking.depositAmount && Number(savedTracking.depositAmount) > 0)
    );
    const [depositAmount, setDepositAmount] = useState(
        savedTracking.depositAmount !== undefined ? savedTracking.depositAmount : ''
    );
    const [depositPayer, setDepositPayer] = useState(
        savedTracking.depositPayer || 'admin' // 'admin' (Yönetici) | 'cashbox' (Kasa) | 'player' (Belirli bir oyuncu)
    );
    const [depositPayerPlayerId, setDepositPayerPlayerId] = useState(
        savedTracking.depositPayerPlayerId || ''
    );
    const [depositNote, setDepositNote] = useState(
        savedTracking.depositNote || ''
    );
    const [depositDate] = useState(
        savedTracking.depositDate || ''
    );

    // Goalkeeper exemption (User request: Kalecilerden para alınmasın - default to true unless explicitly disabled)
    const [goalkeepersExempt, setGoalkeepersExempt] = useState(
        savedTracking.goalkeepersExempt !== undefined
            ? savedTracking.goalkeepersExempt
            : (defaultGroupFees.goalkeepersExempt !== undefined ? defaultGroupFees.goalkeepersExempt : true)
    );

    // Division Count Mode: 'auto' | 'manual' (User request: bölünecek kişi sayısı da manuel girilebilsin)
    const [divisionCountMode, setDivisionCountMode] = useState(
        savedTracking.divisionCountMode || 'auto'
    );
    const [manualDivisionCount, setManualDivisionCount] = useState(
        savedTracking.manualDivisionCount !== undefined && savedTracking.manualDivisionCount !== null
            ? savedTracking.manualDivisionCount
            : (savedTracking.effectiveDivisionCount || '')
    );

    const [adminIban, setAdminIban] = useState(
        savedTracking.adminIban || defaultGroupFees.adminIban || ''
    );
    const [adminAccountName, setAdminAccountName] = useState(
        savedTracking.adminAccountName || defaultGroupFees.adminAccountName || ''
    );
    const [paymentNotes, setPaymentNotes] = useState(
        savedTracking.paymentNotes || defaultGroupFees.paymentNotes || 'Açıklamaya adınızı yazınız.'
    );

    // Players map: { [playerId]: { status: 'paid'|'unpaid'|'partial'|'exempt', amountPaid: number, method: 'transfer'|'cash', note: '' } }
    const [playerPayments, setPlayerPayments] = useState(savedTracking.players || {});

    const [isSaving, setIsSaving] = useState(false);
    const [copiedIban, setCopiedIban] = useState(false);
    const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
    const [savedAsGroupDefault, setSavedAsGroupDefault] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [saveToast, setSaveToast] = useState(null);

    // Collect participating players from match (teamA and teamB), preserving isGoalkeeper
    const matchPlayers = useMemo(() => {
        const teamA = (match?.teamA || []).map(p => ({
            ...p,
            team: 'teamA',
            teamName: match?.teamAName || 'Takım A',
            isGoalkeeper: Boolean(p.isGoalkeeper)
        }));
        const teamB = (match?.teamB || []).map(p => ({
            ...p,
            team: 'teamB',
            teamName: match?.teamBName || 'Takım B',
            isGoalkeeper: Boolean(p.isGoalkeeper)
        }));
        
        // Remove duplicates if any
        const map = new Map();
        [...teamA, ...teamB].forEach(p => {
            if (p && p.id && !map.has(String(p.id))) {
                map.set(String(p.id), p);
            }
        });
        return Array.from(map.values());
    }, [match?.teamA, match?.teamB, match?.teamAName, match?.teamBName]);

    // Automatically exempt goalkeepers if goalkeepersExempt is true and match has no prior custom payments
    useEffect(() => {
        if (goalkeepersExempt && Object.keys(savedTracking.players || {}).length === 0 && matchPlayers.length > 0) {
            const initialExemptions = {};
            let hasGk = false;
            matchPlayers.forEach(p => {
                if (p.isGoalkeeper) {
                    hasGk = true;
                    initialExemptions[String(p.id)] = {
                        status: 'exempt',
                        amountPaid: 0,
                        method: 'transfer',
                        note: 'Kaleci (Muaf)'
                    };
                }
            });
            if (hasGk) {
                setPlayerPayments(prev => ({ ...initialExemptions, ...prev }));
            }
        }
    }, [matchPlayers, goalkeepersExempt, savedTracking.players]);

    // Count paying (non-exempt) players automatically
    const autoPayingCount = useMemo(() => {
        const exemptCount = matchPlayers.filter(p => playerPayments[String(p.id)]?.status === 'exempt').length;
        const total = matchPlayers.length - exemptCount;
        return total > 0 ? total : 1;
    }, [matchPlayers, playerPayments]);

    // Effective number of people to divide the pitch fee by (manual or auto)
    const effectiveDivisionCount = useMemo(() => {
        if (divisionCountMode === 'manual') {
            const parsed = parseInt(manualDivisionCount, 10);
            if (!isNaN(parsed) && parsed > 0) {
                return parsed;
            }
        }
        return autoPayingCount;
    }, [divisionCountMode, manualDivisionCount, autoPayingCount]);

    // Calculate effective per-player fee based on total fee and effective division count
    const perPlayerFee = useMemo(() => {
        if (splitMode === 'manual') {
            return Number(manualPerPlayerFee) || 0;
        }
        const numericTotal = Number(totalPitchFee) || 0;
        if (numericTotal <= 0 || effectiveDivisionCount <= 0) return 0;
        return Math.round(numericTotal / effectiveDivisionCount);
    }, [splitMode, totalPitchFee, effectiveDivisionCount, manualPerPlayerFee]);

    // Toggle goalkeeper exemption across all goalkeepers in match
    const handleToggleGoalkeepersExempt = (shouldExempt) => {
        setGoalkeepersExempt(shouldExempt);
        setPlayerPayments(prev => {
            const next = { ...prev };
            matchPlayers.forEach(p => {
                if (p.isGoalkeeper) {
                    const pid = String(p.id);
                    if (shouldExempt) {
                        next[pid] = {
                            ...(next[pid] || {}),
                            status: 'exempt',
                            amountPaid: 0,
                            note: 'Kaleci (Muaf)'
                        };
                    } else {
                        // If un-exempting, revert to unpaid
                        if (next[pid]?.status === 'exempt') {
                            next[pid] = {
                                ...(next[pid] || {}),
                                status: 'unpaid',
                                amountPaid: 0,
                                note: ''
                            };
                        }
                    }
                }
            });
            return next;
        });
    };

    // Apply currently calculated perPlayerFee to all paid players
    const handleApplyFeeToAllPlayers = () => {
        setPlayerPayments(prev => {
            const next = { ...prev };
            matchPlayers.forEach(p => {
                const pid = String(p.id);
                if (next[pid]?.status === 'paid') {
                    next[pid] = {
                        ...next[pid],
                        amountPaid: perPlayerFee
                    };
                }
            });
            return next;
        });
        setSaveToast({ type: 'success', message: `Hesaplanan ${perPlayerFee} ₺ tutarı oyunculara uygulandı!` });
        setTimeout(() => setSaveToast(null), 3000);
    };

    // Financial calculations
    const stats = useMemo(() => {
        let totalCollected = 0;
        let paidCount = 0;
        let unpaidCount = 0;
        let partialCount = 0;
        let exemptCount = 0;

        matchPlayers.forEach(p => {
            const pid = String(p.id);
            const pData = playerPayments[pid] || { status: 'unpaid' };

            if (pData.status === 'exempt') {
                exemptCount += 1;
            } else if (pData.status === 'paid') {
                paidCount += 1;
                const paidAmt = pData.amountPaid !== undefined ? Number(pData.amountPaid) : perPlayerFee;
                totalCollected += paidAmt;
            } else if (pData.status === 'partial') {
                partialCount += 1;
                totalCollected += Number(pData.amountPaid || 0);
            } else {
                unpaidCount += 1;
            }
        });

        const target = Number(totalPitchFee) || (perPlayerFee * effectiveDivisionCount);
        const deposit = depositPaid ? (Number(depositAmount) || 0) : 0;
        const remainingPitchPayment = Math.max(0, target - deposit); // Sahaya maç günü ödenecek kalan tutar
        const remaining = Math.max(0, target - totalCollected); // Oyunculardan toplanması gereken kalan
        const percent = target > 0 ? Math.min(100, Math.round((totalCollected / target) * 100)) : 0;
        const netCashInHand = totalCollected - (depositPaid && depositPayer === 'admin' ? deposit : 0);

        return {
            totalCollected,
            target,
            remaining,
            percent,
            paidCount,
            unpaidCount,
            partialCount,
            exemptCount,
            totalPlayers: matchPlayers.length,
            deposit,
            remainingPitchPayment,
            netCashInHand
        };
    }, [matchPlayers, playerPayments, totalPitchFee, perPlayerFee, effectiveDivisionCount, depositPaid, depositAmount, depositPayer]);

    // Update individual player payment status
    const handleSetPlayerStatus = (playerId, status) => {
        const pid = String(playerId);
        setPlayerPayments(prev => {
            const current = prev[pid] || {};
            let amount = current.amountPaid;

            if (status === 'paid') {
                amount = perPlayerFee;
            } else if (status === 'unpaid') {
                amount = 0;
            } else if (status === 'exempt') {
                amount = 0;
            } else if (status === 'partial' && (!amount || amount === 0)) {
                amount = Math.round(perPlayerFee / 2);
            }

            return {
                ...prev,
                [pid]: {
                    ...current,
                    status,
                    amountPaid: amount,
                    method: current.method || 'transfer',
                    paidAt: status === 'paid' ? new Date().toISOString() : current.paidAt
                }
            };
        });
    };

    // Update player paid amount
    const handleSetPlayerAmount = (playerId, amount) => {
        const pid = String(playerId);
        setPlayerPayments(prev => ({
            ...prev,
            [pid]: {
                ...(prev[pid] || {}),
                amountPaid: Number(amount) || 0
            }
        }));
    };

    // Update payment method (transfer | cash)
    const handleSetPlayerMethod = (playerId, method) => {
        const pid = String(playerId);
        setPlayerPayments(prev => ({
            ...prev,
            [pid]: {
                ...(prev[pid] || {}),
                method
            }
        }));
    };

    // Mark all players as paid
    const handleMarkAllPaid = () => {
        const newPayments = { ...playerPayments };
        matchPlayers.forEach(p => {
            const pid = String(p.id);
            if (newPayments[pid]?.status !== 'exempt') {
                newPayments[pid] = {
                    ...(newPayments[pid] || {}),
                    status: 'paid',
                    amountPaid: perPlayerFee,
                    method: newPayments[pid]?.method || 'transfer',
                    paidAt: new Date().toISOString()
                };
            }
        });
        setPlayerPayments(newPayments);
    };

    // Reset all payments to unpaid
    const handleResetAllPayments = () => {
        const newPayments = { ...playerPayments };
        matchPlayers.forEach(p => {
            const pid = String(p.id);
            if (newPayments[pid]?.status !== 'exempt') {
                newPayments[pid] = {
                    ...(newPayments[pid] || {}),
                    status: 'unpaid',
                    amountPaid: 0
                };
            }
        });
        setPlayerPayments(newPayments);
    };

    // Persist to Firestore
    const handleSaveTracking = async () => {
        setIsSaving(true);
        setSaveToast(null);
        try {
            const payload = {
                totalPitchFee: Number(totalPitchFee) || 0,
                splitMode,
                manualPerPlayerFee: Number(manualPerPlayerFee) || 0,
                calculatedPerPlayerFee: perPlayerFee,
                // Kapora / Yer ayırma ön ödeme bilgileri
                depositPaid: Boolean(depositPaid),
                depositAmount: depositPaid ? (Number(depositAmount) || 0) : 0,
                depositPayer: depositPaid ? depositPayer : 'admin',
                depositPayerPlayerId: (depositPaid && depositPayer === 'player') ? depositPayerPlayerId : null,
                depositNote: depositPaid ? (depositNote || '').trim() : '',
                depositDate: depositPaid ? (depositDate || new Date().toISOString()) : null,
                goalkeepersExempt,
                divisionCountMode,
                manualDivisionCount: divisionCountMode === 'manual' ? (parseInt(manualDivisionCount, 10) || effectiveDivisionCount) : null,
                effectiveDivisionCount,
                adminIban: (adminIban || '').trim(),
                adminAccountName: (adminAccountName || '').trim(),
                paymentNotes: (paymentNotes || '').trim(),
                players: playerPayments,
                updatedAt: new Date().toISOString()
            };

            const result = await updateMatchPaymentTracking(match.id, payload);
            if (result.success) {
                setSaveToast({ type: 'success', message: 'Ücret ve ödeme takip bilgileri kaydedildi!' });
                if (onSaveSuccess) onSaveSuccess();
            } else {
                setSaveToast({ type: 'error', message: result.error || 'Kaydedilemedi.' });
            }
        } catch (err) {
            console.error('Error saving payment tracking:', err);
            setSaveToast({ type: 'error', message: 'Bir hata oluştu.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveToast(null), 3500);
        }
    };

    // Save current IBAN & Account Name & Goalkeeper settings as group default
    const handleSaveAsGroupDefault = async () => {
        if (!group?.id) return;
        try {
            await updateGroupFeeSettings(group.id, {
                adminIban: (adminIban || '').trim(),
                adminAccountName: (adminAccountName || '').trim(),
                defaultPitchFee: Number(totalPitchFee) || 0,
                defaultPerPlayerFee: perPlayerFee,
                goalkeepersExempt,
                divisionCountMode,
                manualDivisionCount: divisionCountMode === 'manual' ? (parseInt(manualDivisionCount, 10) || null) : null,
                paymentNotes: (paymentNotes || '').trim()
            });
            setSavedAsGroupDefault(true);
            setTimeout(() => setSavedAsGroupDefault(false), 3000);
        } catch (err) {
            console.error('Error updating group fee settings:', err);
        }
    };

    // Copy IBAN
    const handleCopyIban = () => {
        if (!adminIban) return;
        navigator.clipboard.writeText(adminIban);
        setCopiedIban(true);
        setTimeout(() => setCopiedIban(false), 2500);
    };

    // Copy formatted WhatsApp reminder text
    const handleCopyWhatsappText = () => {
        const venueName = match?.venue || 'Halı Saha';
        const matchDate = match?.date
            ? `${new Date(match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} ${new Date(match.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
            : '';

        const paidList = [];
        const unpaidList = [];

        matchPlayers.forEach(p => {
            const pid = String(p.id);
            const data = playerPayments[pid] || { status: 'unpaid' };
            if (data.status === 'exempt') {
                paidList.push(`• ${p.name} (Muaf)`);
            } else if (data.status === 'paid') {
                const methodLabel = data.method === 'cash' ? 'Nakit' : 'Havale';
                paidList.push(`• ${p.name} (${data.amountPaid || perPlayerFee} ₺ - ${methodLabel})`);
            } else if (data.status === 'partial') {
                unpaidList.push(`• ${p.name} (${data.amountPaid || 0} ₺ ödendi / ${perPlayerFee - (data.amountPaid || 0)} ₺ kaldı)`);
            } else {
                unpaidList.push(`• ${p.name} (${perPlayerFee} ₺)`);
            }
        });

        const lines = [
            `⚽ *${venueName.toUpperCase()} - MAÇ ÜCRETİ BİLDİRİMİ*`,
            matchDate ? `📅 Tarih: ${matchDate}` : '',
            `💰 *Kişi Başı Ücret: ${perPlayerFee} TL* (Toplam Saha: ${totalPitchFee} TL)`,
            ''
        ];

        if (depositPaid && Number(depositAmount) > 0) {
            const payerLabel = depositPayer === 'admin'
                ? 'Yönetici tarafından verildi'
                : (depositPayer === 'cashbox' ? 'Grup kasasından ödendi' : `${matchPlayers.find(p => String(p.id) === String(depositPayerPlayerId))?.name || 'Oyuncu'} tarafından ödendi`);
            lines.push(`🔖 *Ödenen Kapora:* ${Number(depositAmount)} TL (${payerLabel})`);
            lines.push(`🏟️ *Sahaya Maç Günü Kalan Borç:* ${stats.remainingPitchPayment} TL`);
            lines.push('');
        }

        lines.push(
            `✅ *Ödeme Yapanlar (${paidList.length}/${matchPlayers.length}):*`,
            paidList.length > 0 ? paidList.join('\n') : '• Henüz ödeme yapılmadı.',
            '',
            `⏳ *Ödeme Beklenenler (${unpaidList.length}):*`,
            unpaidList.length > 0 ? unpaidList.join('\n') : '• Herkes ödemesini tamamladı! 👏',
            ''
        );

        if (adminIban) {
            lines.push('💳 *Ödeme Bilgileri:*');
            lines.push(`IBAN: ${adminIban}`);
            if (adminAccountName) lines.push(`Hesap Sahibi: ${adminAccountName}`);
            if (paymentNotes) lines.push(`Açıklama: ${paymentNotes}`);
            lines.push('');
        }

        lines.push(`📊 Durum: Toplanan ${stats.totalCollected} TL / Kalan ${stats.remaining} TL`);
        lines.push('Lütfen maç öncesi/sonrası ödemenizi tamamlayınız. Teşekkürler! ⚽');

        const fullText = lines.filter(l => l !== undefined).join('\n');
        navigator.clipboard.writeText(fullText);
        setCopiedWhatsapp(true);
        setTimeout(() => setCopiedWhatsapp(false), 3000);
    };

    // SECURITY: Strictly deny rendering if not group admin
    if (!isAdmin) {
        return null;
    }

    return (
        <div style={{
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Header with Secret Admin Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                paddingBottom: isExpanded ? '1rem' : '0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                                Saha Ücreti & Kasa Takibi
                            </h3>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: 'rgba(234, 179, 8, 0.2)',
                                border: '1px solid rgba(234, 179, 8, 0.4)',
                                color: '#facc15',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: '600'
                            }}>
                                <Shield size={11} /> Sadece Grup Yöneticisi Görür
                            </span>
                        </div>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Katılan oyuncuların ücret ödemelerini kaydedin, kalan tutarı ve kasayı canlı takip edin.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={handleCopyWhatsappText}
                        className="btn btn-secondary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.8rem',
                            padding: '0.45rem 0.8rem',
                            borderColor: copiedWhatsapp ? '#22c55e' : 'rgba(34, 197, 94, 0.4)',
                            color: copiedWhatsapp ? '#22c55e' : '#86efac'
                        }}
                        title="Ödeme durumunu ve IBAN'ı WhatsApp grubu için kopyala"
                    >
                        {copiedWhatsapp ? <Check size={14} /> : <Send size={14} />}
                        {copiedWhatsapp ? 'Mesaj Kopyalandı!' : 'WhatsApp Hatırlatması'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveTracking}
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.8rem',
                            padding: '0.45rem 0.9rem'
                        }}
                    >
                        <Save size={14} /> {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.6rem' }}
                        title={isExpanded ? 'Daralt' : 'Genişlet'}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {saveToast && (
                <div style={{
                    marginTop: '0.85rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: saveToast.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${saveToast.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    color: saveToast.type === 'success' ? '#86efac' : '#fca5a5'
                }}>
                    {saveToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {saveToast.message}
                </div>
            )}

            {isExpanded && (
                <>
                    {/* Live Financial Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.85rem',
                        marginTop: '1.25rem',
                        marginBottom: '1.25rem'
                    }}>
                        {/* Collected Card */}
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.08)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <CheckCircle2 size={14} /> Toplanan Tutar
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e', marginTop: '0.2rem' }}>
                                {stats.totalCollected.toLocaleString('tr-TR')} ₺
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
                                {stats.paidCount} / {stats.totalPlayers} oyuncu ödedi
                            </div>
                        </div>

                        {/* Remaining Card */}
                        <div style={{
                            background: stats.remaining > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                            border: `1px solid ${stats.remaining > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: stats.remaining > 0 ? '#fca5a5' : '#86efac', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={14} /> Kalan / Eksik Tutar
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: stats.remaining > 0 ? '#ef4444' : '#22c55e', marginTop: '0.2rem' }}>
                                {stats.remaining.toLocaleString('tr-TR')} ₺
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
                                {stats.remaining === 0 ? 'Tamamı tahsil edildi 🎉' : `${stats.unpaidCount} kişi bekleniyor`}
                            </div>
                        </div>

                        {/* Target Fee Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <DollarSign size={14} /> Toplam Saha Ücreti
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                {stats.target.toLocaleString('tr-TR')} ₺
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.1rem', fontWeight: '600' }}>
                                Kişi Başı: {perPlayerFee} ₺
                            </div>
                        </div>

                        {/* Collection Progress Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Toplanma Oranı</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: stats.percent >= 100 ? '#22c55e' : 'var(--accent-primary)' }}>
                                    %{stats.percent}
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '9px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${stats.percent}%`,
                                    background: stats.percent >= 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)',
                                    borderRadius: '6px',
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Kapora Durumu Canlı Bilgi Çubuğu */}
                    {depositPaid && Number(depositAmount) > 0 && (
                        <div style={{
                            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12) 0%, rgba(30, 41, 59, 0.6) 100%)',
                            border: '1px solid rgba(234, 179, 8, 0.35)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.65rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'rgba(234, 179, 8, 0.2)',
                                    color: '#facc15',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BookmarkCheck size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fef08a' }}>
                                        Önden Kapora Ödendi: {Number(depositAmount).toLocaleString('tr-TR')} ₺
                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: '400', marginLeft: '0.5rem' }}>
                                            ({depositPayer === 'admin' ? 'Yönetici Cebinden' : (depositPayer === 'cashbox' ? 'Grup Kasasından' : `${matchPlayers.find(p => String(p.id) === String(depositPayerPlayerId))?.name || 'Oyuncu'} Ödedi`)})
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
                                        {depositNote ? `Not: ${depositNote}` : 'Yer ayırtılırken sahaya ön ödeme olarak verildi.'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                    Maç Günü Sahaya Kalan Borç:
                                </div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#38bdf8' }}>
                                    {stats.remainingPitchPayment.toLocaleString('tr-TR')} ₺
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Setup & Configuration Panel */}
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        marginBottom: '1.25rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            {/* Total Pitch Fee Input */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                    Toplam Saha Kirası (TL)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={totalPitchFee}
                                        onChange={(e) => setTotalPitchFee(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '2.2rem', fontWeight: '600', fontSize: '0.95rem' }}
                                    />
                                    <span style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>₺</span>
                                </div>
                            </div>

                            {/* Split Mode Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                    Hesaplama Modu
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSplitMode('auto')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            fontSize: '0.78rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: splitMode === 'auto' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                                            border: splitMode === 'auto' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            color: splitMode === 'auto' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ⚡ Sahayı Kişilere Böl
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSplitMode('manual')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            fontSize: '0.78rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: splitMode === 'manual' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                                            border: splitMode === 'manual' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            color: splitMode === 'manual' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ✏️ Sabit Kişi Başı Tutar
                                    </button>
                                </div>
                            </div>

                            {/* Manual per player fee if manual mode */}
                            {splitMode === 'manual' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                        Sabit Kişi Başı Tutar (TL)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="10"
                                        value={manualPerPlayerFee}
                                        onChange={(e) => setManualPerPlayerFee(e.target.value)}
                                        style={{ width: '100%', fontWeight: '600' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Yer Ayırma Kaporası (Ön Ödeme) Paneli */}
                        <div style={{
                            marginTop: '1rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: depositPaid ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem 0.85rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <BookmarkCheck size={16} color={depositPaid ? '#eab308' : 'var(--text-secondary)'} />
                                        Yer Ayırma Kaporası (Ön Ödeme)
                                        {depositPaid && Number(depositAmount) > 0 && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: 'rgba(234, 179, 8, 0.2)',
                                                border: '1px solid rgba(234, 179, 8, 0.4)',
                                                color: '#facc15',
                                                fontWeight: '700'
                                            }}>
                                                {Number(depositAmount).toLocaleString('tr-TR')} ₺ Ödendi
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                        Halısahada yer ayırtırken sahaya önden kapora verildiğinde buraya girerek kalan saha borcunu ve kasa durumunu takip edin.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDepositPaid(true);
                                            if (!depositAmount || Number(depositAmount) === 0) {
                                                setDepositAmount(500);
                                            }
                                        }}
                                        style={{
                                            padding: '0.35rem 0.7rem',
                                            fontSize: '0.76rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: depositPaid ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                                            background: depositPaid ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.03)',
                                            color: depositPaid ? '#fde047' : 'var(--text-secondary)',
                                            fontWeight: depositPaid ? '700' : '500',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        {depositPaid && <Check size={12} />} 🔖 Kapora Verildi
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDepositPaid(false);
                                        }}
                                        style={{
                                            padding: '0.35rem 0.7rem',
                                            fontSize: '0.76rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: !depositPaid ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                                            background: !depositPaid ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                            color: !depositPaid ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontWeight: !depositPaid ? '700' : '500',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        {!depositPaid && <Check size={12} />} Kapora Verilmedi
                                    </button>
                                </div>
                            </div>

                            {depositPaid && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '0.85rem',
                                        alignItems: 'flex-start'
                                    }}>
                                        {/* Kapora Tutarı */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#fef08a', marginBottom: '0.3rem' }}>
                                                Ödenen Kapora Tutarı (TL)
                                            </label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="50"
                                                    value={depositAmount}
                                                    onChange={(e) => setDepositAmount(e.target.value)}
                                                    placeholder="500"
                                                    style={{
                                                        width: '100%',
                                                        paddingLeft: '2rem',
                                                        fontWeight: '700',
                                                        fontSize: '0.95rem',
                                                        border: '1px solid #eab308'
                                                    }}
                                                />
                                                <span style={{ position: 'absolute', left: '10px', top: '9px', color: '#eab308', fontWeight: '700' }}>₺</span>
                                            </div>

                                            {/* Hızlı Tutar Seçimi */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Hızlı Seç:</span>
                                                {[200, 300, 400, 500, 750, 1000].map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setDepositAmount(amt)}
                                                        style={{
                                                            padding: '0.15rem 0.45rem',
                                                            fontSize: '0.72rem',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            background: Number(depositAmount) === amt ? '#eab308' : 'rgba(255,255,255,0.06)',
                                                            color: Number(depositAmount) === amt ? '#000' : '#f8fafc',
                                                            fontWeight: '600',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {amt} ₺
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Kaporayı Kim Ödedi? */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                                Kaporayı Kim Ödedi?
                                            </label>
                                            <select
                                                value={depositPayer}
                                                onChange={(e) => {
                                                    setDepositPayer(e.target.value);
                                                    if (e.target.value !== 'player') {
                                                        setDepositPayerPlayerId('');
                                                    }
                                                }}
                                                style={{ width: '100%', fontSize: '0.85rem', padding: '0.45rem 0.6rem' }}
                                            >
                                                <option value="admin">👤 Yönetici (Kendi Cebimden)</option>
                                                <option value="cashbox">🏦 Grup Ortak Kasasından</option>
                                                <option value="player">⚽ Belirli Bir Oyuncu Ödedi</option>
                                            </select>

                                            {depositPayer === 'player' && (
                                                <div style={{ marginTop: '0.45rem' }}>
                                                    <select
                                                        value={depositPayerPlayerId}
                                                        onChange={(e) => setDepositPayerPlayerId(e.target.value)}
                                                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem', borderColor: '#eab308' }}
                                                    >
                                                        <option value="">-- Kaporayı Ödeyen Oyuncuyu Seçin --</option>
                                                        {matchPlayers.map(p => (
                                                            <option key={p.id} value={String(p.id)}>
                                                                {p.name} ({p.teamName || (p.team === 'teamA' ? 'Takım A' : 'Takım B')})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Kapora Notu / Dekont Açıklaması */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                                Kapora Notu / Dekont Bilgisi
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Örn: FAST ile sahaya yollandı / Dekont no"
                                                value={depositNote}
                                                onChange={(e) => setDepositNote(e.target.value)}
                                                style={{ width: '100%', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sahaya Maç Günü Kalan Ödeme Bilgilendirme Kutusu */}
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(234, 179, 8, 0.2)',
                                        borderRadius: '4px',
                                        padding: '0.6rem 0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '0.65rem'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: '#f8fafc' }}>
                                            🏟️ <strong>Toplam Saha:</strong> {Number(totalPitchFee).toLocaleString('tr-TR')} ₺ &nbsp;|&nbsp;
                                            🔖 <strong>Verilen Kapora:</strong> <span style={{ color: '#facc15', fontWeight: '700' }}>{Number(depositAmount || 0).toLocaleString('tr-TR')} ₺</span> &nbsp;|&nbsp;
                                            ⏳ <strong>Maç Günü Sahaya Kalan Borç:</strong> <span style={{ color: '#38bdf8', fontWeight: '800', fontSize: '0.95rem' }}>{stats.remainingPitchPayment.toLocaleString('tr-TR')} ₺</span>
                                        </div>

                                        {depositPayer === 'player' && depositPayerPlayerId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSetPlayerStatus(depositPayerPlayerId, 'paid');
                                                    setSaveToast({
                                                        type: 'success',
                                                        message: 'Kaporayı ödeyen oyuncunun maç ücreti ödendi olarak işaretlendi!'
                                                    });
                                                    setTimeout(() => setSaveToast(null), 3000);
                                                }}
                                                className="btn btn-secondary"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderColor: '#eab308',
                                                    color: '#fde047',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                <Check size={12} /> Bu Oyuncunun Maç Payını 'Ödendi' Yap
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kaleciler Muafiyeti & Bölünecek Kişi Sayısı Paneli */}
                        {splitMode === 'auto' && (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* 1. Kalecilerden Para Alınmasın mı? */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.75rem 0.85rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Hand size={15} color="#eab308" /> Kaleci Ücret Muafiyeti
                                            </div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                                Biz kalecilerden para almıyoruz, ancak alan gruplar için ayarlanabilir.
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleGoalkeepersExempt(true)}
                                                style={{
                                                    padding: '0.35rem 0.7rem',
                                                    fontSize: '0.76rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    border: goalkeepersExempt ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                                                    background: goalkeepersExempt ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.03)',
                                                    color: goalkeepersExempt ? '#86efac' : 'var(--text-secondary)',
                                                    fontWeight: goalkeepersExempt ? '700' : '500',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                {goalkeepersExempt && <Check size={12} />} 🧤 Kalecilerden Para Alınmasın (Muaf)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleToggleGoalkeepersExempt(false)}
                                                style={{
                                                    padding: '0.35rem 0.7rem',
                                                    fontSize: '0.76rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    border: !goalkeepersExempt ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                                    background: !goalkeepersExempt ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)',
                                                    color: !goalkeepersExempt ? '#38bdf8' : 'var(--text-secondary)',
                                                    fontWeight: !goalkeepersExempt ? '700' : '500',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                {!goalkeepersExempt && <Check size={12} />} ⚽ Kaleciler de Ödesin (Herkes Eşit)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Bölünecek Kişi Sayısı (Otomatik veya Manuel) */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.75rem 0.85rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem', marginBottom: divisionCountMode === 'manual' ? '0.75rem' : '0' }}>
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Calculator size={15} color="var(--accent-primary)" /> Ücretin Bölüneceği Kişi Sayısı
                                            </div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                                {divisionCountMode === 'auto'
                                                    ? `Kadroya göre otomatik (${matchPlayers.length} toplam - ${matchPlayers.length - autoPayingCount} muaf/kaleci = ${autoPayingCount} kişi)`
                                                    : 'Yönetici tarafından manuel belirlenmiş kişi sayısına bölünür.'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setDivisionCountMode('auto')}
                                                style={{
                                                    padding: '0.35rem 0.7rem',
                                                    fontSize: '0.76rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    border: divisionCountMode === 'auto' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                                    background: divisionCountMode === 'auto' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.03)',
                                                    color: divisionCountMode === 'auto' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                    fontWeight: divisionCountMode === 'auto' ? '700' : '500',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                {divisionCountMode === 'auto' && <Check size={12} />} ⚡ Otomatik ({autoPayingCount} Kişi)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDivisionCountMode('manual');
                                                    if (!manualDivisionCount) {
                                                        setManualDivisionCount(autoPayingCount || 12);
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.35rem 0.7rem',
                                                    fontSize: '0.76rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    border: divisionCountMode === 'manual' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                                                    background: divisionCountMode === 'manual' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.03)',
                                                    color: divisionCountMode === 'manual' ? '#fde047' : 'var(--text-secondary)',
                                                    fontWeight: divisionCountMode === 'manual' ? '700' : '500',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                {divisionCountMode === 'manual' && <Check size={12} />} ✏️ Manuel Kişi Sayısı Gir
                                            </button>
                                        </div>
                                    </div>

                                    {/* Manuel Kişi Sayısı Girişi ve Hızlı Seçim Butonları */}
                                    {divisionCountMode === 'manual' && (
                                        <div style={{
                                            background: 'rgba(234, 179, 8, 0.08)',
                                            border: '1px solid rgba(234, 179, 8, 0.25)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '0.65rem 0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: '0.65rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fef08a' }}>
                                                    Bölünecek Kişi Sayısı:
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={manualDivisionCount}
                                                    onChange={(e) => setManualDivisionCount(e.target.value)}
                                                    style={{
                                                        width: '75px',
                                                        padding: '0.3rem 0.45rem',
                                                        fontSize: '0.95rem',
                                                        fontWeight: '700',
                                                        textAlign: 'center',
                                                        border: '1px solid #eab308',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                                <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: '500' }}>Kişi</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Hızlı Seç:</span>
                                                {[10, 11, 12, 13, 14, 16].map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setManualDivisionCount(num)}
                                                        style={{
                                                            padding: '0.2rem 0.5rem',
                                                            fontSize: '0.75rem',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            background: Number(manualDivisionCount) === num ? '#eab308' : 'rgba(255,255,255,0.08)',
                                                            color: Number(manualDivisionCount) === num ? '#000' : '#f8fafc',
                                                            fontWeight: '700',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Formül ve Uygulama Çubuğu */}
                                    <div style={{
                                        marginTop: '0.65rem',
                                        padding: '0.5rem 0.75rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: '#f8fafc' }}>
                                            📊 Hesap: <strong>{totalPitchFee || 0} ₺</strong> ÷ <strong>{effectiveDivisionCount} kişi</strong> = <span style={{ color: '#22c55e', fontWeight: '800', fontSize: '0.95rem' }}>{perPlayerFee} ₺</span> / kişi
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleApplyFeeToAllPlayers}
                                            className="btn btn-secondary"
                                            style={{
                                                fontSize: '0.74rem',
                                                padding: '0.25rem 0.6rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                color: '#86efac',
                                                borderColor: 'rgba(34, 197, 94, 0.4)'
                                            }}
                                            title="Hesaplanan bu tutarı ödeyen oyuncuların tutar alanlarına uygula"
                                        >
                                            <RotateCcw size={12} /> Hesaplanan Tutarı ({perPlayerFee} ₺) Oyunculara Uygula
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* IBAN & Account Holder Section */}
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', alignItems: 'flex-end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                        Yönetici IBAN (Havale / FAST için)
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <input
                                            type="text"
                                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                                            value={adminIban}
                                            onChange={(e) => setAdminIban(e.target.value)}
                                            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
                                        />
                                        {adminIban && (
                                            <button
                                                type="button"
                                                onClick={handleCopyIban}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.45rem 0.65rem' }}
                                                title="IBAN'ı Kopyala"
                                            >
                                                {copiedIban ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                        Hesap Sahibi (Ad Soyad)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Ersin Özbudak"
                                        value={adminAccountName}
                                        onChange={(e) => setAdminAccountName(e.target.value)}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                        Ödeme Açıklaması / Notu
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Açıklamaya adınızı yazınız"
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={handleSaveAsGroupDefault}
                                        className="btn btn-secondary"
                                        style={{
                                            width: '100%',
                                            fontSize: '0.78rem',
                                            padding: '0.55rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem'
                                        }}
                                        title="Bu IBAN ve tutar ayarlarını sonraki maçlarda otomatik gelmesi için grup varsayılanı yap"
                                    >
                                        <Sparkles size={13} color="var(--accent-primary)" />
                                        {savedAsGroupDefault ? 'Varsayılan Olarak Kaydedildi!' : 'Grup Varsayılanı Yap'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Controls */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                    }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Users size={16} /> Oyuncular ve Ödeme Durumu ({matchPlayers.length} Oyuncu)
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleMarkAllPaid}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.3rem 0.65rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    borderColor: 'rgba(34, 197, 94, 0.4)',
                                    color: '#86efac'
                                }}
                            >
                                <CheckCircle2 size={13} /> Herkesi Ödendi Yap
                            </button>

                            <button
                                type="button"
                                onClick={handleResetAllPayments}
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.3rem 0.65rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <RotateCcw size={13} /> Sıfırla
                            </button>
                        </div>
                    </div>

                    {/* Player Payment List */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden'
                    }}>
                        {matchPlayers.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Bu maç için henüz kadro seçilmedi. Kadro seçildiğinde oyuncular burada listelenecektir.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid rgba(255,255,255,0.05)' }}>
                                {matchPlayers.map((player, index) => {
                                    const pid = String(player.id);
                                    const pData = playerPayments[pid] || { status: 'unpaid', amountPaid: 0, method: 'transfer' };
                                    const status = pData.status || 'unpaid';
                                    const teamColor = player.team === 'teamA' ? (match?.teamAColor || '#2563eb') : (match?.teamBColor || '#dc2626');

                                    return (
                                        <div
                                            key={pid}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 1rem',
                                                background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                borderBottom: index < matchPlayers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                flexWrap: 'wrap',
                                                gap: '0.75rem'
                                            }}
                                        >
                                            {/* Player Name & Team */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: '180px' }}>
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: teamColor,
                                                    boxShadow: `0 0 8px ${teamColor}66`,
                                                    flexShrink: 0
                                                }} />
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {player.name}
                                                        {player.isGoalkeeper && (
                                                            <span style={{
                                                                fontSize: '0.68rem',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(234, 179, 8, 0.2)',
                                                                border: '1px solid rgba(234, 179, 8, 0.4)',
                                                                color: '#facc15',
                                                                fontWeight: '700',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '2px'
                                                            }}>
                                                                🧤 Kaleci
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                        {player.teamName || (player.team === 'teamA' ? 'Takım A' : 'Takım B')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Buttons */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPlayerStatus(pid, 'paid')}
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        border: status === 'paid' ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                                                        background: status === 'paid' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.03)',
                                                        color: status === 'paid' ? '#86efac' : 'var(--text-secondary)',
                                                        fontWeight: status === 'paid' ? '700' : '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <CheckCircle2 size={12} /> Ödendi
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPlayerStatus(pid, 'unpaid')}
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        border: status === 'unpaid' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                                        background: status === 'unpaid' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.03)',
                                                        color: status === 'unpaid' ? '#fca5a5' : 'var(--text-secondary)',
                                                        fontWeight: status === 'unpaid' ? '700' : '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <XCircle size={12} /> Ödenmedi
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPlayerStatus(pid, 'partial')}
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        border: status === 'partial' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                                                        background: status === 'partial' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.03)',
                                                        color: status === 'partial' ? '#fef08a' : 'var(--text-secondary)',
                                                        fontWeight: status === 'partial' ? '700' : '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <Clock size={12} /> Kısmi
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSetPlayerStatus(pid, 'exempt')}
                                                    style={{
                                                        padding: '0.3rem 0.55rem',
                                                        fontSize: '0.72rem',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        border: status === 'exempt' ? '1px solid #94a3b8' : '1px solid rgba(255,255,255,0.08)',
                                                        background: status === 'exempt' ? 'rgba(148, 163, 184, 0.25)' : 'transparent',
                                                        color: status === 'exempt' ? '#e2e8f0' : 'rgba(255,255,255,0.4)',
                                                        fontWeight: status === 'exempt' ? '600' : '400'
                                                    }}
                                                    title="Muaf (Kaleci / İkram - ücrete dahil edilmez)"
                                                >
                                                    Muaf
                                                </button>
                                            </div>

                                            {/* Amount & Method Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {status !== 'exempt' && (
                                                    <>
                                                        {/* Amount Input */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="10"
                                                                disabled={status === 'unpaid'}
                                                                value={status === 'unpaid' ? 0 : (pData.amountPaid !== undefined ? pData.amountPaid : perPlayerFee)}
                                                                onChange={(e) => handleSetPlayerAmount(pid, e.target.value)}
                                                                style={{
                                                                    width: '68px',
                                                                    padding: '0.25rem 0.4rem',
                                                                    fontSize: '0.8rem',
                                                                    textAlign: 'right',
                                                                    opacity: status === 'unpaid' ? 0.4 : 1
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>₺</span>
                                                        </div>

                                                        {/* Payment Method Toggle */}
                                                        <select
                                                            value={pData.method || 'transfer'}
                                                            disabled={status === 'unpaid'}
                                                            onChange={(e) => handleSetPlayerMethod(pid, e.target.value)}
                                                            style={{
                                                                padding: '0.25rem 0.4rem',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '4px',
                                                                opacity: status === 'unpaid' ? 0.4 : 1
                                                            }}
                                                        >
                                                            <option value="transfer">Havale/FAST</option>
                                                            <option value="cash">Nakit</option>
                                                        </select>
                                                    </>
                                                )}

                                                {status === 'exempt' && (
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                        Ücretten Muaf
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bottom Save Reminder */}
                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <HelpCircle size={13} />
                            Değişikliklerin kaydedilmesi için "Kaydet" butonuna tıklayınız.
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveTracking}
                            disabled={isSaving}
                            className="btn btn-primary"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                padding: '0.5rem 1.25rem'
                            }}
                        >
                            <Save size={15} /> {isSaving ? 'Kaydediliyor...' : 'Ödemeleri Kaydet'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FeeCollectionTracker;

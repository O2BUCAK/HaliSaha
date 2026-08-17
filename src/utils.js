import { useEffect } from 'react';

/**
 * Converts Turkish string to title case properly.
 */
export const toTitleCase = (str) => {
    if (!str) return '';
    return String(str).trim().toLocaleLowerCase('tr-TR').split(/\s+/).map(word =>
        word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
    ).join(' ');
};

/**
 * Sanitizes user input string against invisible characters and excess whitespace.
 */
export const sanitizeInput = (val, maxLength = 500) => {
    if (val === null || val === undefined) return '';
    return String(val)
        .split('')
        .filter(char => {
            const code = char.charCodeAt(0);
            return (code >= 32 && code !== 127) || code === 10 || code === 13 || code === 9;
        })
        .join('')
        .trim()
        .slice(0, maxLength);
};

/**
 * Escapes HTML characters for safe string rendering where applicable.
 */
export const escapeHtml = (text) => {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Validates image upload file type and size.
 */
export const validateImageUpload = (file, maxSizeBytes = 2 * 1024 * 1024) => {
    if (!file) return { valid: false, error: 'Dosya seçilmedi.' };
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Sadece JPG, PNG, WEBP veya GIF formatları desteklenir.' };
    }
    if (file.size > maxSizeBytes) {
        return { valid: false, error: `Dosya boyutu en fazla ${Math.round(maxSizeBytes / (1024 * 1024))}MB olabilir.` };
    }
    return { valid: true };
};

export const useSEO = ({ title, description }) => {
    useEffect(() => {
        const safeTitle = sanitizeInput(title, 100);
        const safeDescription = sanitizeInput(description, 250);

        if (safeTitle) {
            document.title = `${safeTitle} | Halı Saha İstatistik Platformu`;
        } else {
            document.title = 'Halı Saha İstatistik Platformu | Arkadaş Grupları İçin Dijital Lig';
        }

        if (safeDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', safeDescription);

            let ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', safeDescription);

            let twitterDesc = document.querySelector('meta[property="twitter:description"]');
            if (twitterDesc) twitterDesc.setAttribute('content', safeDescription);
        }
    }, [title, description]);
};

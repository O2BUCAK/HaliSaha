import { useEffect } from 'react';

export const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLocaleLowerCase('tr-TR').split(' ').map(word =>
        word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
    ).join(' ');
};

export const useSEO = ({ title, description }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | Halı Saha İstatistik Platformu`;
        } else {
            document.title = 'Halı Saha İstatistik Platformu | Arkadaş Grupları İçin Dijital Lig';
        }

        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);

            let ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', description);

            let twitterDesc = document.querySelector('meta[property="twitter:description"]');
            if (twitterDesc) twitterDesc.setAttribute('content', description);
        }
    }, [title, description]);
};

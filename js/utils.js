// utils.js

export function generatePersonId() {
    return (window.crypto && window.crypto.getRandomValues)
        ? ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))
        : 'p' + Date.now() + Math.floor(Math.random()*10000);
} 
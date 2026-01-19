// utils.js

/**
 * Splits an amount into two equal parts with remainder handling
 * @function splitAmount
 * @param {number} amount - The amount to split
 * @returns {Array<number>} Array containing [firstShare, secondShare]
 * @description Splits an amount into two equal parts, assigning any remainder
 * to the second share to avoid rounding errors. This function is currently
 * unused in the application but preserved for potential future use.
 * 
 * @example
 * splitAmount(10.01) // Returns [5.00, 5.01]
 * splitAmount(10.00) // Returns [5.00, 5.00]
 */
export function splitAmount(amount) {
    const first = Math.floor(amount * 100 / 2) / 100;
    const second = Math.round((amount - first) * 100) / 100;
    return [first, second];
}

/**
 * Generates a unique identifier for people
 * @function generatePersonId
 * @returns {string} A unique identifier string
 * @description Creates a unique identifier using crypto.randomUUID() if available,
 * or falls back to a timestamp-based generator for older browsers. Used to
 * ensure each person has a stable, unique ID for state management and
 * custom split value preservation.
 * 
 * @example
 * generatePersonId() // Returns something like "550e8400-e29b-41d4-a716-446655440000"
 */
export function generatePersonId() {
    return (window.crypto && window.crypto.getRandomValues)
        ? ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))
        : 'p' + Date.now() + Math.floor(Math.random()*10000);
} 
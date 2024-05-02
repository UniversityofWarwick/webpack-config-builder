import Builder from './Builder.js';

/**
 * @returns {Builder}
 */
export function create() {
    return new Builder();
}

/**
 * Create a new builder for a Play project structure, with `app/assets` building to `target/assets`.
 * 
 * @returns {Builder}
 */
export function playApp() {
    return create().playApp();
}

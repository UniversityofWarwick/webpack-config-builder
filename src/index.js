import Builder from './Builder';

/**
 * @returns {Builder}
 */
function create() {
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

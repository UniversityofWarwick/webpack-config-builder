import Builder from './Builder';

function create() {
    return new Builder();
}

/** Create a new builder for a Play project structure, with `app/assets` building to `target/assets`. */
export function playApp() {
    return create().playApp();
}

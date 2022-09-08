export class ENoImplementation extends Error {
    constructor(_msg, ..._args) {
        super(_msg || "No implementation", ..._args);
    }
}
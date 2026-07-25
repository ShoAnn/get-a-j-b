export class HttpError extends Error {
    public statusCode: number;
    public context?: string;

    constructor(message: string, statusCode: number, context?: string) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.context = context;

        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

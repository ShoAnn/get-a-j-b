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
export class ValidationError extends HttpError {
    public fields?: Record<string, string[]>;

    constructor(
        message: string = 'Validation failed',
        fields?: Record<string, string[]>,
        context?: string
    ) {
        super(message, 422, context); // 422 Unprocessable Entity (use 400 if you prefer)
        this.name = 'ValidationError';
        this.fields = fields;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

class ExpressError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        // Omits the constructor call from the stack trace for clean debugging
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ExpressError;

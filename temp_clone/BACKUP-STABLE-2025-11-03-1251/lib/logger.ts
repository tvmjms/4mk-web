// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const currentLevel = process.env.NODE_ENV === 'production' ? LEVELS.warn : LEVELS.debug;

class Logger {
	private formatMessage(level: LogLevel, message: string): string {
		const ts = new Date().toISOString();
		return `[${ts}] [${level.toUpperCase()}] ${message}`;
	}

	debug(message: string, ...args: unknown[]): void {
		if (currentLevel <= LEVELS.debug) console.debug(this.formatMessage('debug', message), ...args);
	}

	info(message: string, ...args: unknown[]): void {
		if (currentLevel <= LEVELS.info) console.info(this.formatMessage('info', message), ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		if (currentLevel <= LEVELS.warn) console.warn(this.formatMessage('warn', message), ...args);
	}

	error(message: string, ...args: unknown[]): void {
		if (currentLevel <= LEVELS.error) console.error(this.formatMessage('error', message), ...args);
	}
}

export const appLogger = new Logger();
// Backwards-compatible alias for existing imports
export const logger = appLogger;

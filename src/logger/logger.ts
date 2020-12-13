import { format, transports, createLogger, Logger } from 'winston'
const { combine, timestamp, printf, colorize } = format;

// export default myLogger  
class LoggerHandler {
    private static _instance: Logger;

    private constructor() {
        LoggerHandler._instance = createLogger({
            format: combine(
                timestamp(),
                printf(({ level, message, timestamp }) => {
                    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
                }),
                
            ),
            transports: [
                new transports.Console({
                    level: 'silly',
                    eol: '\n', 
                    format: combine(
                        colorize({ all: true })
                    )
                }), 
                new transports.File({
                    filename: 'log.log', 
                     level: 'silly', 
                     options:{
                        encoding: 'utf8', 
                        flags: 'a'
                     }
                })

            ]
        })

        LoggerHandler._instance.error = (err): Logger => {
            if (err instanceof Error) {
                LoggerHandler._instance.log({ level: 'error', message: `${err.stack || err}` });
            } else {
                LoggerHandler._instance.log({ level: 'error', message: err });
            }
            return LoggerHandler._instance;
        };



    }

    public static get Instance(): Logger {
        if (this._instance)
            return this._instance
        else {
            let loggerHandler = new this();
            return this.Instance

        }
        
    }
}
const logger = LoggerHandler.Instance
export {logger} ;

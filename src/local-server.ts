import { Configuration } from './configuration';
import * as open from 'open';

export class LocalServer {
    protected server: any;
    protected url: string;
    constructor(private config: Configuration) {
        const port = this.config.options.flags.port;
        this.url = `http://localhost:${port}/`;
        const rserver = require('really-simple-http-server');
        this.server = rserver({
            path: config.options.args.path,
            port: port,
        });
    }

    start(doOpen = true) {
        this.server.start((err: any, server: any) => {
            if (err) throw err;
            this.config.info(`Local server started. Ctrl-C to stop. Access URL: ${this.url}`);
            if (doOpen) {
                this.open().then(() => this.stop());
            }
        });
    }

    stop() {
        this.server.stop();
    }

    open() {
        return open(this.url, {wait: true});
    }
}
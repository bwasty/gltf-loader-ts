// Adapted from THEE.FileLoader
// https://github.com/mrdoob/three.js/blob/master/src/loaders/FileLoader.js

import { LoadingManager } from './loadingmanager';

export type ProgressCallback = (xhr: XMLHttpRequest) => void;
export type XMLHttpRequestResponse = any;

export class FileLoader {
    manager: LoadingManager;
    path: string | undefined;
    responseType: XMLHttpRequestResponseType;
    withCredentials: boolean;
    mimeType: string;
    requestHeaders: { [k: string]: string } ;
    constructor(manager: LoadingManager) {
        this.manager = manager;
    }
    load(url: string, onProgress?: ProgressCallback): Promise<XMLHttpRequestResponse> {
        if (this.path !== undefined) { url = this.path + url; }
        url = this.manager.resolveURL(url);

        return new Promise((resolve, reject) => {
            // TODO!!: Check for data: URI
            // (-> Safari can not handle Data URIs through XMLHttpRequest so process manually)

            // NOTE: Not using `fetch` because it doesn't support progress reporting
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            const self = this;
            xhr.onload = function(event: ProgressEvent) {
                const response = this.response;

                /* istanbul ignore if */
                if (this.status === 0) {
                    // Some browsers return HTTP Status 0 when using non-http protocol
                    // e.g. 'file://' or 'data://'. Handle as success.
                    console.warn('FileLoader: HTTP Status 0 received.');
                    resolve(response);
                    self.manager.itemEnd(url);
                } else if (this.status === 200) {
                    resolve(response);
                    self.manager.itemEnd(url);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText,
                    });

                    self.manager.itemEnd(url);
                    self.manager.itemError(url);
                }
            };

            xhr.onprogress = (xhr: any) => {
                if (onProgress) {
                    onProgress(xhr);
                }
            };

            xhr.onerror = function(event: ErrorEvent) {
                reject({
                    status: this.status,
                    statusText: xhr.statusText,
                });
                self.manager.itemEnd(url);
                self.manager.itemError(url);
            };

            if (this.responseType) { xhr.responseType = this.responseType; }
            if (this.withCredentials) { xhr.withCredentials = this.withCredentials; }
            if (this.mimeType && xhr.overrideMimeType) {
                xhr.overrideMimeType(this.mimeType !== undefined ? this.mimeType : 'text/plain');
            }

            for (const header in this.requestHeaders) {
                xhr.setRequestHeader(header, this.requestHeaders[header]);
            }

            // tslint:disable-next-line:no-null-keyword
            xhr.send(null);
            this.manager.itemStart(url);
        });
    }

    setRequestHeader(key: string, value: string) {
        this.requestHeaders[key] = value;
        return this;
    }
}

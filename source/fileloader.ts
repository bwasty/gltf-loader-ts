// Adapted from THEE.FileLoader
// https://github.com/mrdoob/three.js/blob/master/src/loaders/FileLoader.js

import { LoadingManager } from './loadingmanager';

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
    load(url: string, onLoad: any, onProgress?: any, onError?: any): XMLHttpRequest { // TODO!: any..
        if (this.path !== undefined) { url = this.path + url; }
        url = this.manager.resolveURL(url);
        // TODO? caching
        // TODO? check if request is duplicate -> multiple reference to same file in gltf?

        // TODO!!: Check for data: URI (-> Safari can not handle Data URIs through XMLHttpRequest so process manually)

        // TODO?: Initialise array for duplicate requests

        // NOTE: Not using `fetch` because it doesn't support progress reporting
        const request = new XMLHttpRequest();
        request.open('GET', url, true);

        const self = this;
        request.addEventListener('load', function(event) {
            const response = this.response;

            if (this.status === 200 && onLoad) {
                if (onLoad) {
                    onLoad(response);
                }
                self.manager.itemEnd(url);
            } else if (this.status === 0) {
                // Some browsers return HTTP Status 0 when using non-http protocol
                // e.g. 'file://' or 'data://'. Handle as success.
                console.warn('FileLoader: HTTP Status 0 received.');
                if (onLoad) {
                    onLoad(response);
                }
                self.manager.itemEnd(url);
            } else {
                if (onError) {
                    onError(event);
                }

                self.manager.itemEnd(url);
                self.manager.itemError(url);
            }
        }, false );

        request.addEventListener('progress', (event) => {
            if (onProgress) {
                onProgress(event);
            }
        }, false );

        request.addEventListener('error', (event) => {
            if (onError) {
                onError(event);
            }
            this.manager.itemEnd(url);
            this.manager.itemError(url);
        }, false );

        if (this.responseType) { request.responseType = this.responseType; }
        if (this.withCredentials) { request.withCredentials = this.withCredentials; }
        if (this.mimeType && request.overrideMimeType) {
            request.overrideMimeType(this.mimeType !== undefined ? this.mimeType : 'text/plain');
        }

        for (const header in this.requestHeaders) {
            request.setRequestHeader(header, this.requestHeaders[header]);
        }

        // tslint:disable-next-line:no-null-keyword
        request.send(null);

        this.manager.itemStart(url);
        return request;
    }

    setPath(value: string) {
        this.path = value;
        return this;
    }

    setResponseType(value: XMLHttpRequestResponseType) {
        this.responseType = value;
        return this;
    }

    setWithCredentials(value: boolean) {
        this.withCredentials = value;
        return this;
    }

    setMimeType(value: string) {
        this.mimeType = value;
        return this;
    }

    setRequestHeader(key: string, value: string) {
        this.requestHeaders[key] = value;
        return this;
    }
}

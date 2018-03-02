import { FileLoader } from './fileloader';
import { GlTf, GlTfId } from './gltf';
import { EXTENSIONS } from './gltf-loader';
import { LoadingManager } from './loadingmanager';

export class GltfAsset {
    /** The JSON part of the asset. */
    gltf: GlTf;
    extensions: any;
    bufferData: BufferData;
    imageData: ImageData;

    constructor(gltf: GlTf, baseUri: string, extensions: any, manager: LoadingManager = new LoadingManager()) {
        this.gltf = gltf;
        this.extensions = extensions;
        this.bufferData = new BufferData(this, baseUri, manager);
        // TODO!!
        // this.imageData = new ImageData(gltf, baseUri, manager);
    }

    // TODO!!: test
    async bufferViewData(index: GlTfId) {
        if (!this.gltf.bufferViews) {
            throw new Error('No buffer views found.');
        }
        const bufferView = this.gltf.bufferViews[index];
        const bufferData = await this.bufferData.get(bufferView.buffer);
        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;
        return bufferData.slice(byteOffset, byteOffset + byteLength);
    }
}

// tslint:disable:max-classes-per-file
export class BufferData {
    private bufferCache: Array<ArrayBuffer> = [];

    asset: GltfAsset;
    baseUri: string;
    manager: LoadingManager;
    loader: FileLoader;

    constructor(asset: GltfAsset, baseUri: string, manager: LoadingManager) {
        this.asset = asset;
        this.baseUri = baseUri;
        this.manager = manager;
        this.loader = new FileLoader(manager);
        this.loader.responseType = 'arraybuffer';
    }

    /**
     * Get the buffer data. Might trigger a network request if theres is an external .bin file
     * when it's accessed for the first time and `fetchAll` has not been used.
     */
    async get(index: GlTfId): Promise<ArrayBuffer> {
        if (this.bufferCache[index] !== undefined) {
            return this.bufferCache[index];
        }

        const gltf = this.asset.gltf;
        if (!gltf.buffers) {
            throw new Error('No buffers found.');
        }
        const buffer = gltf.buffers[index];
        // If present, GLB container is required to be the first buffer.
        if (buffer.uri === undefined) {
            /* istanbul ignore next */
            if (index !== 0) { throw new Error('GLB container is required to be the first buffer'); }
            return this.asset.extensions[EXTENSIONS.KHR_BINARY_GLTF].body;
        }

        const url = resolveURL(buffer.uri, this.baseUri);
        const bufferData = await this.loader.load(url);
        // TODO!!: test caching works...
        this.bufferCache[index] = bufferData;
        return bufferData;
    }

    /** Pre-fetches all buffer data. */
    async fetchAll(): Promise<any> {
        // TODO!!: test
        const buffers = this.asset.gltf.buffers;
        if (!buffers) { return; }
        return Promise.all(buffers.map((_, i): any => this.get(i)));
    }
}

export class ImageData {
    baseUri: string;
    manager: LoadingManager;
    constructor(baseUri: string, manager: LoadingManager) {
        this.baseUri = baseUri;
        this.manager = manager;
    }

    /**
     * Get the buffer data. Might trigger a network request if data is in an extermal image
     * file when it's accessed for the first time and `fetchAll` has not been used.
     */
    async get(index: GlTfId): Promise<HTMLImageElement> {
        // TODO!!: implement
        return new Image();
    }

    /** Pre-fetches all buffer data. */
    fetchAll() {
        // TODO!!
    }
}

export function resolveURL(url: string, path: string) {
    // Invalid URL
    if (typeof url !== 'string' || url === '') { return ''; }
    // Absolute URL http://,https://,//
    if (/^(https?:)?\/\//i.test(url)) { return url; }
    // Data URI
    if (/^data:.*,.*$/i.test(url)) { return url; }
    // Blob URL
    if (/^blob:.*$/i.test(url)) { return url; }
    // Relative URL
    return path + url;
}

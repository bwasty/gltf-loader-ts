import { FileLoader } from './fileloader';
import { GlTf, GlTfId } from './gltf';
import { EXTENSIONS } from './gltf-loader';
import { resolveURL } from './gltf-parser';
import { LoadingManager } from './loadingmanager';

export class Asset {
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
class BufferData {
    private bufferCache: Array<ArrayBuffer> = [];

    asset: Asset;
    baseUri: string;
    manager: LoadingManager;
    loader: FileLoader;

    constructor(asset: Asset, baseUri: string, manager: LoadingManager) {
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

class ImageData {
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
        // TODO!!!: implement
        return new Image();
    }

    /** Pre-fetches all buffer data. */
    fetchAll() {
        // TODO!!
    }
}

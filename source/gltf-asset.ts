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
        this.imageData = new ImageData(this, baseUri, manager);
    }

    async bufferViewData(index: GlTfId) {
        if (!this.gltf.bufferViews) {
            /* istanbul ignore next */
            throw new Error('No buffer views found.');
        }
        const bufferView = this.gltf.bufferViews[index];
        const bufferData = await this.bufferData.get(bufferView.buffer);
        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;
        return bufferData.slice(byteOffset, byteOffset + byteLength);
    }

    /** Pre-fetches all buffer and image data. */
    async fetchAll(): Promise<any> {
        return Promise.all([
            this.bufferData.fetchAll(),
            this.imageData.fetchAll(),
        ]);
    }
}

// tslint:disable:max-classes-per-file
export class BufferData {
    asset: GltfAsset;
    baseUri: string;
    manager: LoadingManager;
    loader: FileLoader;

    private bufferCache: Array<ArrayBuffer> = [];

    constructor(asset: GltfAsset, baseUri: string, manager: LoadingManager) {
        this.asset = asset;
        this.baseUri = baseUri;
        this.manager = manager;
        this.loader = new FileLoader(manager);
        this.loader.responseType = 'arraybuffer';
    }

    /**
     * Get the buffer data. Triggers a network request if this buffer resides
     * in an external .bin file and is accessed for the first time (cached afterwards).
     * when it's accessed for the first time and `fetchAll` has not been used.
     * To avoid any delays, use `fetchAll` to pre-fetch everything.
     */
    async get(index: GlTfId): Promise<ArrayBuffer> {
        if (this.bufferCache[index] !== undefined) {
            return this.bufferCache[index];
        }

        const gltf = this.asset.gltf;
        if (!gltf.buffers) {
            /* istanbul ignore next */
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
        this.bufferCache[index] = bufferData;
        return bufferData;
    }

    /** Pre-fetches all buffer data. */
    async fetchAll(): Promise<any> {
        const buffers = this.asset.gltf.buffers;
        if (!buffers) { return; }
        return Promise.all(buffers.map((_, i): any => this.get(i)));
    }
}

export class ImageData {
    asset: GltfAsset;
    baseUri: string;
    manager: LoadingManager;

    private imageCache: Array<HTMLImageElement> = [];

    constructor(asset: GltfAsset, baseUri: string, manager: LoadingManager) {
        this.asset = asset;
        this.baseUri = baseUri;
        this.manager = manager;
    }

    /**
     * Get the image data. Triggers a network request if image is in an external file
     * and is accessed for the first time (cached afterwards). To avoid any delays,
     * use `fetchAll` to pre-fetch everything.
     */
    async get(index: GlTfId): Promise<HTMLImageElement> {
        if (this.imageCache[index] !== undefined) {
            return this.imageCache[index];
        }

        const gltf = this.asset.gltf;
        if (!gltf.images) {
            /* istanbul ignore next */
            throw new Error('No images found.');
        }
        const image = gltf.images[index];

        let sourceURI: string;
        let isObjectURL = false;
        if (image.bufferView !== undefined) {
            // Load binary image data from bufferView, if provided.
            const bufferView = await this.asset.bufferViewData(image.bufferView);
            isObjectURL = true;
            const blob = new Blob([bufferView], { type: image.mimeType });
            sourceURI = URL.createObjectURL(blob);
        } else if (image.uri !== undefined ) {
            sourceURI = resolveURL(image.uri, this.baseUri);
        } else {
            throw new Error('Invalid glTF: image must either have a `uri` or a `bufferView`');
        }

        const img = new Image();

        const promise: Promise<HTMLImageElement> = new Promise((resolve, reject) => {
            img.onerror = () => {
                reject(`Failed to load ${sourceURI}`);
                this.manager.itemEnd(sourceURI);
                this.manager.itemError(sourceURI);
            };
            img.onload = () => {
                if (isObjectURL) {
                    URL.revokeObjectURL(sourceURI);
                }
                this.imageCache[index] = img;
                resolve(img);
                this.manager.itemEnd(sourceURI);
            };
            // TODO!!: cross-origin?
            // TODO!: onprogress?
            img.src = sourceURI;
            this.manager.itemStart(sourceURI);
        });

        return promise;
    }

    /** Pre-fetches all image data. */
    async fetchAll(): Promise<any> {
        const images = this.asset.gltf.images;
        if (!images) { return; }
        return Promise.all(images.map((_, i): any => this.get(i)));
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

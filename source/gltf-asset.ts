import { FileLoader } from './fileloader';
import { GLTFBinaryData } from './glb-decoder';
import { GlTf, GlTfId } from './gltf';
import { LoadingManager } from './loadingmanager';

export class GltfAsset {
    /** The JSON part of the asset. */
    gltf: GlTf;
    glbData: GLTFBinaryData | undefined;
    /** Helper for accessing buffer data */
    bufferData: BufferData;
    /** Helper for accessing image data */
    imageData: ImageData;

    constructor(gltf: GlTf, baseUri: string, glbData: GLTFBinaryData | undefined,
        manager: LoadingManager = new LoadingManager()) {

        this.gltf = gltf;
        this.glbData = glbData;
        this.bufferData = new BufferData(this, baseUri, manager);
        this.imageData = new ImageData(this, baseUri, manager);
    }

    /**
     * Fetch the data for a buffer view. Pass in the `bufferView` property of an
     * `Accessor`.
     * NOTE: To avoid any unnessary copies, the data is returned as a `Uint8Array` instead of an `ArrayBuffer`.
     */
    async bufferViewData(index: GlTfId): Promise<Uint8Array> {
        if (!this.gltf.bufferViews) {
            /* istanbul ignore next */
            throw new Error('No buffer views found.');
        }
        const bufferView = this.gltf.bufferViews[index];
        const bufferData = await this.bufferData.get(bufferView.buffer);
        const byteLength = bufferView.byteLength || 0;
        const byteOffset = bufferView.byteOffset || 0;

        // For GLB files, the 'base buffer' is the whole GLB file, including the json part.
        // Therefore we have to consider bufferData's offset within its buffer it as well.
        // For non-GLB files it will be 0.
        const baseBuffer = bufferData.buffer;
        const baseBufferByteOffset = bufferData.byteOffset;

        return new Uint8Array(baseBuffer, baseBufferByteOffset + byteOffset, byteLength);
    }

    /** Pre-fetches all buffer and image data. Useful to avoid stalls due to lazy loading. */
    async preFetchAll(): Promise<void[][]> {
        return Promise.all([
            this.bufferData.preFetchAll(),
            this.imageData.preFetchAll(),
        ]);
    }
}

// tslint:disable:max-classes-per-file
export class BufferData {
    asset: GltfAsset;
    baseUri: string;
    manager: LoadingManager;
    loader: FileLoader;

    private bufferCache: Array<Uint8Array> = [];

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
     * when it's accessed for the first time and `preFetchAll` has not been used.
     * To avoid any delays, use `preFetchAll` to pre-fetch everything.
     * NOTE: To avoid any unnessary copies, the data is returned as a `Uint8Array` instead of an `ArrayBuffer`.
     */
    async get(index: GlTfId): Promise<Uint8Array> {
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
            if (this.asset.glbData === undefined) {
                throw new Error('invalid gltf: buffer has no uri nor is there a GLB buffer');
            }
            return this.asset.glbData.binaryChunk;
        }

        const url = resolveURL(buffer.uri, this.baseUri);
        const bufferData: ArrayBuffer = await this.loader.load(url);
        const bufferDataView = new Uint8Array(bufferData);
        this.bufferCache[index] = bufferDataView;
        return bufferDataView;
    }

    /** Pre-fetches all buffer data. */
    async preFetchAll(): Promise<void[]> {
        const buffers = this.asset.gltf.buffers;
        if (!buffers) { return []; }
        return Promise.all(buffers.map((_, i): any => this.get(i))) as Promise<void[]>;
    }
}

export class ImageData {
    asset: GltfAsset;
    baseUri: string;
    manager: LoadingManager;
    /** crossorigin value for file and image requests */
    crossOrigin = 'anonymous';

    private imageCache: Array<HTMLImageElement> = [];

    constructor(asset: GltfAsset, baseUri: string, manager: LoadingManager) {
        this.asset = asset;
        this.baseUri = baseUri;
        this.manager = manager;
    }

    /**
     * Get the image data. Triggers a network request if image is in an external file
     * and is accessed for the first time (cached afterwards). To avoid any delays,
     * use `preFetchAll` to pre-fetch everything.
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
            sourceURI = this.manager.resolveURL(resolveURL(image.uri, this.baseUri));
        } else {
            /* istanbul ignore next */
            throw new Error('Invalid glTF: image must either have a `uri` or a `bufferView`');
        }

        const img = new Image();
        img.crossOrigin = this.crossOrigin;

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
            // TODO!: onprogress?
            img.src = sourceURI;
            this.manager.itemStart(sourceURI);
        });

        return promise;
    }

    /** Pre-fetches all image data. */
    async preFetchAll(): Promise<void[]> {
        const images = this.asset.gltf.images;
        if (!images) { return []; }
        return Promise.all(images.map((_, i): any => this.get(i))) as Promise<void[]>;
    }
}

// TODO!!: function required in this form?
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

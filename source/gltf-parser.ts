import { FileLoader } from './fileloader';
import { GlTf } from './gltf';
import { EXTENSIONS } from './gltf-loader';

export class GltfParser {
    json: any;
    extensions: any;
    options: any;
    cache: GLTFRegistry;
    primitiveCache: Array<any>;
    fileLoader: FileLoader;
    textureLoader: any;
    constructor(json: string, extensions: any, options: any) {
        this.json = json || {};
        this.extensions = extensions || {};
        this.options = options || {};

        // loader object cache
        this.cache = new GLTFRegistry();

        // BufferGeometry caching
        this.primitiveCache = [];

        // TODO!!: image loading...
        // this.textureLoader = new THREE.TextureLoader( this.options.manager);
        // this.textureLoader.setCrossOrigin( this.options.crossOrigin );

        this.fileLoader = new FileLoader(this.options.manager);
        this.fileLoader.setResponseType('arraybuffer');
    }

    async parse(): Promise<GlTf> {
        const json = this.json;

        // Clear the loader cache
        this.cache.removeAll();

        // Mark the special nodes/meshes in json for efficient parse
        this.markDefs();

        // TODO!!!: load scene/animation/camera functions don't exist...
        // Fire the callback on complete
        // this.getMultiDependencies( [
        //     'scene',
        //     'animation',
        //     'camera',
        // ]).then((dependencies: any) => {
        //     const scenes = dependencies.scenes || [];
        //     const scene = scenes[ json.scene || 0 ];
        //     const animations = dependencies.animations || [];
        //     const asset = json.asset;
        //     const cameras = dependencies.cameras || [];

        //     onLoad( scene, scenes, cameras, animations, asset );

        // }).catch(onError);
        return json;
    }

    /**
     * Marks the special nodes/meshes in json for efficient parse.
     */
    markDefs() {
        const nodeDefs = this.json.nodes || [];
        const skinDefs = this.json.skins || [];
        const meshDefs = this.json.meshes || [];

        const meshReferences: any = {};
        const meshUses: any = {};

        // Nothing in the node definition indicates whether it is a Bone or an
        // Object3D. Use the skins' joint references to mark bones.
        for (const skin of skinDefs) {
            for (const joint of skin.joints) {
                nodeDefs[joint].isBone = true;
            }
        }

        // TODO!!: remove?
        // Meshes can (and should) be reused by multiple nodes in a glTF asset. To
        // avoid having more than one mesh with the same name, count
        // references and rename instances below.
        //
        // Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
        for (const nodeDef of nodeDefs) {
            if (nodeDef.mesh !== undefined) {
                if (meshReferences[nodeDef.mesh] === undefined) {
                    meshReferences[nodeDef.mesh] = meshUses[nodeDef.mesh] = 0;
                }

                meshReferences[ nodeDef.mesh ] ++;

                // Nothing in the mesh definition indicates whether it is
                // a SkinnedMesh or Mesh. Use the node's mesh reference
                // to mark SkinnedMesh if node has skin.
                if (nodeDef.skin !== undefined) {
                    meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;
                }
            }

        }

        this.json.meshReferences = meshReferences;
        this.json.meshUses = meshUses;
    }

    /**
     * Requests the specified dependency asynchronously, with caching.
     */
    getDependency(type: string, index: number): Promise<object> {
        const cacheKey = type + ':' + index;
        let dependency = this.cache.get(cacheKey);
        if (!dependency) {
            const fnName = 'load' + type.charAt(0).toUpperCase() + type.slice(1);
            dependency = (this as any)[fnName](index);
            this.cache.add(cacheKey, dependency);
        }
        return dependency;
    }

    /**
     * Requests all dependencies of the specified type asynchronously, with caching.
     */
    getDependencies(type: string): Promise<Array<object>> {
        let dependencies = this.cache.get( type );
        if (!dependencies) {
            const parser = this;
            const defs = this.json[ type + (type === 'mesh' ? 'es' : 's') ] || [];

            dependencies = Promise.all(defs.map((def: any, index: any) => {
                return parser.getDependency(type, index);
            }));

            this.cache.add(type, dependencies);
        }

        return dependencies;
    }

    /**
     * Requests all multiple dependencies of the specified types asynchronously, with caching.
     */
    getMultiDependencies(types: Array<string>): Promise<object> {
        const results: any = {};
        const pendings = [];

        for (const type of types) {
            let value = this.getDependencies(type);

            // TODO: too much any...
            value = (value as any).then(((key: any, value: any) => {
                results[key] = value;
            }) as any).bind(this, type + (type === 'mesh' ? 'es' : 's'));

            pendings.push(value);
        }

        return Promise.all(pendings).then(() => {
            return results;
        });
    }

    /**
     * Spec: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     */
    loadBuffer(bufferIndex: number): Promise<ArrayBuffer> {
        const bufferDef = this.json.buffers[ bufferIndex ];
        // const loader = this.fileLoader;

        if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
            throw new Error(bufferDef.type + ' buffer type is not supported.');
        }

        // If present, GLB container is required to be the first buffer.
        if (bufferDef.uri === undefined && bufferIndex === 0) {
            return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
        }

        // const options = this.options;
        return new Promise((resolve, reject) => {
            // TODO!!: async...
            // loader.load(resolveURL(bufferDef.uri, options.path), resolve, undefined, () => {
            //     reject(new Error('Failed to load buffer "' + bufferDef.uri + '".'));
            // });
        });
    }

    /**
     * Spec: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
     */
    loadBufferView(bufferViewIndex: number): Promise<ArrayBuffer> {
        const bufferViewDef = this.json.bufferViews[bufferViewIndex];
        return this.getDependency('buffer', bufferViewDef.buffer).then((buffer: ArrayBuffer) => {
            const byteLength = bufferViewDef.byteLength || 0;
            const byteOffset = bufferViewDef.byteOffset || 0;
            return buffer.slice(byteOffset, byteOffset + byteLength);
        } );
    }

    /**
     * Spec: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
     */
    // TODO!!: return type...was Promise<THREE.BufferAttribute|THREE.InterleavedBufferAttribute>
    loadAccessor(accessorIndex: number) {
        const parser = this;
        const json = this.json;

        const accessorDef = this.json.accessors[accessorIndex ];

        const pendingBufferViews = [];

        if (accessorDef.bufferView !== undefined) {
            pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView));
        } else {
            // tslint:disable-next-line:no-null-keyword
            pendingBufferViews.push(null);
        }

        if (accessorDef.sparse !== undefined) {
            pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.indices.bufferView));
            pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.values.bufferView));
        }

        return Promise.all(pendingBufferViews as any).then((bufferViews) => {
            const bufferView = bufferViews[0];

            const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
            // tslint:disable-next-line:variable-name
            const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

            // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
            const elementBytes = TypedArray.BYTES_PER_ELEMENT;
            const itemBytes = elementBytes * itemSize;
            const byteOffset = accessorDef.byteOffset || 0;
            const byteStride = json.bufferViews[accessorDef.bufferView].byteStride;
            // const normalized = accessorDef.normalized === true;
            let array;
            const bufferAttribute: any = undefined;

            // The buffer is not interleaved if the stride is the item size in bytes.
            if (byteStride && byteStride !== itemBytes) {
                const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType;
                const ib = parser.cache.get(ibCacheKey);
                if (!ib) {
                    // Use the full buffer if it's interleaved.
                    array = new TypedArray(bufferView);
                    console.log(array);

                    // TODO!!
                    // // Integer parameters to IB/IBA are in array elements, not bytes.
                    // ib = new THREE.InterleavedBuffer(array, byteStride / elementBytes);
                    console.error('not implemented yet: storing accessors');

                    parser.cache.add(ibCacheKey, ib);
                }

                // TODO!!
                // bufferAttribute = new THREE.InterleavedBufferAttribute(ib, itemSize,
                //     byteOffset / elementBytes, normalized);
                console.error('not implemented yet: storing accessors (2)');
            } else {
                if (bufferView === null) {
                    array = new TypedArray(accessorDef.count * itemSize);
                } else {
                    array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
                }

                // TODO!!
                // bufferAttribute = new THREE.BufferAttribute(array, itemSize, normalized);
                console.error('not implemented yet: storing accessors (3)');
            }

            // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
            if (accessorDef.sparse !== undefined) {
                const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
                // tslint:disable-next-line:variable-name
                const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];

                const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
                const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

                const sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices,
                    accessorDef.sparse.count * itemSizeIndices);
                const sparseValues = new TypedArray(bufferViews[2], byteOffsetValues,
                    accessorDef.sparse.count * itemSize);

                if (bufferView !== null) {
                    // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
                    bufferAttribute.setArray(bufferAttribute.array.slice());
                }

                for (let i = 0; i < sparseIndices.length; i ++) {
                    const index = sparseIndices[i];

                    bufferAttribute.setX(index, sparseValues[i * itemSize]);
                    if (itemSize >= 2) { bufferAttribute.setY(index, sparseValues[i * itemSize + 1]); }
                    if (itemSize >= 3) { bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]); }
                    if (itemSize >= 4) { bufferAttribute.setW(index, sparseValues[i * itemSize + 3]); }
                    if (itemSize >= 5) { throw new Error('Unsupported itemSize in sparse BufferAttribute.'); }
                }
            }

            return bufferAttribute;
        });
    }

    /**
     * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
     */
    loadTexture(textureIndex: number) { // TODO!!: return? was Promise<THREE.Texture>
        const parser = this;
        const json = this.json;
        const options = this.options;
        const textureLoader = this.textureLoader;

        const URL = window.URL || (window as any).webkitURL;

        const textureDef = json.textures[textureIndex ];
        const source = json.images[textureDef.source ];
        let sourceURI = source.uri;
        let isObjectURL = false;

        if (source.bufferView !== undefined) {
            // Load binary image data from bufferView, if provided.
            sourceURI = parser.getDependency('bufferView', source.bufferView).then((bufferView) => {
                isObjectURL = true;
                const blob = new Blob([bufferView ], { type: source.mimeType });
                sourceURI = URL.createObjectURL(blob);
                return sourceURI;
            });
        }

        return Promise.resolve(sourceURI).then((sourceURI) => {
            // Load Texture resource.
            const loader = textureLoader;

            return new Promise((resolve, reject) => {
                loader.load(resolveURL(sourceURI, options.path), resolve, undefined, reject);
            });

        }).then((texture) => {
            // Clean up resources and configure Texture.
            if (isObjectURL === true) {
                URL.revokeObjectURL(sourceURI);
            }

            // TODO!!: return `Image`?
            return texture;
        });
    }

    // NOTE: skipping assignTexture, loadMaterial, loadGeometries,
    // loadMesh, loadCamera, loadSkin, loadAnimation, loadNode, loadScene

}

// tslint:disable-next-line:max-classes-per-file
export class GLTFRegistry {
    objects: { [k: string]: any } = {};
    get(key: any) {
        return this.objects[key];
    }
    add(key: any, object: any) {
        this.objects[key] = object;
    }
    remove(key: any) {
        delete this.objects[key];
    }
    removeAll() {
        this.objects = {};
    }
}

/* CONSTANTS */

const WEBGL_COMPONENT_TYPES: any = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

const WEBGL_TYPE_SIZES: any = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

/* UTILITY FUNCTIONS */

function resolveURL(url: string, path: string) {
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

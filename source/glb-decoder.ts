import { EXTENSIONS } from './gltf-loader';
import { LoaderUtils } from './loaderutils';

// const BINARY_EXTENSION_BUFFER_NAME = 'binary_glTF';
export const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

// TODO!: GLB is not an extension anymore -> rename class/variables...
export class GLTFBinaryExtension {
    name = EXTENSIONS.KHR_BINARY_GLTF;
    content: any;
    header: any;
    body: any;
    constructor(data: ArrayBuffer) {
        const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);

        this.header = {
            magic: LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true),
        };

        if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
            throw new Error('Unsupported glTF-Binary header.');
        } else if (this.header.version < 2.0) {
            throw new Error('Unsupported legacy binary file detected.');
        }

        const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
        let chunkIndex = 0;
        while (chunkIndex < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
                const contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
                this.content = LoaderUtils.decodeText(contentArray);

            } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
                const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
                this.body = data.slice(byteOffset, byteOffset + chunkLength);
            }

            // Clients must ignore chunks with unknown types.

            chunkIndex += chunkLength;
        }

        if (this.content === null) {
            throw new Error('glTF-Binary: JSON content not found.');
        }
    }
}

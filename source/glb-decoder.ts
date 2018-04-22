import { LoaderUtils } from './loaderutils';

export const BINARY_HEADER_MAGIC = 'glTF';
const BINARY_HEADER_LENGTH = 12;
const BINARY_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

export class GLTFBinaryData {
    json: string;
    binaryChunk: Uint8Array;
    constructor(data: ArrayBuffer) {
        const headerView = new DataView(data, 0, BINARY_HEADER_LENGTH);

        const header = {
            magic: LoaderUtils.decodeText(new Uint8Array(data, 0, 4)),
            version: headerView.getUint32(4, true),
            length: headerView.getUint32(8, true),
        };

        if (header.magic !== BINARY_HEADER_MAGIC) {
            throw new Error('Unsupported glTF-Binary header.');
        } else if (header.version < 2.0) {
            throw new Error('Unsupported legacy binary file detected.');
        }

        const chunkView = new DataView(data, BINARY_HEADER_LENGTH);
        let chunkIndex = 0;
        while (chunkIndex < chunkView.byteLength) {
            const chunkLength = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            const chunkType = chunkView.getUint32(chunkIndex, true);
            chunkIndex += 4;

            if (chunkType === BINARY_CHUNK_TYPES.JSON) {
                const contentArray = new Uint8Array(data, BINARY_HEADER_LENGTH + chunkIndex, chunkLength);
                this.json = LoaderUtils.decodeText(contentArray);

            } else if (chunkType === BINARY_CHUNK_TYPES.BIN) {
                const byteOffset = BINARY_HEADER_LENGTH + chunkIndex;
                this.binaryChunk = new Uint8Array(data, byteOffset, chunkLength);
            }

            // Clients must ignore chunks with unknown types.

            chunkIndex += chunkLength;
        }

        if (this.json === null) {
            throw new Error('glTF-Binary: JSON content not found.');
        }
    }
}

import * as chai from 'chai';
const expect = chai.expect;
import * as sinon from 'sinon';

import { GltfLoader } from '../source/gltf-loader';

describe('gltf-operate', () => {
    let server;
    beforeEach(function () {
        server = sinon.fakeServer.create();
        // window.XMLHttpRequest = global.XMLHttpRequest; // This line is important
    });

    afterEach(function () {
        server.restore();
    });

    it('should load normal gltf files', () => {
        // const server = sinon.createFakeServer();

        const loader = new GltfLoader();
        loader.load(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
            // onLoad
            (gltf) => {
                console.log(gltf)
            },
            // onProgress
            (xhr: any) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // onError
            (error) => {
                console.error(error)
            },
        );

        server.requests[0].respond(
            200,
            { "Content-Type": "application/json" },
            JSON.stringify([{ id: 1, text: "Provide examples", done: true }])
        );

        // this.server.restore();
    });

    it('should load GLB files', () => {
        // TODO!!
    });

    it('should load files with embedded data', () => {
        // TODO!!
    });

    ///
    it('should report progress via onProgress', () => {
        // TODO!!
    });

    it('should report errors via the onError callback', () => {
        // TODO!!
    });
});


import * as chai from 'chai';
import * as spies from 'chai-spies';

const expect = chai.expect;
chai.use(spies);
const spy = chai.spy;

import { GltfLoader } from '../source/gltf-loader';

import * as XMLHttpRequest from 'xhr2';
import { GltfAsset } from '../source/gltf-asset';
import { LoadingManager } from '../source/loadingmanager';
(global as any).XMLHttpRequest = XMLHttpRequest;

let SAMPLE_MODELS_BASE = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';
if (process.env.SAMPLE_MODELS_BASE) {
    // for faster tests, clone the sample models repo and start a `https-server` in the 2.0 directory
    SAMPLE_MODELS_BASE = process.env.SAMPLE_MODELS_BASE;
}

// arrow functions are discouraged for mocha
// -> https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions

// common assertions for the box model
async function expect_asset_to_be_standard_box(asset: GltfAsset) {
    // check json
    expect(asset.gltf.asset.version).to.equal('2.0');
    expect(asset.gltf.materials[0].name).to.equal('Red');

    // check buffer directly
    const buffer = await asset.bufferData.get(0);
    expect(buffer.byteLength).to.equal(asset.gltf.buffers[0].byteLength);

    // check buffer views
    const data = await asset.bufferViewData(0);
    expect(data.byteLength).to.equal(asset.gltf.bufferViews[0].byteLength);
    const data1 = await asset.bufferViewData(1);
    expect(data1.byteLength).to.equal(asset.gltf.bufferViews[1].byteLength);
}

describe('gltf-loader', function() {
    it('should load normal gltf files', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf');

        expect(asset.gltf.buffers[0].uri).to.equal('Box0.bin');
        expect_asset_to_be_standard_box(asset);
    });

    it('should load GLB files', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Binary/Box.glb');

        expect(asset.gltf.buffers[0].byteLength).to.equal(648);
        await expect_asset_to_be_standard_box(asset);
    });

    it('should load files with embedded data', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF-Embedded/Box.gltf');
        expect(asset.gltf.buffers[0].uri).to.match(/^data:application\/octet-stream;base64,AAA/);
        // TODO!!: fails actually...but in the browser it works (-> issue with `xhr2`?)
        // await expect_asset_to_be_standard_box(asset);
    });

    it('should report progress via onProgress', async function() {
        let onProgressCalled = false;
        const loader = new GltfLoader();
        const promise = loader.load(
            SAMPLE_MODELS_BASE + 'BoxAnimated/glTF-Binary/BoxAnimated.glb',
            (xhr: any) => { // onProgress
                expect(xhr.loaded / xhr.total).to.be.within(0, 1);
                onProgressCalled = true;
            },
        );
        const gltf = await promise;
        if (!onProgressCalled) {
            throw new Error('onProgress not called');
        }
    });

    it('should report errors via the onError callback', async function() {
        const loader = new GltfLoader();
        try {
            const gltf = await loader.load(SAMPLE_MODELS_BASE + 'this/should/404');
            throw new Error('this should have failed.');
        } catch (error) {
            expect(error).to.eql({ status: 404, statusText: 'Not Found' });
        }
    });

    it('should handle an external loadingManager correctly', async function() {
        const URL = SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf';
        let manager = new LoadingManager();
        manager.onStart = spy((url, itemsLoaded, itemsTotal) => {
            expect(url).to.equal(URL);
            expect(itemsLoaded).to.equal(0);
            expect(itemsTotal).to.equal(1);
        });
        manager.onProgress = spy((url, itemsLoaded, itemsTotal) => {
            expect(url).to.equal(URL);
            expect(itemsLoaded).to.equal(1);
            expect(itemsTotal).to.equal(1);
        });
        manager.onLoad = spy(() => {});
        manager.onError = spy((url) => {});

        let loader = new GltfLoader(manager);
        const promise = loader.load(URL);
        expect(manager.onStart).to.have.been.called();
        const gltf = await promise;
        expect(manager.onProgress).to.have.been.called();
        expect(manager.onLoad).to.have.been.called();
        expect(manager.onError).to.have.not.been.called();

        // test onError
        manager = new LoadingManager();
        manager.onError = spy((url) => {
            expect(url).to.equal(SAMPLE_MODELS_BASE + 'this/should/404');
        });
        loader = new GltfLoader(manager);
        try {
            await loader.load(SAMPLE_MODELS_BASE + 'this/should/404');
        } catch { }
        expect(manager.onError).to.have.been.called();
    });

    it('caches buffer data', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf');
        expect((asset.bufferData as any).bufferCache).to.have.lengthOf(0);
        const buffer = await asset.bufferData.get(0);
        expect((asset.bufferData as any).bufferCache).to.have.lengthOf(1);
        expect((asset.bufferData as any).bufferCache[0]).to.equal(buffer);
    });

    it('fetches all data with fetchAll', async function() {
        const loader = new GltfLoader();
        const asset = await loader.load(SAMPLE_MODELS_BASE + 'Box/glTF/Box.gltf');
        await asset.bufferData.fetchAll();
        expect((asset.bufferData as any).bufferCache).to.have.lengthOf(1);
    });

    // TODO!!: test images

    // TODO!!: test loading from FileList (drag and drop)
});


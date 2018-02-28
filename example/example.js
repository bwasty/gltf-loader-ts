(async function() { // wrap in async function to use await
    let sample_models_base = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/'
    let model_url = sample_models_base + 'Box/glTF/Box.gltf';
    // model_url = sample_models_base + 'Box/glTF-Embedded/Box.gltf';
    // model_url = sample_models_base + 'Box/glTF-Binary/Box.glb',
    // model_url = sample_models_base + 'WaterBottle/glTF-Binary/WaterBottle.glb',
    // model_url = sample_models_base + '2CylinderEngine/glTF-Binary/2CylinderEngine.glb',

    //
    // Load asset
    //
    let loader = new GltfLoader.GltfLoader()
    try {
        let asset = await loader.load(
            model_url,
            (xhr) => { // onProgress
                if (xhr.total)
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                else
                    console.log("Finished loading")
            },
        )

        //
        // Parse asset
        //
        const gltf = asset.gltf; // See https://bwasty.github.io/gltf-loader-ts/interfaces/gltf.html
        let sceneIndex = gltf.scene | 0;
        let scene = gltf.scenes[sceneIndex];
        let rootNodes = scene.nodes;
        for (let nodeIndex of rootNodes) {
            let node = gltf.nodes[nodeIndex];
            let child = gltf.nodes[node.children[0]]
            let mesh = gltf.meshes[child.mesh];
            let primitive = mesh.primitives[0]
            let positionAccessorIndex = primitive.attributes.POSITION;
            let positionAccessor = gltf.accessors[positionAccessorIndex]
            let bufferViewIndex = positionAccessor.bufferView;

            //
            // Get the binary data, which might be in a .bin file that still has to be loaded,
            // in another part of the source GLB file, or embedded as a data URI.
            //
            let data = await asset.bufferViewData(bufferViewIndex);
            console.log("Buffer containing positions: ", data);
            // TODO!!: convert to TypedArray based on accessor...or example gl commands in comment?
        }
    } catch (e) {
        console.error(e);
    }

})();

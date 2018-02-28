(async function() { // wrap in async function to use await

    let loader = new GltfLoader.GltfLoader()
    try {
        let gltf = await loader.load(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
            // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
            // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
            // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb',
            (xhr) => { // onProgress
                if (xhr.total)
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                else
                    console.log("Finished loading")
            },
        )
        console.log(gltf)
    } catch (e) {
        console.error(e);
    }

})();

const dropEl = document.querySelector('.dropzone');
const inputEl = document.querySelector('.input');
const listEl = document.querySelector('.list');

const dropzone = new SimpleDropzone(dropEl, inputEl);

dropzone.on('drop', async ({files}) => {
    let loader = new GltfLoader.GltfLoader();
    let asset = await loader.loadFromFiles(files);

    for(let i=0; i < asset.gltf.buffers.length; i++) {
        let bufferData = await asset.bufferData.get(i);
        console.log(asset.gltf.buffers[i].uri, bufferData)
    }
    for(let i=0; i < asset.gltf.images.length; i++) {
        let imageData = await asset.imageData.get(i);
        console.log(asset.gltf.images[i].uri, imageData);
    }

    files = Array.from(files);
    listEl.innerHTML = files
      .map(([filename, file]) => `<li>${filename} : ${file.size} bytes</li>`)
      .join('');
});

dropzone.on('droperror', ({message}) => {
  alert(`Error: ${message}`);
});

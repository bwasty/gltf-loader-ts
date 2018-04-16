function dropHandler(event) {
    event.preventDefault(); // Prevent file from being opened

    // for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    // console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
    // }
    let files = event.dataTransfer.files;

    removeDragData(event) // Pass event to removeDragData for cleanup
}

function dragOverHandler(event) {
    event.preventDefault(); // prevent file from being opened
}

function removeDragData(ev) {
    console.log('Removing drag data')

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to remove the drag data
      ev.dataTransfer.items.clear();
    } else {
      // Use DataTransfer interface to remove the drag data
      ev.dataTransfer.clearData();
    }
}

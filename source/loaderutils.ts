// Based on THREE.LoaderUtils
// https://github.com/mrdoob/three.js/blob/master/src/loaders/LoaderUtils.js

declare var TextDecoder: any;

export class LoaderUtils {
    static decodeText(array: ArrayLike<number>): string {
        /* istanbul ignore next */
        if (typeof TextDecoder !== 'undefined') {
            return new TextDecoder().decode(array);
        }

        // Avoid the String.fromCharCode.apply(null, array) shortcut, which
        // throws a "maximum call stack size exceeded" error for large arrays.
        let s = '';
        for (const c of array as Array<number>) {
            // Implicitly assumes little-endian.
            s += String.fromCharCode(c);
        }

        // Merges multi-byte utf-8 characters.
        return decodeURIComponent(escape(s));
    }

    static extractUrlBase(url: string) {
        const parts = url.split('/');
        if (parts.length === 1) { return './'; }
        parts.pop();
        return parts.join('/') + '/';
    }
}

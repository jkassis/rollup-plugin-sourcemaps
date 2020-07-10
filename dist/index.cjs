'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var util = require('util');
var pluginUtils = _interopDefault(require('@rollup/pluginutils'));
var sourceMapResolve = _interopDefault(require('source-map-resolve'));

const { createFilter } = pluginUtils;
const { resolveSourceMap, resolveSources } = sourceMapResolve;
const promisifiedResolveSourceMap = util.promisify(resolveSourceMap);
const promisifiedResolveSources = util.promisify(resolveSources);
function sourcemaps({ include, exclude, readFile = fs.readFile, } = {}) {
    const filter = createFilter(include, exclude);
    const promisifiedReadFile = util.promisify(readFile);
    return {
        name: 'sourcemaps',
        async load(id) {
            if (!filter(id)) {
                return null;
            }
            let code;
            try {
                code = (await promisifiedReadFile(id)).toString();
            }
            catch (_a) {
                this.warn('Failed reading file');
                return null;
            }
            let map;
            try {
                const result = await promisifiedResolveSourceMap(code, id, readFile);
                // The code contained no sourceMappingURL
                if (result === null) {
                    return code;
                }
                map = result.map;
            }
            catch (_b) {
                this.warn('Failed resolving source map');
                return code;
            }
            // Resolve sources if they're not included
            if (map.sourcesContent === undefined) {
                try {
                    const { sourcesContent } = await promisifiedResolveSources(map, id, readFile);
                    if (sourcesContent.every(item => typeof item === 'string')) {
                        map.sourcesContent = sourcesContent;
                    }
                }
                catch (_c) {
                    this.warn('Failed resolving sources for source map');
                }
            }
            return { code, map };
        },
    };
}

module.exports = sourcemaps;
//# sourceMappingURL=index.cjs.map

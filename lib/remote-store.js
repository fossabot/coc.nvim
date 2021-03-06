"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const watch_obj_1 = require("./util/watch-obj");
const timeout = 2000;
const cached = {};
let { watched, addWatcher } = watch_obj_1.default(cached);
exports.default = {
    getResult(id, name) {
        let key = `${id}-${name}`;
        let res = cached[key];
        if (res) {
            delete cached[key];
            return Promise.resolve(res);
        }
        // wait for received data
        return new Promise((resolve, reject) => {
            let remove = addWatcher(key, obj => {
                delete cached[key];
                resolve(obj);
            });
            setTimeout(() => {
                remove();
                reject(new Error(`Source ${name} timeout in ${timeout / 1000}s`));
            }, timeout);
        });
    },
    setResult(id, name, res) {
        let key = `${id}-${name}`;
        watched[key] = res;
    }
};
//# sourceMappingURL=remote-store.js.map
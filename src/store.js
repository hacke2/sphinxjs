/* 数据存储类 */
'use strict';
function Store() {
    this._store = {};
}

Store.prototype = {

    constructor: Store,

    // 添加
    add: function (key, value) {
        this._store[key] = value;
    },

    // 删除
    remove: function (key) {
        delete this._store[key];
    },

    // 查找
    find: function (key) {
        return this._store[key];
    },

    // 清空
    clear: function () {
        Object.keys(this._store)
        .forEach(function (key) {
            this.remove(key);
        }.bind(this));
    },

    // 遍历
    each: function (cb) {
        Object.keys(this._store)
        .forEach(function (key) {
            cb(this.find(key));
        }.bind(this));
    }

};
module.exports = Store;

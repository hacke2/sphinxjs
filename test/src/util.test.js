'use strict';
var util = require('../../src/util.js');
var expect = require('chai').expect;
var path = require('path');
var dataPath = path.resolve(__dirname, '../data');

describe('sphinx util.js', function () {
    describe('isFile()', function () {
        it('判定给定的path，是否是一个存在的文件', function (done) {
            var pth = dataPath + '/util.data.js';

            expect(util.isFile(pth)).to.be.ok;
            expect(util.isFile(dataPath)).to.be.not.ok;
            done();
        });
    });

    describe('isDir()', function () {
        it('判定给定的path，是否是一个存在的目录', function (done) {
            var pth = dataPath + '/util.data.js';

            expect(util.isDir(dataPath)).to.be.ok;
            expect(util.isDir(pth)).to.be.not.ok;
            done();
        });
    });
    describe('isText()', function () {
        it('判定给定的path，是否是一个文本', function (done) {

            expect(util.isText('.js')).to.be.ok;
            expect(util.isText('.png')).to.be.not.ok;
            done();
        });
    });
    describe('extname()', function () {
        it('获取扩展名', function (done) {

            expect(util.extname('test.js')).to.be.equal('.js');
            expect(util.isText('test.png')).to.be.not.equal('.js');
            done();
        });
    });
    describe('isImage', function () {
        it('给定的扩展名是否图片', function (done) {
            expect(util.isImage('.png')).to.be.ok;
            expect(util.isImage('.js')).to.be.not.ok;
            done();
        });
    });
    describe('isJs', function () {
        it('给定的扩展名是否JS', function (done) {
            expect(util.isJs('.js')).to.be.ok;
            expect(util.isJs('.png')).to.be.not.ok;
            done();
        });
    });
    describe('isCss', function () {
        it('给定的扩展名是否样式文件', function (done) {
            expect(util.isCss('.scss')).to.be.ok;
            expect(util.isCss('.sass')).to.be.ok;
            expect(util.isCss('.css')).to.be.ok;
            expect(util.isCss('.js')).to.be.not.ok;
            done();
        });
    });
    describe('isHtml', function () {
        it('给定的扩展名是否HTML', function (done) {
            expect(util.isHtml('.html')).to.be.ok;
            expect(util.isHtml('.js')).to.be.not.ok;
            done();
        });
    });
    describe('basename', function () {
        it('给定的扩展名是否HTML', function (done) {
            expect(util.basename('test/xx.html')).to.be.equal('xx.html');
            done();
        });
    });
});

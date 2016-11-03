'use strict';

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var esquery = require('esquery');
var Syntax = require('./syntax.js');
var requireDeclare = [':function[id.name = "require"]', 'AssignmentExpression[left.name = "require"][right.callee.type = "FunctionExpression"]', 'AssignmentExpression[left.name = "require"][right.type = "FunctionExpression"]'];
var requireCall = ['CallExpression[callee.name = "require"]'];
var moduleExports = ['MemberExpression[property.name = "exports"][object.name = "module"]'];
var pth = require('path');
var fs = require('fs');
var crypto = require('crypto');
var pathIsAbsolute = require('path-is-absolute');
var DEFAULTNAMESPACE = 'sm';
var src;

function error(message) {
    throw new Error(message + 'in [' + src + ']');
}
var util = {
    md5: function (data, len) {
        var md5sum = crypto.createHash('md5'),
            encoding = typeof data === 'string' ? 'utf8' : 'binary';

        md5sum.update(data, encoding);
        len = len || 7;
        return md5sum.digest('hex').substring(0, len);
    },
    content2AST: function (content) {
        try {
            return esprima.parse(content, {
                loc: true,
                range: true,
                tolerant: true
            });
        } catch (e) {
            error(e.message);
        }
    },

    buildMemberExpression: function (name, ns) {
        ns = ns || DEFAULTNAMESPACE;

        return {
            type: Syntax.MemberExpression,
            computed: false,
            object: {
                type: Syntax.Identifier,
                name: ns
            },
            property: {
                type: Syntax.Identifier,
                name: name
            }
        };
    },

    wrap: function (ast, exportName, ns) {
        var wrapper = [],
            wAst;

        ns = ns || DEFAULTNAMESPACE;
        wrapper.push('(function(' + ns + '){');
        if (exportName && this.isExports(ast, moduleExports)) {
            wrapper.push(exportName + ' = ' + exportName + ' || {};');
        }

        wrapper.push('})((window.' + ns + ' = window.' + ns + ' || {}));');

        wAst = this.content2AST(wrapper.join(''));

        estraverse.replace(wAst, {
            leave: function (node, parent) {
                var body,
                    item;

                if (node.type === Syntax.BlockStatement && parent.type === Syntax.FunctionExpression && parent.params[0].name === ns) {
                    body = [].slice.call(node.body, 0);
                    item = [].slice.call(ast.body, 0);

                    for (var i = 0, len = item.length; i < len; i++) {
                        body.splice(1 + i, 0, item[i]);
                    }

                    return {
                        type: node.type,
                        body: body
                    };
                }
            }
        });

        return wAst;
    },

    isRequire: function (node) {
        return node.type === Syntax.CallExpression && node.callee.name === 'require';
    },
    isExports: function (node) {
        return node.type == Syntax.MemberExpression && 'name' in node.object && node.object.name === 'module' && 'name' in node.property && node.property.name === 'exports';
    },
    isExistsNode: function (ast, partterns) {
        var isFlag, matches;

        if (!Array.isArray(partterns)) {
            partterns = [partterns];
        }

        for (var i = 0, parttern; parttern = partterns[i]; i++) {
            try {
                matches = esquery.match(ast, esquery.parse(parttern));
                isFlag = matches.length > 0;
            } catch (e) {
                isFlag = false;
            }

            if (isFlag) {
                return true;
            }
        }
        return isFlag;
    },
    requireArgHandle: function (argv, based, isCheckFileExists) {
        var requireArgv, absPath;

        // require 没有参数
        if (argv.length == 0) {
            error('exists no parameter require');
        }
        // require 参数不是String
        if (argv[0].type !== Syntax.Literal || typeof argv[0].value !== 'string') {
            error('require function accepts only string parameter');
        }
        requireArgv = argv[0].value;

        if (pth.extname(requireArgv).replace('.', '') == '') {
            requireArgv += '.js';
        }

        absPath = pth.resolve(based, requireArgv);

        if (isCheckFileExists && !fs.existsSync(absPath)) {
            error('unable to find file: ' + absPath);
        }
        return pth.relative(based, requireArgv);
    },
    buildId: function (src) {
        var basename = pth.basename(src);

        return basename.replace(/[:\/\\.-]+/g, '_') + this.md5(src, 7);
    },

    ast2Content: function (ast, isCompress) {
        var escodegenConf = {
                format: {
                    escapeless: true
                }
            },
            content;

        if (isCompress) {
            escodegenConf = {
                format: {
                    indent: {
                        style: '',
                        base: 0
                    },
                    compact: true,
                    newLine: '',
                    escapeless: 'true'
                }
            };
        }
        try {
            content = escodegen.generate(ast, escodegenConf);
        } catch (e) {
            error(e.message);
        }
        return content;
    }

};

module.exports = function (opts) {
    var content, based, isCheckFileExists,
        ast, deps = [],
        ns, exportName,
        isWrap, compress;

    opts = opts || {};
    if (!pathIsAbsolute(opts.src)) {
        error('src must be absolute path');
    }
    if (!opts.content) {
        error('content is required');
    }
    src = opts.src;
    compress = opts.compress;
    based = opts.based || pth.dirname(src);
    content = opts.content;
    ns = opts.ns || DEFAULTNAMESPACE;
    isWrap = opts.isWrap;

    isCheckFileExists = opts.isCheckFileExists;
    ast = util.content2AST(content);
    // 存在require的声明或者 没有require和module.exports,则跳过该文件
    if (util.isExistsNode(ast, requireDeclare) || (!util.isExistsNode(ast, requireCall) && !util.isExistsNode(ast, moduleExports))) {
        return {
            content: content,
            deps: []
        };
    }

    estraverse.replace(ast, {
        enter: function (node, parent) {
            if (node.type === Syntax.ExpressionStatement && util.isRequire(node.expression)) {
                deps.push(util.requireArgHandle(node.expression.arguments, based, isCheckFileExists));
                return estraverse.VisitorOption.Remove;
            }
        },
        leave: function (node, parent) {
            var path, id;

            if (node.type === Syntax.ExpressionStatement && !node.expression) {
                return estraverse.VisitorOption.Remove;
            }

            if (util.isRequire(node)) {
                path = util.requireArgHandle(node.arguments, based, isCheckFileExists);
                deps.push(path);
                id = util.buildId(pth.resolve(based, path));

            }

            if (util.isExports(node)) {
                id = util.buildId(src);
                exportName = ns + '.' + id;
            }
            if (id) {
                return util.buildMemberExpression(id, ns);
            }
        }
    });

    if (isWrap) {
        ast = util.wrap(ast, exportName);
    }

    return {
        content: util.ast2Content(ast, compress),
        deps: deps
    };
};

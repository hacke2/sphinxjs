'use strict';

// nodejs 版本检测
if (process.version < 'v4') {
    console.log('Nodejs 版本太低，请升级到v4.0.0及以上再安装！');
    process.exit(1);
}

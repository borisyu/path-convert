# 路径转换工具（仅供个人使用）
__描述：__开发环境下需要打包提交的文件路径转换成生产环境的路径
### 安装（工具依赖）
```js
npm install
```
### 使用
1. 在当前目录下新建配置文件 config.js
```js
{
    command: '',   // svn log 命令
    user: '',      // svn 用户名
    pathReg: {},   // 各个目录下对应的替换正则
    replaceTo: {}  // 替换路径
}
```
2. 运行工具
```js
node --harmony app.js
```
__代码用到 ES6 的新增特性 ___Generator___，因此启动程序时需要新增___--harmony___参数__

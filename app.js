var exec = require('child_process').exec;
var fs = require('fs');
var co = require('co');
var cheerio = require('cheerio');
var cfg = require('./config');
var pathReg = cfg.pathReg;
var replaceTo = cfg.replaceTo;
var results = [];
var $ = null;

/**
 * 获取SVN日志记录
 * @param  {String} command svn log命令
 * @return {Object}         Promise对象
 */
function getSvnLog(command) {
    return new Promise(function(resolve, reject) {
        exec(command, function(err, stdout, stderr) {
            if (!err) resolve(stdout);
            reject(err, stderr);
        });
    });
}

/**
 * 讲内容转包装成$对象
 * @param  {String} content 日志XML内容
 * @return {Object}         $ 对象
 */
function toJqueryLike(content) {
    return cheerio.load(content, {
        xmlMode: true,
        lowerCaseTags: true,
        normalizeWhitespace: true
    });
}

/**
 * 从日志中提取指定用户的SVN记录
 * @param  {String} user SVN用户名
 * @return {Array}       结果对象数组
 */
function findLogsByUser(user) {
    var logs = $('author').map(function(index, ele) {
        var $this = $(this);
        if ($this.text() === user) return $this.parent();
    }).get();
    return logs;
}

/**
 * 将日志转换成patch邮件模板内容
 * @param  {String} logs 待处理的日志记录
 * @return {String}      patch邮件内容
 */
function parseToMailContent(logs) {
    var results = [];
    logs.forEach(function(log, index, logs) {
        // patch的标题
        results.push(log.find('msg').text() + '\n');
        // patch的文件路径
        var filePath = log.find('path').map(function(index, ele) {
            var path = $(this).text();
            // 路径替换
            if ( pathReg.p.test(path) ) {  // 个人
                path = path.replace(pathReg.p, replaceTo.p);
            } else if ( pathReg.c.test(path) ) {  // 企业
                path = path.replace(pathReg.c, replaceTo.c);
            } else if ( pathReg.w.test(path) ) {  // 维护
                path = path.replace(pathReg.w, replaceTo.w);
            }
            return path + '\n';
        }).get().join('');
        results.push(filePath + '\n');
    });
    return results.join('');
}

/**
 * 将内容输出到文件
 * @param  {String} content patch内容
 * @return {Object}         Promise
 */
function outputPatch(content) {
    return new Promise(function(resolve, reject) {
        if (!content) reject(new Error('No content to output.'));
        fs.writeFile('./patch.txt', content, function(err) {
            if (!err) resolve(true);
            reject(err);
        });
    });
}


co(function* () {
    return yield getSvnLog(cfg.command);
})
.then(function(content) {
    $ = toJqueryLike(content);
    var logs = findLogsByUser(cfg.user);
    var commitsCnt = parseToMailContent(logs);
    return commitsCnt ? Promise.resolve(commitsCnt) : Promise.reject(new Error('Failed to parsing logs to mail content.'));
})
.then(function(content) {
    outputPatch(content);
})
.then(function() {
    console.log('Done!');
})
.catch(function(err) {
    console.error(err.stack);
});

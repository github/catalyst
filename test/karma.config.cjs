/* eslint-disable-next-line @typescript-eslint/no-var-requires */
process.env.CHROME_BIN = require('chromium').path

module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai-spies', 'chai'],
    files: [
      {pattern: 'lib/*.js', type: 'module', included: false},
      {pattern: 'test/*', type: 'module', included: true}
    ],
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  })
}

module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai-spies', 'chai'],

    files: [
      {pattern: 'lib/*.js', type: 'module', included: false},
      {pattern: 'test/*', type: 'module', included: true}
    ]
  })
}

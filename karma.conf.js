// Karma configuration
// Generated on Fri Mar 16 2018 16:09:15 GMT-0600 (MDT)

const rollupBabel = require('rollup-plugin-babel');
const rollupCjs = require('rollup-plugin-commonjs');
const rollupNode = require('rollup-plugin-node-resolve');
const istanbul = require('rollup-plugin-istanbul');

module.exports = function (config) {
  const userBrowsers = config.browsers;
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'detectBrowsers', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      {
        pattern: 'test/*_test.js',
        watched: true,//Our rollup preprocessor handles watching
      },
      {
        pattern: 'src/*.js',
        included: false,
      }
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*_test.js': ['rollup'],
    },

    rollupPreprocessor: {
      output: {
        format: 'iife',
        name: 'byuBrowserOauth',
        sourcemap: 'inline',
      },
      plugins: [
        istanbul({ exclude: ['test/*.js', 'node_modules/**/*'] }),
        rollupBabel(),
        rollupCjs(),
        rollupNode({preferBuiltins: false})
      ]
    },

    detectBrowsers: {
      enabled: userBrowsers.length === 0,
      usePhantomJS: false,
      preferHeadless: true,
      postDetection: function(available) {
        const result = available;
        const chrome = available.indexOf('Chrome');
        if (chrome > -1) {
          result.splice(chrome, 1, 'ChromeHeadless')
        }

        // We no longer need to support IE
        const IE = available.indexOf('IE');
        if (IE > -1) {
          result.splice(IE, 1)
        }

        return result;
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['Chrome', 'Firefox', 'Safari', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
};

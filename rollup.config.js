import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

const input = 'src/implicit-grant.js';
const out = 'dist/implicit-grant';

export default [
   {
    input,
    output: {
        file: `${out}.js`,
        format: 'es',
        sourcemap: true,
    },
},
  {
    input,
    output: {
        file: `${out}.min.js`,
        format: 'es',
        sourcemap: true,
    },
    plugins: [
        uglify(),
    ],
},
    {
    input,
    output: {
        file: `${out}.nomodule.js`,
        format: 'iife',
        name: 'BYU.oauth.implicit',
        sourcemap: true,
    },
    plugins: [
        buble(),
    ],
},
{
    input,
    output: {
        file: `${out}.nomodule.min.js`,
        format: 'iife',
        name: 'BYU.oauth.implicit',
        sourcemap: true,
    },
    plugins: [
        buble(),
        uglify(),
    ],
},
];
import babel from 'rollup-plugin-babel';
import cjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import mini from 'rollup-plugin-babel-minify';
import { plugin as analyze } from 'rollup-plugin-analyzer'

const input = 'src/implicit-grant.mjs';
const out = 'dist/implicit-grant';

function plugins(...extras) {
  return [babel(), cjs(), nodeResolve({preferBuiltins: false}), ...extras];
}

export default [
  {
    input,
    output: {
      file: `${out}.mjs`,
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins(),
  },
  {
    input,
    output: {
      file: `${out}.min.mjs`,
      format: 'es',
      sourcemap: true,
    },
    plugins: plugins(analyze(), mini()),
  },
  {
    input,
    output: {
      file: `${out}.nomodule.js`,
      format: 'iife',
      name: 'BYU.oauth.implicit',
      sourcemap: true,
    },
    plugins: plugins(),
  },
  {
    input,
    output: {
      file: `${out}.nomodule.min.js`,
      format: 'iife',
      name: 'BYU.oauth.implicit',
      sourcemap: true,
    },
    plugins: plugins(mini()),
  },
];

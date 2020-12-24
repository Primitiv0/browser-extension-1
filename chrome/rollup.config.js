import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'chrome/src/popup.mjs',
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
  ],
};


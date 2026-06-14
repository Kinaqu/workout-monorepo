module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Unistyles 3 compile-time transform. babel-preset-expo still appends the
    // Reanimated/worklets plugin automatically, so it stays last.
    plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
  };
};

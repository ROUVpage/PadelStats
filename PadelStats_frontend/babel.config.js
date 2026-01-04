module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
        corejs: false,
        version: require('@babel/runtime/package.json').version
      }],
      'react-native-reanimated/plugin',
      'expo-router/babel'
    ]
  };
};

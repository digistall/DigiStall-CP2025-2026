module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // MVC Role-Based Folder Aliases - Import from role folders
            '@auth-mobile': '../../AUTH/FRONTEND-MOBILE',
            '@stall-holder-mobile': '../../STALL-HOLDER/FRONTEND-MOBILE',
            '@vendor-mobile': '../../VENDOR/FRONTEND-MOBILE',
            '@employee-mobile': '../../EMPLOYEE/FRONTEND-MOBILE',
            '@shared-mobile': '../../SHARED/FRONTEND-MOBILE',
            // Services and common components
            '@services': '../../SHARED/FRONTEND-MOBILE/SERVICES',
            '@common': '../../SHARED/FRONTEND-MOBILE/COMPONENTS/common',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

require('dotenv').config();
const path = require('node:path');

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const { version } = require('./package.json');
const iconDir = path.resolve(__dirname, 'icons');

const commonLinuxConfig = {
  categories: ['Utility'],
  icon: {
    '512x512': path.resolve(iconDir, 'Icon.png'),
    '1024x1024': path.resolve(iconDir, 'Icon@2x.png'),
  },
  homepage: 'https://github.com/pawonair/bus-schedule',
};

module.exports = {
  packagerConfig: {
    name: 'VGN Bus Schedule',
    executableName: 'vgn-bus-schedule',
    asar: true,
    icon: path.resolve(__dirname, 'icons'),
    appCategoryType: 'public.app-category.developer-tools',
    protocols: [
      {
        name: 'VGN Bus Schedule App Launch Protocol',
        schemes: ['vgn-bus-schedule'],
      },
    ],
    win32metadata: {
      CompanyName: 'Pawan Sunuwar',
      OriginalFilename: 'VGN Bus Schedule',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: (arch) => ({
        exe: 'vgn-bus-schedule.exe',
        iconUrl: 'https://raw.githubusercontent.com/pawonair/bus-schedule/refs/heads/main/icons/Icon.ico',
        noMsi: true,
        setupExe: `vgn-bus-schedule${version}-win32-${arch}-setup.exe`,
        setupIcon: path.resolve(iconDir, 'Icon.ico'),
        authors: 'Pawan Sunuwar',
        description: 'VGN Bus Schedule app',
      }),
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: commonLinuxConfig,
    },
    {
      name: '@electron-forge/maker-rpm',
      config: commonLinuxConfig,
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: path.resolve(iconDir, 'Icon.icns'),
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        authToken: process.env.GITHUB_TOKEN,
        repository: {
          owner: 'pawonair',
          name: 'bus-schedule',
        },
        draft: true,
        prerelease: false,
        generateReleaseNotes: true,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './icons/'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://github.com/pawonair/bus-schedule/icons/Icon.ico',
        setupIcon: './icons/Icon.ico',
        authors: 'Pawan Sunuwar',
        description: 'VGN - Bus Schedule app',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      icon: './icons/Icon.png',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './icons/Icon.png',
          maintainer: 'Pawan Sunuwar',
          homepage: 'https://github.com/pawonair/bus-schedule',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './icons/Icon.png',
          homepage: 'https://github.com/pawonair/bus-schedule',
        },
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './icons/Icon.icns',
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

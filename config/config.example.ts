import { UserConfig } from './internal/types';

// This is meant as a complete example of the configuration

// Docs: https://wiki.mirasaki.dev/docs/remote-file-access-api/configuration

const userConfig: UserConfig = {
  API_KEY: '__REPLACE_THIS_WITH_A_STRONG_API_KEY',
  PORT: 9000,
  REMOTE_FILES: [
    {
      NAME: 'Air Raids',
      FILE_NAME: 'AirRaid.txt',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles',
      // Linux:
      // DIRECTORY: '/home/mirasaki/projects/started-but-never-finished-381',
      USE_LATEST_LINES: 500
    },
    {
      NAME: 'Loot Chests',
      FILE_NAME: 'LootChests_LOG.txt',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\CJ_LootChests',
      USE_LATEST_LINES: 500,
    },
    {
      NAME: 'Treasure',
      FILE_NAME: 'Treasure.txt',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\Treasure',
      USE_LATEST_LINES: 500
    },

    {
      NAME: 'Code Lock - Access',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\CodeLock\\Logs\\Access',
    },
    {
      NAME: 'Code Lock - Attach',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\CodeLock\\Logs\\Attach',
    },
    {
      NAME: 'Code Lock - Raid',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\CodeLock\\Logs\\Raid',
    },

    {
      NAME: 'Casino',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\DayZCasinoV2',
      EXTENSION: 'csv'
    },
    {
      NAME: 'Expansion',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\ExpansionMod\\Logs',
    },
    {
      NAME: 'Hacking',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\HackingSystemV2\\Logs',
    },
    {
      NAME: 'King of the Hill',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\KOTH\\Logs',
    }
  ],
  REMOTE_DIRECTORIES: [
    {
      NAME: 'Server 0 - Profiles',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles',
      EXTENSIONS: null
    }
  ],
  REMOTE_JSON_DATABASES: [
    {
      NAME: 'LB Banking | Balance',
      DIRECTORY: 'C:\\OmegaManager\\servers\\0\\profiles\\LB_Banking\\Players',
    }
  ]
};

export default userConfig;
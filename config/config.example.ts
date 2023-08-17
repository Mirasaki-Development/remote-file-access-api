import { UserConfig } from './internal/types';

// This is meant as a complete example of the configuration

const userConfig: UserConfig = {
  API_KEY: '__REPLACE_THIS_WITH_A_STRONG_API_KEY',
  PORT: 9000,
  REMOTE_FILES: [
    {
      NAME: 'Air Raids',
      FILE_NAME: 'AirRaid.txt',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles',
      USE_LATEST_LINES: 500
    },
    {
      NAME: 'Loot Chests',
      FILE_NAME: 'LootChests_LOG.txt',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/CJ_LootChests',
      USE_LATEST_LINES: 500,
    },
    {
      NAME: 'Treasure',
      FILE_NAME: 'Treasure.txt',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/Treasure',
      USE_LATEST_LINES: 500
    },

    {
      NAME: 'Code Lock - Access',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/CodeLock/Logs/Access',
    },
    {
      NAME: 'Code Lock - Attach',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/CodeLock/Logs/Attach',
    },
    {
      NAME: 'Code Lock - Raid',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/CodeLock/Logs/Raid',
    },

    {
      NAME: 'Casino',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/DayZCasinoV2',
      EXTENSION: 'csv'
    },
    {
      NAME: 'Expansion',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/ExpansionMod/Logs',
    },
    {
      NAME: 'Hacking',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/HackingSystemV2/Logs',
    },
    {
      NAME: 'King of the Hill',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/KOTH/Logs',
    }
  ],
  REMOTE_JSON_DATABASES: [
    {
      NAME: 'LB Banking | Balance',
      DIRECTORY: '/home/mirasaki/OmegaManager/servers/0/profiles/LB_Banking/Players',
    }
  ]
};

export default userConfig;
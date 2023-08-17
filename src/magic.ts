export const WELL_KNOWN_PORT_RANGE = 1024;
export const VALID_PORT_RANGE_MAX = 65535;
export const EPHEMERAL_PORT_RANGE_START = 49152;
export const EPHEMERAL_PORT_RANGE_END = VALID_PORT_RANGE_MAX;

export const RECOMMENDED_API_KEY_LENGTH = 128;

/**
 * Represents key-value pairs of otherwise ambiguous random numbers
 */
const magic = {
  WELL_KNOWN_PORT_RANGE,
  VALID_PORT_RANGE_MAX,
  EPHEMERAL_PORT_RANGE_START,
  EPHEMERAL_PORT_RANGE_END,
  RECOMMENDED_API_KEY_LENGTH
};

export default magic;
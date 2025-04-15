 const WELL_KNOWN_PORT_RANGE = 1024;
 const VALID_PORT_RANGE_MAX = 65535;
 const EPHEMERAL_PORT_RANGE_START = 49152;
 const EPHEMERAL_PORT_RANGE_END = VALID_PORT_RANGE_MAX;
 const RECOMMENDED_API_KEY_LENGTH = 128;
 const MS_IN_ONE_NS = 1000000;

/** Represents key-value pairs of otherwise ambiguous random numbers */
class Magic {
  public static readonly WELL_KNOWN_PORT_RANGE = WELL_KNOWN_PORT_RANGE;
  public static readonly VALID_PORT_RANGE_MAX = VALID_PORT_RANGE_MAX;
  public static readonly EPHEMERAL_PORT_RANGE_START = EPHEMERAL_PORT_RANGE_START;
  public static readonly EPHEMERAL_PORT_RANGE_END = EPHEMERAL_PORT_RANGE_END;
  public static readonly RECOMMENDED_API_KEY_LENGTH = RECOMMENDED_API_KEY_LENGTH;
  public static readonly MS_IN_ONE_NS = MS_IN_ONE_NS;
}

export {
  Magic as default,
  Magic
}
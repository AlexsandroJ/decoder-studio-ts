const state = {
  bytes: new Array(8).fill(0),
  selectedBits: new Set(),
  lastClickedBit: null,
  rules: [],
  editingRuleId: null,
  requestLog: [],
  rawData: [],

  analyzer: {
    selectedCanId: null,
    canIds: [],
    framesByCanId: {},
    frequencies: {},
    lastBytes: {},
    translations: {},
    refreshTimer: null
  }
};

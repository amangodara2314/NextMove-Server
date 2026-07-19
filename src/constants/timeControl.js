import { TimeControl } from "@prisma/client";

const getTimeControl = () => {
  return {
    types: ["BULLET", "BLITZ", "RAPID"],
    BULLET: [
      {
        title: "1m",
        baseTime: 60000, // in milliseconds
        increment: 0,
        timeControl: "BULLET_1_0",
      },
    ],
    BLITZ: [
      {
        title: "3m",
        baseTime: 180000,
        increment: 0,
        timeControl: "BLITZ_3_0",
      },
      {
        title: "5m",
        baseTime: 300000,
        increment: 0,
        timeControl: "BLITZ_5_0",
      },
    ],
    RAPID: [
      {
        title: "10m",
        baseTime: 600000,
        increment: 0,
        timeControl: "RAPID_10_0",
      },
      {
        title: "15m",
        baseTime: 900000,
        increment: 0,
        timeControl: "RAPID_15_0",
      },
      {
        title: "25m",
        baseTime: 1500000,
        increment: 0,
        timeControl: "RAPID_25_0",
      },
    ],
  };
};

const TIME_CONTROL = {
  BULLET_1_0: {
    initialTime: 60000, //  in milliseconds
    increment: 0,
    label: "1+0",
  },

  BLITZ_3_0: {
    initialTime: 180000,
    increment: 0,
    label: "3+0",
  },

  BLITZ_5_0: {
    initialTime: 300000,
    increment: 0,
    label: "5+0",
  },

  RAPID_10_0: {
    initialTime: 600000,
    increment: 0,
    label: "10+0",
  },

  RAPID_15_0: {
    initialTime: 900000,
    increment: 0,
    label: "15+0",
  },

  RAPID_25_0: {
    initialTime: 1500000,
    increment: 0,
    label: "25+0",
  },
};
export { getTimeControl, TIME_CONTROL };

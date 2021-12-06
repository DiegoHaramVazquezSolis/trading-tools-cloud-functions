const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const moment = require('moment');
const { getTradesBasedOnTimeRanges, saveMonthlyPerformanceData } = require('./services/database');
const { WIN, LOSS, STOP, MANUALLY, TAKE_PROFIT, EVEN } = require('./utils/constants');

exports.generateMonthlyPerformanceRecord = functions.pubsub.schedule('0 0 1 * *').timeZone('America/Mexico_City').onRun(async (context) => {
    const firstDate = moment().subtract(1, 'month').startOf('month');
    const lastDate = moment().subtract(1, 'month').endOf('month');

    const trades = await getTradesBasedOnTimeRanges(firstDate.toDate(), lastDate.toDate());

    const performanceValues = {
        // Fields necessary to calculate the ratios
        winPLSum: 0,
        winCount: 0,
        lossPLSum: 0,
        lossCount: 0,
        evenCount: 0,
        winnersDaysHeldSum: 0,
        lossersDaysHeldSum: 0,
        evenDaysHeldSum: 0,

        // Ratios and data to save
        avgGain: null,
        avgLoss: null,
        winningPercentage: null,
        winLossRatio: null,
        adjWinLossRatio: null,
        largestWin: 0,
        largestLoss: 0,
        totalTrades: 0,
        avgWinnersDaysHeld: null,
        avgLossersDaysHeld: null,
        avgEvenDaysHeld: null,
        stopsTriggered: 0,
        manualClosures: 0,
        takeProfitsTriggered: 0,
        recordId: firstDate.format('MMMM-YYYY')
    };

    performanceValues.totalTrades = trades.docs.length;

    trades.forEach((tradeSnap) => {
        const trade = tradeSnap.data();

        if (trade.status === WIN) {
            performanceValues.winPLSum += trade.PLPercentage;
            performanceValues.winCount++;

            performanceValues.winnersDaysHeldSum += trade.daysHeld;

            if (trade.PLPercentage > performanceValues.largestWin) {
                performanceValues.largestWin = trade.PLPercentage;
            }

            if (trade.closedBy === MANUALLY) {
                performanceValues.manualClosures++;
            } else if (trade.closedBy === TAKE_PROFIT) {
                performanceValues.takeProfitsTriggered++;
            }
        } else if (trade.status === LOSS) {
            performanceValues.lossPLSum += trade.PLPercentage;
            performanceValues.lossCount++;

            performanceValues.lossersDaysHeldSum += trade.daysHeld;

            if (trade.PLPercentage < performanceValues.largestLoss) {
                performanceValues.largestLoss = trade.PLPercentage;
            }

            if (trade.closedBy === STOP) {
                performanceValues.stopsTriggered++;
            } else if (trade.closedBy === MANUALLY) {
                performanceValues.manualClosures++;
            }
        } else if (trade.status === EVEN) {
            performanceValues.evenCount++;
            performanceValues.evenDaysHeldSum += trade.daysHeld;
        }
    });

    // Calculate ratios
    performanceValues.avgGain = performanceValues.winPLSum / performanceValues.winCount;
    performanceValues.avgLoss = performanceValues.lossPLSum / performanceValues.lossCount;

    performanceValues.winningPercentage = performanceValues.winCount / performanceValues.totalTrades;

    performanceValues.winLossRatio = performanceValues.winCount / performanceValues.lossCount;
    performanceValues.adjWinLossRatio = (performanceValues.avgGain * performanceValues.winningPercentage) / (Math.abs(performanceValues.avgLoss) * (1 - performanceValues.winningPercentage));

    performanceValues.avgWinnersDaysHeld = performanceValues.winnersDaysHeldSum / performanceValues.winCount;
    performanceValues.avgLossersDaysHeld = performanceValues.lossersDaysHeldSum / performanceValues.lossCount;
    performanceValues.avgEvenDaysHeld = performanceValues.evenDaysHeldSum / performanceValues.evenCount;

    await saveMonthlyPerformanceData(
        performanceValues.recordId,
        performanceValues.avgGain,
        performanceValues.avgLoss,
        performanceValues.winningPercentage,
        performanceValues.winLossRatio,
        performanceValues.adjWinLossRatio,
        performanceValues.largestWin,
        performanceValues.largestLoss,
        performanceValues.totalTrades,
        performanceValues.avgWinnersDaysHeld,
        performanceValues.avgLossersDaysHeld,
        performanceValues.avgEvenDaysHeld,
        performanceValues.stopsTriggered,
        performanceValues.manualClosures,
        performanceValues.takeProfitsTriggered,
        performanceValues.winCount,
        performanceValues.lossCount,
        performanceValues.evenCount);

    return null;
});

const admin = require('firebase-admin');

const database = admin.firestore();
const closedTradesRef = database.collection('ClosedTrades');
const monthlyPerformanceRef = database.collection('MonthlyPerformance');

/**
 * Get all the trades from database between two given dates (inclusive for both dates)
 *
 * @param {date} firstDate First valid date to get trades
 * @param {date} lastDate Last valid date to get trades
 *
 * @returns Snapshot of the query
 */
async function getTradesBasedOnTimeRanges(firstDate, lastDate) {
    return await closedTradesRef.where('exitDate', '>=', firstDate).where('exitDate', '<=', lastDate).get();
}

/**
 * Save on the database the data of a month performance
 *
 * @param {string} recordId Record identifier on the database
 * @param {number} avgGain Average gain % per winning trade
 * @param {number} avgLoss Average loss % per looser trade
 * @param {number} winningPercentage Percentage of winning trades
 * @param {number} winLossRatio Percentage of winning trades
 * @param {number} adjWinLossRatio Expectancy in the long run
 * @param {number} largestWin Largest % win
 * @param {number} largestLoss Largest % loss
 * @param {number} totalTrades Total of trades analized
 * @param {number} avgWinnersDaysHeld Average number of days that the winners were held
 * @param {number} avgLossersDaysHeld Average number of days that the lossers were held
 * @param {number} avgEvenDaysHeld Average number of days that the trades closed on break even were held
 * @param {number} stopsTriggered Number of trades closed by the stop loss
 * @param {number} manualClosures Number of trades closed manually
 * @param {number} takeProfitsTriggered Number of trades closed by a take profit (or back stop)
 * @param {number} winCount Number of winners trades
 * @param {number} lossCount Number of lossers trades
 * @param {number} evenCount Number of trades closed on break even
 *
 * @returns Promise resolved with the write time of the record
 */
async function saveMonthlyPerformanceData(recordId, avgGain, avgLoss, winningPercentage, winLossRatio, adjWinLossRatio, largestWin, largestLoss, totalTrades, avgWinnersDaysHeld, avgLossersDaysHeld, avgEvenDaysHeld, stopsTriggered, manualClosures, takeProfitsTriggered, winCount, lossCount, evenCount) {
    return await monthlyPerformanceRef.doc(recordId).set({
        avgGain,
        avgLoss,
        winningPercentage,
        winLossRatio,
        adjWinLossRatio,
        largestWin,
        largestLoss,
        totalTrades,
        avgWinnersDaysHeld,
        avgLossersDaysHeld,avgEvenDaysHeld,
        stopsTriggered,
        manualClosures,
        takeProfitsTriggered,
        winCount,
        lossCount,
        evenCount
    });
}

module.exports = {
    getTradesBasedOnTimeRanges,
    saveMonthlyPerformanceData
};
const MIN_NOTICE_DAYS = 3;
const TEAM_COVERAGE_THRESHOLD = 0.5;
const ESCALATION_DAYS = 2;

function daysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getNoticeDays(today, startDate) {
    const diff = new Date(startDate) - new Date(today);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

module.exports = { MIN_NOTICE_DAYS, TEAM_COVERAGE_THRESHOLD, ESCALATION_DAYS, daysBetween, getNoticeDays };
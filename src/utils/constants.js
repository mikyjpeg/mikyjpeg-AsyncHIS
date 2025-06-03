/**
 * Common constants used throughout the application
 */

// File system related constants
const FILE_SYSTEM = {
    /**
     * Standard indentation for JSON files
     * Used in JSON.stringify(data, null, JSON_INDENT)
     */
    JSON_INDENT: 2
};

// Command types
const COMMAND_TYPES = {
    COMMIT_DEBATER: 'commit_debater',
    UNCOMMIT_DEBATER: 'uncommit_debater',
    SET_CURRENT_DEBATER: 'set_current_debater',
    CLEAR_CURRENT_DEBATER: 'clear_current_debater',
    DEPLOY_ELECTORATE: 'deploy_electorate'
};

module.exports = {
    FILE_SYSTEM,
    COMMAND_TYPES
}; 
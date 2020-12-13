import { logger } from '../logger'
import * as fs from "fs";
import { EchobotConfiguration, EchobotFilter, EchobotRedirect } from '../models';


/**
 * Attempts to locate and load the configuration file.
 * @param path The path to the configuration file, if file is not passed, process variable is used
 * @returns True if configuration loaded successfully, false otherwise.
 */
export function loadConfiguration(path): EchobotConfiguration {



    let config: EchobotConfiguration;
    if (fs.existsSync(path)) {
        // Parse the file as JSON.
        config = JSON.parse(fs.readFileSync(path).toString());

    } else if (process.env.ECHOBOT_CONFIG_JSON) {
        // Parse the env var contents as JSON.
        config = JSON.parse(process.env.ECHOBOT_CONFIG_JSON);
    } else {
        throw Error("No configuration could be found. Either create a config.json file or put the config in the ECHOBOT_CONFIG_JSON environment variable.")
    }
    checkConfiguration(config);
    return config;
}
/**
 * Check the configuration object for errors 
 * @param config the config object
 */
function checkConfiguration(config: EchobotConfiguration): EchobotConfiguration {
    // Ensure the config has a Discord token defined.
    if (!config.token) {
        throw new Error("The Discord Client token is missing from the configuration file.")
    }

    // Validate format of redirects
    if (!config.redirects && !config.filteredRedirects) {
        // Ensure redirects exist.
        throw new Error(
            "You have not defined any redirects. This bot is useless without them."
        );


    } else if (!Array.isArray(config.redirects)) {
        // Ensure redirects is an array.
        throw new Error(
            "The redirects are not properly formatted (missing array). Please check your configuration."
        );

    } else if (
        config.redirects?.length == 0 &&
        config.filteredRedirects?.length == 0
    ) {
        // Ensure we have at least one redirect.
        throw new Error(
            "You have not defined any redirects. This bot is useless without them."
        );
    } else {
        // Check each redirect.
        checkRedirectModel(config.redirects);
        checkFilteredRedirectModel(config.filteredRedirects);


    }
    // Validation complete.
    logger["info"]("Configuration loaded successfully.");
    return config;
}
function checkRedirectModel(redirects: EchobotRedirect[]) {
    for (let redirect of redirects) {
        // Check source.
        if (!redirect.sources || redirect.sources.length == 0) {
            throw new Error("A redirect has no sources.");

        } else if (!Array.isArray(redirect.sources)) {
            throw new Error("A Redirects' sources were not formatted as an array.");

        }

        // Check destination.
        if (!redirect.destinations || redirect.destinations.length == 0) {
            throw new Error("A redirect has no destinations.");



        } else if (!Array.isArray(redirect.destinations)) {
            throw new Error(
                "A redirect's destinations were not formatted as an array."
            );
        }
        redirect.destinations.forEach(destination => {
            if (!destination.id || !destination.token)
                throw new Error("ID or Token was missing from one of the destinations.")
        });
    }
    return true;
}
function checkFilteredRedirectModel(filteredRedirect: EchobotFilter[]) {
    for (let redirect of filteredRedirect) {
        if (redirect.words.length == 0) {
            throw new Error("A Filtered redirect has no words.");
        }
        // Check source.
        if (!redirect.redirect.sources || redirect.redirect.sources.length == 0) {
            throw new Error("A redirect has no sources.");

        } else if (!Array.isArray(redirect.redirect.sources)) {
            throw new Error("A redirect's sources were not formatted as an array.");

        }

        // Check destination.
        if (
            !redirect.redirect.destinations ||
            redirect.redirect.destinations.length == 0
        ) {
            throw new Error("A redirect has no destinations.");

        } else if (!Array.isArray(redirect.redirect.destinations)) {
            throw new Error(
                "A redirect's destinations were not formatted as an array."
            );

        }
    }
    return true;
}


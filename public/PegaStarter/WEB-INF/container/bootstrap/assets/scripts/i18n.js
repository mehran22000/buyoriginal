/*
 Copyright (c) 2013 Antenna Software

 You may study, copy and/or modify this file and use it or any modified version within any
 instance of an Antenna Software product which you have been granted a license to use.

 You may not redistribute copies or modified versions of this file to third parties or make it
 accessible via any public medium without the written permission of Antenna Software.

 This copyright notice must be retained in all copies or modified versions of this file.
 */

// Prepare workspace.
HC$I18N = HC$I18N || {};

// Set config object, as defined in controls.js.
HC$I18N.config = {
    "default": "en",
    "en": {
        // CoreApp: Starting screen
        "starting":                 "Starting...",

        // CoreApp: Login screen
        "username":                 "Username",
        "password":                 "Password",
        "login":                    "Sign in",

        // CoreApp: Loading screen
        "enrollingContainer":       "Enrolling container...",
        "authenticatingToStorages": "Authenticating to the storages...",
        "downloadingApplication":   "Downloading application...",
        "installingApplication":    "Installing application...",
        "checkingForUpdates":       "Checking for application updates...",
        "updatingApplication":      "Updating application...",
        "startingApplication":      "Starting application...",
        "updatingProfile":          "Updating profile...",

        // CoreApp: Change password screen
        "passwordChangedMessage":   "Your password has changed recently. To access local data, please enter your previous password.",
        "continue":                 "Continue",

        // MultiApp
        "goBack":                   "Go Back",

        // MultiApp: Install Application(s) screen / Home screen
        "installApplications":      "Install Application(s)",
        "installingApplications":   "Installing Apps",
        "yourApps":                 "Your Apps",

        // MultiApp: App status
        "installingApp":            "Installing",
        "installedApp":             "Installed",
        "updatingApp":              "Updating",
        "installationFailedApp":    "Failed",
        "appUpdated":               "Updated",

        // MultiApp: Application versions screen
        "applicationVersions":      "Application Versions",
        "ver":                      "Open ver.",
        "reinstall":                "Reinstall",

        // Common
        "copyright":                "&copy; 2014 Pegasystems",
        "settings":                 "Settings",

        //Errors
        "profileServiceError1":     "Internal error: ",
        "profileServiceError2":     "Connection could not be established.",
        "profileServiceError3":     "Enrollment already in progress.",
        "profileServiceError4":     "Invalid Profile Service URL.",
        "profileServiceError5":     "Invalid username or password.",

        "accountManagerError1":     "Internal error: ",
        "accountManagerError2":     "Invalid username or password.",
        "accountManagerError3":     "The account could not be opened.",
        "accountManagerError4":     "The requested account already exists",
        "accountManagerError5":     "The requested account does not exists.",
        "accountManagerError6":     "The requested field does not exists.",
        "accountManagerError7":     "The account is not open.",

        "applicationManagerError1": "The application has not been found",
        "applicationManagerError2": "The application is not installed.",
        "applicationManagerError3": "The application URL is incorrect."
    },
    "dom": { // <DOM element id>: string id
        // CoreApp: Starting screen
        "_starting":                "starting",

        // CoreApp: Login screen
        "_username":                "username",
        "_password":                "password",
        "_login":                   "login",

        // CoreApp: Loading screen
        // All values set in HC$CoreApp.Controller methods

        // CoreApp: Change password screen
        "_passwordChanged":         "passwordChangedMessage",
        "_oldPassword":             "password",
        "_continue":                "continue",

        // MultiApp
        "buttonGoBackHome":         "goBack",
        "buttonGoBackAppVersion":   "goBack",

        // MultiApp: Install Application(s) screen / Home screen
        "_installApplications":     "installApplications",

        // MultiApp: Application versions screen
        "_applicationVersions":     "applicationVersions",

        // Common
        "_copyright":               "copyright",
        "_containerSettings":       "settings"
    }
};
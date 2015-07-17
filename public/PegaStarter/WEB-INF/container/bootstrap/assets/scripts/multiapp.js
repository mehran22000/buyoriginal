/*
 Copyright (c) 2013 Antenna Software

 You may study, copy and/or modify this file and use it or any modified version within any
 instance of an Antenna Software product which you have been granted a license to use.

 You may not redistribute copies or modified versions of this file to third parties or make it
 accessible via any public medium without the written permission of Antenna Software.

 This copyright notice must be retained in all copies or modified versions of this file.
 */

/* -------------------------------------------------------------------------------------------------------------------*/
/* Initialization */
/* -------------------------------------------------------------------------------------------------------------------*/

// Initialize namespace
var HC$MultiApp = {};

/**
 * Setting proper CSS for Retina devices.
 */
HC$UI.setRetinaCSS();

/**
 * Setting meta attribute for iOS7.
 */
HC$UI.setiOSMeta();

// Buttons
HC$MultiApp.headerButtons = {
    "buttonGoBackHome":       new HC$UI.Hidable("buttonGoBackHome"),
    "buttonGoBackAppVersion": new HC$UI.Hidable("buttonGoBackAppVersion"),
    "buttonGoBackSettings": new HC$UI.Hidable("buttonGoBackSettings"),
    "buttonGoBackSwitcher": new HC$UI.Hidable("buttonGoBackSwitcher"),
    "buttonSignOut": new HC$UI.Hidable("buttonSignOut")
};

//Settings button
HC$MultiApp.settingsButton = new HC$UI.Hidable("settings-button");

/**
 * Initialization method for HC$MultiApp.
 * @method onload
 * @static
 */
HC$MultiApp.onload = function() {
    // Init internationalization.
    HC$I18N.init();

    // Create MultiApp controller.
    HC$MultiApp.controller = new HC$MultiApp.Controller();

    // Setting progrssbar message
    HC$MultiApp.controller._setLoadingMessage(_("updatingProfile"));

    // Initialize screens container and screen objects.
    HC$MultiApp.screensContainer = new HC$UI.StackContainer("content");
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("loadingScreen"), true);
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("homeScreen"));
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("switcherScreen"));
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("appVersionsScreen"));
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("appDetailsScreen"));
    HC$MultiApp.screensContainer.addScreen(new HC$UI.Screen("settingsScreen"));

    // Initialize loading ProgressBar object.
    HC$MultiApp.loadingProgressBar = new HC$UI.ProgressBar("loadingProgressBar");

    // Initialize settings UI control.
    HC$MultiApp.settingsInfo = new HC$UI.SettingsInfo("settingsList");

    // After API is ready, start the controller.
    window.onLaunchboxLoaded = function() {
        HC$MultiApp.controller.doStart();
    };
};


/* -------------------------------------------------------------------------------------------------------------------*/
/* Multiapp controller */
/* -------------------------------------------------------------------------------------------------------------------*/


/**
 * Default controller for MultiApp application.
 * @type {Object}
 */
HC$MultiApp.Controller = function() {
    //Fallback for now() method
    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    this.askForUpdateTimestamp = Date.now();
};

// Should contain a map with applications provided by ProfileService.
HC$MultiApp.Controller.appsController = undefined;

/*--------------------*/
/* Controller methods */
/*--------------------*/

/**
 * Fired after all initialization has completed. Triggers entire flow.
 * @method doStart
 */
HC$MultiApp.Controller.prototype.doStart = function() {
    console.log("HC$MultiApp: Starting MultiApp Controller.");

    //setting account manager callback
    launchbox.AccountManager.accountManagerListener = {
        onOpen: function() {},
        onClose: function() {}
    };

    this.doProfileUpdate();
    this.doAccountsCheck();

    //setting info on settings screen
    var bootstrapApp = window.launchbox.ApplicationManager.self;
    var versionString = launchbox.Container.version + "; bootstrap ver. " + bootstrapApp.version;
    HC$MultiApp.settingsInfo.setContainerInfo(bootstrapApp.name, versionString, window.launchbox.Container.deviceId, HC$.config.profileService.url, bootstrapApp.description,  window.launchbox.Container.phoneNumber);

    //setting lifecycle listener
    var that = this;
    launchbox.Container.addLifecycleListener({
        onPause: function() {},
        onResume: function() {
            that._profileUpdateCheck();
        },
        onHide: function() {},
        onShow: function() {
            launchbox.NativeAppSwitcher.hide();
        }
    });
};

/**
 * Performs profile update.
 * @method doProfileUpdate
 */
HC$MultiApp.Controller.prototype.doProfileUpdate = function(askedForUpdate) {
    console.log("HC$MultiApp: Profile update started...");
    if(launchbox.Container.networkStatus.type === "none") {
        this.appsController = new HC$MultiApp.AppsController();
        this.onProfileUpdateSucceeded(false, true);
        return;
    }
    var that = this;
    launchbox.ProfileServiceClient.enrollmentURL = HC$.config.profileService.url;
    this.onProfileUpdateStarted();
    launchbox.ProfileServiceClient.updateProfile({
        onProgress: function(progress) {
            if(!askedForUpdate) {
                that.onProfileUpdateProgress(progress);
            }
        },
        onFailure:  function(error) {
            if(!askedForUpdate) {
                that.onProfileUpdateFailed(error);
            }
        },
        onSuccess:  function(applications) {
            if(!that.appsController) {
                that.appsController = new HC$MultiApp.AppsController(applications);
                that.onProfileUpdateSucceeded(askedForUpdate);
            } else {
                that.appsController.temporaryUpdate(applications);
                that.doAskForUpdate();
            }

        }
    });
};

/**
 * Asks Profile Service about applications and performs update procedure.
 * @method doAskForUpdate
 */
HC$MultiApp.Controller.prototype.doAskForUpdate = function() {
    var that = this;

    var tempCallback = {
        onListChanged: function(applications) {
            launchbox.ApplicationManager.removeApplicationManagerListener(tempCallback);

            if(!that.appsController.isUpdateAvailable(applications)) {
                return;
            }

            var updateConfirmed = confirm("Your applications need to be updated.\n Do you want to close all applications and update now?");
            if(updateConfirmed) {
                for (var appUrl in applications) {
                    if(appUrl !== launchbox.ApplicationManager.self.url) {
                        if(applications[appUrl].state === "started") {
                            launchbox.ApplicationManager.stopApplication(appUrl);
                        }
                    }
                }

                that.appsController.refresh();

                for(var url in that.appsController.psApps) {
                    var currentApp = that.appsController.psApps[url];
                    that.appsController.appsUI.addApplication(url, currentApp.name, currentApp.version, currentApp.icon);
                    that.appsController.appsUI.publishProgress(url, 0);
                }

                that.onProfileUpdateSucceeded(true);

                that.appsController.setAppsFromApplicationsManager(applications, true);

                var appsToProcess = that.appsController.getappsToProcess();
                var appsToRemove = that.appsController.getAppsToRemove();

                if(appsToProcess) {
                    launchbox.ApplicationManager.installApplications(appsToProcess);
                }

                if(appsToRemove) {
                    for (var currentApp in appsToRemove) {
                        var url = appsToRemove[currentApp];
                        launchbox.ApplicationManager.stopApplication(url);
                        that.appsController.appsUI.removeApplication(url);
                    }
                    launchbox.ApplicationManager.removeApplications(appsToRemove);
                }
            }

        },
        onApplicationChanged: function(application, progress, error) {}
    };

    launchbox.ApplicationManager.addApplicationManagerListener(tempCallback);
};

/**
 * Starts procedure of applications installation.
 * @method doInstallApps
 */
HC$MultiApp.Controller.prototype.doInstallApps = function(isNetworkUnavailable) {
    if(!isNetworkUnavailable) {
        for(var url in this.appsController.psApps) {
            var currentApp = this.appsController.psApps[url];
            this.appsController.appsUI.addApplication(url, currentApp.name, currentApp.version, currentApp.icon);
            this.appsController.appsUI.publishProgress(url, 0);
        }
    }

    var firstInstallationInitialized = false;
    var that = this;
    launchbox.ApplicationManager.addApplicationManagerListener({
        onListChanged: function(applications) {
            if(!firstInstallationInitialized) {
                firstInstallationInitialized = true;
                that.appsController.setAppsFromApplicationsManager(applications, false, isNetworkUnavailable);

                if((that.appsController.numberToInstall === 0) &&  (that.appsController.numberToRemove === 0)) {
                    window.setTimeout(function() {
                        that.onApplicationsReady();
                    }, 0);
                    return;
                }

                var appsToProcess = that.appsController.getappsToProcess();
                var appsToRemove = that.appsController.getAppsToRemove();
                var appsToReinstall = that.appsController.getAppsToReinstall();

                if(appsToReinstall) {
                    for (var currentApp in appsToReinstall) {
                        launchbox.ApplicationManager.reinstallApplication(appsToReinstall[currentApp]);
                    }
                }

                if(appsToProcess) {
                    launchbox.ApplicationManager.installApplications(appsToProcess);
                }

                if(appsToRemove) {
                    launchbox.ApplicationManager.removeApplications(appsToRemove);
                    removing = true;
                }
            } else {
                //some applications have been removed but there're no apps to install, so we're ready to move on
                if(that.appsController.getappsToProcess() === null && that.appsController.numberToRemove) {
                    window.setTimeout(function() {
                        that.onApplicationsReady();
                    }, 0);
                }
            }
            that.appsController.amApps = applications;
        },
        onApplicationChanged: function(application, progress, error) {
            var appCopy = that.appsController.apps[application.url];

            var oldState;
            if (appCopy) {
                oldState = appCopy.state;
                appCopy.state = application.state;
            } else {
                if (application.state === "ready") {
                    console.log("HC$: Changing state of removed application, assuming application has been uninstalled.");
                    return;
                } else {
                    that.appsController.apps[application.url] = application;
                }
            }

            if (application.state === "installing" && progress !== undefined) {
                progress *= 100;
                that.appsController.appsUI.publishProgress(application.url, progress);
            // So far we don't have information whether state ready relates to installation or update process. So
            // we have 'onApplicationReady' for both processes. Another idea is to store this information in webapp
            } else if(application.state === "ready" && oldState !== "started") {
                //increment number of installed apps
                that.appsController.numberToInstall--;
                //update progress
                that.appsController.appsUI.publishProgress(application.url, 100);
                //add app
                that.appsController.addApp(application.url, application);
                if(that.appsController.numberToInstall <= 0){
                    window.setTimeout(function() {
                        that.onApplicationsReady(that.appsController.failed);
                    }, 0);
                }
            } else if(application.state === "updating") {
                that.onApplicationUpdatingProgress(application, progress);
            } else if(application.state === "starting") {
                that.appsController.appsUI.changeStatus(application.url, "starting");
            } else if(application.state === "started") {
                that.appsController.appsUI.changeStatus(application.url, "started");
            } else if(application.state === "failed") {
                that.appsController.failed++;
                that.appsController.numberToInstall--;

                //add app
                that.appsController.addApp(application.url, application, true);

                //if all apps have been installed, let's finish installation process
                if(that.appsController.numberToInstall <= 0){
                    window.setTimeout(function() {
                        that.onApplicationsReady(that.appsController.failed);
                    }, 0);
                }
            }
        }
    });
};

/**
 * Retrieves proper information from AccountManager.
 * @method doAccountsCheck
 */
HC$MultiApp.Controller.prototype.doAccountsCheck = function() {
    console.log("HC$MultiApp: Getting accounts.");
    var that = this;
    window.launchbox.AccountManager.getAccountList({
        onSuccess: function(accounts) {
            if(Object.keys(accounts).length !== 0) {
                var usernames = [];
                for(var username in accounts) {
                    usernames.push(username);
                }

                HC$MultiApp.settingsInfo.setAccounts(usernames, window.launchbox.AccountManager.identifier);
                HC$MultiApp.settingsInfo.registerRemoveAction(function(username) {
                    window.launchbox.AccountManager.removeAccount(username, {
                        onSuccess: function(identifier) {
                            that.onAccountRemoved(identifier);
                        },
                        onFailure: function(error) {
                            alert(that._getErrorMessage("account-manager", error));
                        }
                    });
                });
            }
        },
        onFailure: function(error) {
            console.log("HC$MultiApp: Fatal: could not retrieve accounts: " + error.description);
            alert(that._getErrorMessage("account-manager", error));
            launchbox.Container.shutdown();
        }
    });
};

/**
 * Retrieves proper information from AccountManager.
 * @method doAccountsCheck
 */
HC$MultiApp.Controller.prototype.doSignOut = function() {
    console.log("HC$MultiApp: Start signing out...");
    var that = this;
    window.launchbox.AccountManager.closeAccount({
        onSuccess: function(accounts) {
            that.onSignedOut();
        },
        onFailure: function(error) {
            console.log("HC$MultiApp: Fatal: could not sign out: " + error.description);
            that.onSignOutError();
        }
    });
};


/*-----------------------------------------------------------------*/
/* Callback methods */
/* Callback methods are called from steps methods and are used to  */
/* introduce changes in the UI. No logic should be here.           */
/*-----------------------------------------------------------------*/

/**
 * Fired when user has been signed-out.
 * @method onSignedOut
 */
HC$MultiApp.Controller.prototype.onSignedOut = function(username) {
    console.log("HC$MultiApp: Going back to login screen...");
    window.location.href = "./coreapp.html";
};

/**
 * Fired when an error occur while signing-out.
 * @method onSignOutError
 */
HC$MultiApp.Controller.prototype.onSignOutError = function(error) {
    console.log("HC$MultiApp: Error while signing out: " + error.description + ", error code: " + error.code);
    alert("An error occur while signing out: " + error.description);
};

/**
 * Fired when account has been removed.
 * @method onAccountRemoved
 */
HC$MultiApp.Controller.prototype.onAccountRemoved = function(username) {
    //update ui
    HC$MultiApp.settingsInfo.removeAccount(username);
};

/**
 * Fired when profile update has started.
 * @method onProfileUpdateStarted
 */
HC$MultiApp.Controller.prototype.onProfileUpdateStarted = function() {
    console.log("HC$MultiApp: Profile update started...");
    this._publishProgress(0);
};

/**
 * Fired when profile update has started.
 * @method onProfileUpdateStarted
 */
HC$MultiApp.Controller.prototype.onProfileUpdateProgress = function(progress) {
    console.log("HC$MultiApp: Profile update progress: "+progress+"%");
    this._publishProgress(progress);
};

/**
 * Fired when profile update has started.
 * @method onProfileUpdateStarted
 */
HC$MultiApp.Controller.prototype.onProfileUpdateSucceeded = function(askedForUpdate, isNetworkUnavailable) {
    console.log("HC$MultiApp: Profile update finished.");
    this._publishProgress(1);
    HC$MultiApp.Controller.prototype._switchScreen("loadingScreen", "homeScreen");
    if(!askedForUpdate) {
        this.doInstallApps(isNetworkUnavailable);
    }
};

/**
 * Fired when profile update has started.
 * @method onProfileUpdateStarted
 */
HC$MultiApp.Controller.prototype.onProfileUpdateFailed = function(error) {
    console.log("HC$MultiApp: Profile update failed, reason " + error.code + ": " + error.description);
    alert(this._getErrorMessage("profile-service", error));
    var that = this;
    launchbox.AccountManager.closeAccount({
        onSuccess: function(accounts) {
            window.location.href = "./coreapp.html";
        },
        onFailure: function(error) {
            console.log("HC$MultiApp: Fatal: could not sign out: " + error.description);
            alert(that._getErrorMessage("account-manager", error));
            launchbox.Container.shutdown();
        }
    });
};

/**
 * Fired when applications are installed and ready to fire.
 * @method onApplicationsReady
 */
HC$MultiApp.Controller.prototype.onApplicationsReady = function(failedNumber) {
    var that = this;
    that.appsController.failed = 0;
    this.appsController.appsUI.setEventListener("AppList:infoButtonClicked", function(evt) {
        that.appsController.onShowApplicationDetails(evt.appUrl);
        that._switchScreen("homeScreen", "appDetailsScreen");
    });

    this.appsController.appsUI.setEventListener("AppList:elementClicked", function(evt) {
        if(that.appsController.apps[evt.appUrl].state === "failed") {
            that.appsController.appsUI.changeStatus(evt.appUrl, "installing");
            launchbox.ApplicationManager.reinstallApplication(evt.appUrl);
        } else {
            that.appsController.setCurrentApp(evt.appUrl);
            launchbox.NativeAppSwitcher.show();
            launchbox.ApplicationManager.startApplication(evt.appUrl);
            window.setTimeout(function() {
                that._switchScreen('homeScreen', 'switcherScreen');
                that.appsController.appsUI.reorganizeAppSwitcherList(evt.appUrl);
            }, 10);
        }
    });

    this.appsController.appsUI.setEventListener("AppList:removeButtonclicked", function(evt) {
        launchbox.ApplicationManager.stopApplication(that.appsController.currentDetailsAppUrl);
        launchbox.ApplicationManager.removeApplications([that.appsController.currentDetailsAppUrl]);
        that.appsController.onAppRemoved(that.appsController.currentDetailsAppUrl);
        that._switchScreen('appDetailsScreen', 'homeScreen');
    });

    this.appsController.appsUI.setClickable(true);
    subtitle = '<span id="_yourApps">' + _("yourApps") + '</span>';
    subtitle += '<div class="separator-line"></div>';
    document.getElementById("appListHeader").innerHTML = subtitle;
    this.appsController.onAppsInstalled(failedNumber);
};

/**
 * Starts app which has been launched previously. It is used bt 'Go back' button on SwitcherScreen
 * @method starPreviousApp
 */
HC$MultiApp.Controller.prototype.starPreviousApp = function() {
    this.appsController.appsUI._dispatchAppListEvent("AppList:elementClicked", this.appsController.getCurrentApp());
};

/* ------------------------*/
/* Private utility methods */
/* ------------------------*/

HC$MultiApp.Controller.prototype._switchScreen = function(from, to) {
    switch(to) {
        case "homeScreen":
            if (from === "loadingScreen") {
                HC$MultiApp.screensContainer.switchScreen('homeScreen', 'pos-right');
            } else {
                HC$MultiApp.screensContainer.switchScreen('homeScreen', 'pos-left');
            }
            HC$MultiApp.headerButtons.buttonGoBackHome.hide();
            HC$MultiApp.headerButtons.buttonGoBackAppVersion.hide();
            HC$MultiApp.headerButtons.buttonGoBackSettings.hide();
            HC$MultiApp.headerButtons.buttonGoBackSwitcher.hide();
            HC$MultiApp.headerButtons.buttonSignOut.show();
            HC$MultiApp.settingsButton.show();
            break;
        case "appDetailsScreen":
            HC$MultiApp.screensContainer.switchScreen('appDetailsScreen', 'pos-right');
            HC$MultiApp.headerButtons.buttonGoBackHome.hide();
            HC$MultiApp.headerButtons.buttonGoBackAppVersion.show();
            HC$MultiApp.headerButtons.buttonGoBackSettings.hide();
            HC$MultiApp.headerButtons.buttonGoBackSwitcher.hide();
            HC$MultiApp.headerButtons.buttonSignOut.hide();
            HC$MultiApp.settingsButton.hide();
            break;
        case "settingsScreen":
            HC$MultiApp.screensContainer.switchScreen('settingsScreen', 'pos-right');
            HC$MultiApp.headerButtons.buttonGoBackHome.hide();
            HC$MultiApp.headerButtons.buttonGoBackAppVersion.hide();
            HC$MultiApp.headerButtons.buttonGoBackSettings.show();
            HC$MultiApp.headerButtons.buttonGoBackSwitcher.hide();
            HC$MultiApp.headerButtons.buttonSignOut.hide();
            HC$MultiApp.settingsButton.hide();
            break;
        case "switcherScreen":
            HC$MultiApp.screensContainer.switchScreen('switcherScreen', 'pos-right');
            HC$MultiApp.headerButtons.buttonGoBackHome.hide();
            HC$MultiApp.headerButtons.buttonGoBackAppVersion.hide();
            HC$MultiApp.headerButtons.buttonGoBackSettings.hide();
            HC$MultiApp.headerButtons.buttonGoBackSwitcher.show();
            HC$MultiApp.headerButtons.buttonSignOut.hide();
            HC$MultiApp.settingsButton.hide();
            break;
    }
};

HC$MultiApp.Controller.prototype._publishProgress = function(progress) {
    HC$MultiApp.loadingProgressBar.publishProgress(progress * 100);
};

HC$MultiApp.Controller.prototype._setLoadingMessage = function(message) {
    document.getElementById("loadingMessage").innerHTML = message;
};


/* -------------------------------------------------------------------------------------------------------------------*/
/* Apps controller */
/* -------------------------------------------------------------------------------------------------------------------*/


/**
 * Apps controller responsible for maintaining apps list and corresponding UI objects.
 * @type {Object}
 * @param {Map} map containing applications retrieved from ProfileService.
 */
HC$MultiApp.AppsController = function(applications) {
    this.appsUI = new HC$UI.AppList("appList", true, "appListSwitcher");
    this.appDetailsScreen = document.getElementById("appDetailsScreen");
    this.currentDetailsAppUrl = "";
    this.currentApp = "";

    this.psApps = applications; //applications from Profile Service
    this.amApps = null; //applications from Application Manager
    this.appsToProcess = [];
    this.appsToRemove = [];
    this.appsToReinstall = [];
    this.numberToInstall = 0;
    this.numberToRemove = 0;

    this.installed = 0;
    this.failed = 0;

    this.apps = []; //main object containing all information about displayed apps
};

/**
 * Updates apps controller.
 * @method temporaryUpdate
 * @param {Object} applications list.
 */
HC$MultiApp.AppsController.prototype.temporaryUpdate = function(applications) {
    this.tempPsApps = applications;
};

/**
 * Updates apps controller.
 * @method refresh
 */
HC$MultiApp.AppsController.prototype.refresh = function() {
    this.currentDetailsAppUrl = "";
    this.currentApp = "";

    this.psApps = this.tempPsApps;
    this.appsToProcess = [];
    this.appsToRemove = [];
    this.appsToReinstall = [];
    this.numberToInstall = 0;
    this.numberToRemove = 0;

    this.installed = 0;
    this.failed = 0;

    this.apps = []; //main object containing all information about displayed apps
};

/**
 * Add application to the main applications list.
 * @method addApp
 * @param {String} application url
 * @param {Object} application to add.
 */
HC$MultiApp.AppsController.prototype.addApp = function(appUrl, application, hasFailed) {
    //change status in UI control
    if(hasFailed) {
        this.appsUI.changeStatus(appUrl, "installationFailed");
    } else {
        this.appsUI.changeStatus(appUrl, "installed");
        this.appsUI.hideProgressBar(appUrl);
    }

    //now we have version and icon provided from webapp-descriptor, so we need to set it
    if(!hasFailed || (hasFailed && application.name)) {
        var appVersion = application.displayVersion || application.version;
        this.appsUI.setApplicationInfo(appUrl, appVersion, application.icon, application.largeIcon, application.name);
    }

    //if there's no icon provided by webapp, icon from ProfileService should be used
    if(!application.icon && this.psApps && this.psApps[appUrl] && this.psApps[appUrl].icon) {
        application.icon = this.psApps[appUrl].icon;
    }

    //add app to app switcher
    this.appsUI.addtoAppSwitcher(appUrl);

    //store installed application; 'apps' map will contain all applications installed and available for user
    //this map will be used as main source of information about apps
    this.apps[appUrl] = application;
};

/**
 * Determines whether update of applications is necessary.
 * @method isUpdateAvailable
 * @param {Map} map containing applications retrieved from ProfileService.
 */
HC$MultiApp.AppsController.prototype.isUpdateAvailable = function(applications) {
    for (var appUrl in this.tempPsApps) {
        var currentApp = applications[appUrl];
        if(currentApp === undefined || currentApp.state === "installing") {
            this.appsToProcess[appUrl] = this.tempPsApps[appUrl];
            return true;
        }
    }

    for (var appUrl in applications) {
        if(this.tempPsApps[appUrl] === undefined && applications[appUrl].id !== launchbox.ApplicationManager.self.id) {
            this.appsToRemove[appUrl] = applications[appUrl];
            return true;
        }
    }

    return false;
};

/**
 * Determines which applications should be install/uninstall based on application lists from ProfileService and ApplicationsManager.
 * @method setAppsFromApplicationsManager
 * @param {Map} map containing applications retrieved from ProfileService.
 * @param {boolean} determines whether request comes from automatic update mechanism.
 * @param {boolean} determines whether network is available.
 */
HC$MultiApp.AppsController.prototype.setAppsFromApplicationsManager = function(applications, askedForUpdate, isNetworkUnavailable) {
    if(isNetworkUnavailable && !askedForUpdate) {
        for (var appUrl in applications) {
            var currentApp = applications[appUrl];
            if(currentApp.id !== launchbox.ApplicationManager.self.id) {
                this.appsUI.addApplication(appUrl, currentApp.name, currentApp.version, currentApp.icon);
                this.appsUI.publishProgress(appUrl, 0);
                this.addApp(appUrl, currentApp);
            }
        }
    } else {
        for (var appUrl in this.psApps) {
            var currentApp = applications[appUrl];

            if(currentApp === undefined) {
                this.appsToProcess[appUrl] = this.psApps[appUrl];
                this.numberToInstall++;
            } else if(currentApp && currentApp.state === "failed") {
                if(!askedForUpdate) {
                    this.appsToReinstall[appUrl] = this.psApps[appUrl];
                    this.numberToInstall++;
                } else {
                    this.addApp(appUrl, currentApp, true);
                }
            } else {
               this.addApp(appUrl, currentApp);
            }
        }

        for (var appUrl in applications) {
            if(this.psApps[appUrl] === undefined && applications[appUrl].id !== launchbox.ApplicationManager.self.id) {
                this.appsToRemove[appUrl] = applications[appUrl];
                this.numberToRemove++;
            }
        }
    }
};

/**
 * Returns an array with applications to install if exist, null otherwise.
 * @method getappsToProcess
 */
HC$MultiApp.AppsController.prototype.getappsToProcess = function() {
    if(Object.keys(this.appsToProcess).length === 0) {
        return null;
    }

    var apps = [];
    for (var appUrl in this.appsToProcess) {
        var currentApp = this.appsToProcess[appUrl];
        apps.push({url: appUrl, name: currentApp.name, description: currentApp.description, icon: currentApp.icon});
    }
    return apps;
};

/**
 * Returns an array with applications to reinstall if exist, null otherwise.
 * @method getAppsToReinstall
 */
HC$MultiApp.AppsController.prototype.getAppsToReinstall = function() {
    if(Object.keys(this.appsToReinstall).length === 0) {
        return null;
    }

    var apps = [];
    for (var appUrl in this.appsToReinstall) {
        apps.push(appUrl);
    }
    return apps;
};

/**
 * Returns an array with applications to remove if exist, null otherwise.
 * @method getappsToProcess
 */
HC$MultiApp.AppsController.prototype.getAppsToRemove = function() {
    if(Object.keys(this.appsToRemove).length === 0) {
        return null;
    }

    var apps = [];
    for (var appUrl in this.appsToRemove) {
        apps.push(appUrl);
    }
    return apps;
};

/**
 * Fired when all apps have been installed.
 * @method onAppsInstalled
 */
HC$MultiApp.AppsController.prototype.onAppsInstalled = function(failedNumber) {
    for(var url in this.apps) {
        if (this.apps[url].state === 'failed' || this.apps[url].state === 'ready') {
            this.appsUI.changeStatus(url, this.apps[url].state);
        }
    }

    if(failedNumber) {
    	if(failedNumber === 1) {
       		alert(failedNumber + " application failed to install.");
    	} else {
       		alert(failedNumber + " applications failed to install.");
    	}
    }
};

/**
 * Fired when app has been removed using 'Uninstall' button.
 * @method onAppRemoved
 */
HC$MultiApp.AppsController.prototype.onAppRemoved = function(appUrl) {
    this.appsUI.removeApplication(appUrl);
    delete this.apps[appUrl];
};

/**
 * Fired when application details screen is going to be presented on the screen
 * @method onShowApplicationDetails
 */
HC$MultiApp.AppsController.prototype.onShowApplicationDetails = function(appUrl) {
    this.currentDetailsAppUrl = appUrl;
    var app = this.apps[appUrl];
    var hasFailed = false;
    if(app.state === "failed") {
        app = this.psApps[appUrl];
        hasFailed = true;
    }
    this.appsUI.updateAppDetailsScreen(app, hasFailed);
};

/**
 * Saves just launched app.
 * @method setCurrentApp
 */
HC$MultiApp.AppsController.prototype.setCurrentApp = function(appUrl) {
    this.currentApp = appUrl;
};

/**
 * Returns app which has been launched last time
 * @method getCurrentApp
 */
HC$MultiApp.AppsController.prototype.getCurrentApp = function() {
    return this.currentApp;
};

HC$MultiApp.Controller.prototype._getErrorMessage = function(service, error) {
    switch(service) {
        case "profile-service":
            switch(error.code) {
                case launchbox.ProfileServiceClient.INTERNAL_ERROR:
                    return _("profileServiceError1") + error.description;
                case launchbox.ProfileServiceClient.COMMUNICATION_FAILURE_ERROR:
                    return _("profileServiceError2");
                case launchbox.ProfileServiceClient.ENROLLMENT_IN_PROGRESS_ERROR:
                    return _("profileServiceError3");
                case launchbox.ProfileServiceClient.INVALID_URL_ERROR:
                    return _("profileServiceError4");
                case launchbox.ProfileServiceClient.INVALID_CREDENTIALS_ERROR:
                    return _("profileServiceError5");
            }
            break;
        case "account-manager":
            switch(error.code) {
                case launchbox.AccountManager.INTERNAL_ERROR:
                    return _("accountManagerError1") + error.description;
                case launchbox.v.INVALID_CREDENTIALS_ERROR:
                    return _("accountManagerError2");
                case launchbox.AccountManager.ACCOUNT_OPEN_ERROR:
                    return _("accountManagerError3");
                case launchbox.AccountManager.ACCOUNT_EXISTS_ERROR:
                    return _("accountManagerError4");
                case launchbox.AccountManager.ACCOUNT_DOES_NOT_EXIST_ERROR:
                    return _("accountManagerError5");
                case launchbox.AccountManager.FIELD_DOES_NOT_EXIST_ERROR:
                    return _("accountManagerError6");
                case launchbox.AccountManager.ACCOUNT_NOT_OPEN_ERROR:
                    return _("accountManagerError7");
            }
            break;
        case "application-manager":
            switch(error.code) {
                case launchbox.ApplicationManager.APPLICATION_NOT_FOUND:
                    return _("applicationManagerError1") + error.description;
                case launchbox.ApplicationManager.APPLICATION_NOT_INSTALLED:
                    return _("applicationManagerError2");
                case launchbox.ApplicationManager.INVALID_APPLICATION_URL:
                    return _("applicationManagerError3");
            }
            break;
    }
};

HC$MultiApp.Controller.prototype._startProfileUpdate = function() {
    console.debug("HC$MultiApp: ProfileUpdateCheck - starting profile update.");
    this.doProfileUpdate(true);
    this.askForUpdateTimestamp = Date.now();
}

HC$MultiApp.Controller.prototype._profileUpdateCheck = function() {
    var interval = HC$.config.updateInterval;
    if(interval === undefined || interval === null || interval.constructor !== Number || interval <= 0) {
        // Profile update check is disabled.
        return;
    }
    if(launchbox.Container.networkStatus.type === "none") {
        console.debug("HC$MultiApp: ProfileUpdateCheck - profile update skipped (no network connection).");
        return;
    }
    if((Date.now() - this.askForUpdateTimestamp) < interval) {
        console.debug("HC$MultiApp: ProfileUpdateCheck - profile update skipped (updateInterval not passed yet).");
        return;
    }
    if(!HC$.config.gatewayURL) {
        console.debug("HC$MultiApp: ProfileUpdateCheck - ACF is not configured, safe to start.");
        this._startProfileUpdate();
        return;
    }
    if(launchbox.ACF.connectionStatus() === launchbox.ACF.ConnectionStatus.CONNECTED) {
        console.debug("HC$MultiApp: ProfileUpdateCheck - ACF is connected, safe to start.");
        this._startProfileUpdate();
        return;
    }
    if (this._profileUpdateCheckACFListenerRegistered === true) {
        // Update check listener already registered.
        return;
    }
    console.debug("HC$MultiApp: ProfileUpdateCheck - ACF is not connected, registering ACF listener.");
    var that = this;
    launchbox.ACF.addListener({
        onConnectionStatusChanged: function(status) {
            console.debug("HC$MultiApp: ProfileUpdateCheck - ACF connection status changed to " + status + ".");
            if (status !== launchbox.ACF.ConnectionStatus.CONNECTED) {
                return;
            }
            console.debug("HC$MultiApp: ProfileUpdateCheck - ACF connected, safe to start.");
            launchbox.ACF.removeListener(this);
            that._profileUpdateCheckACFListenerRegistered = false;
            that._startProfileUpdate();
        }
    });
    this._profileUpdateCheckACFListenerRegistered = true;
}

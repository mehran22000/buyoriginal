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

/**
 * Namespace for CoreApp module.
 * @class HC$CoreApp
 * @constructor
 */
var HC$CoreApp = function() {};

/**
 * Stack container containing loginScreen, loadingScreen and oldPasswordScreen.
 * @property screensContainer
 * @type {HC$UI.StackContainer}
 * @static
 */
HC$CoreApp.screensContainer = undefined;

/**
 * Progress bar placed on the loading screen.
 * @property loadingProgressBar
 * @type {HC$UI.ProgressBar}
 * @static
 */
HC$CoreApp.loadingProgressBar = undefined;

/**
 * Field for singleton controller.
 * @property _controller
 * @type {HC$CoreApp.Controller}
 * @private
 * @static
 */
HC$CoreApp.controller = undefined;

//Go back to login screen button
HC$CoreApp.buttonGoBackSettings = new HC$UI.Hidable("buttonGoBackSettings");

//Settings button
HC$CoreApp.settingsButton = new HC$UI.Hidable("settings-button");

//Main logo element
HC$CoreApp.mainLogo = new HC$UI.Hidable("mainlogo");

//Header
HC$CoreApp.singleappHeader = new HC$UI.Hidable("singleappHeader");

/**
 * Setting proper CSS for Retina devices.
 */
HC$UI.setRetinaCSS();

/**
 * Setting meta attribute for iOS7.
 */
HC$UI.setiOSMeta();

/**
 * Initialization method for HC$CoreApp.
 * @method onload
 * @static
 */
HC$CoreApp.onload = function() {

    // Init internationalization.
    HC$I18N.init();

    // Create CoreApp controller.
    HC$CoreApp.controller = new HC$CoreApp.Controller();

    // Initialize screens container, add all screens.
    HC$CoreApp.screensContainer = new HC$UI.StackContainer("content");
    HC$CoreApp.screensContainer.addScreen(new HC$UI.Screen("startingScreen"), true);
    HC$CoreApp.screensContainer.addScreen(new HC$UI.Screen("loginScreen"), false, true);
    HC$CoreApp.screensContainer.addScreen(new HC$UI.Screen("loadingScreen"));
    HC$CoreApp.screensContainer.addScreen(new HC$UI.Screen("oldPasswordScreen"));
    HC$CoreApp.screensContainer.addScreen(new HC$UI.Screen("settingsScreen"));

    // Sets current screen
    HC$CoreApp.controller._setCurrentScreen("startingScreen");

    // Initialize loading ProgressBar object.
    HC$CoreApp.loadingProgressBar = new HC$UI.ProgressBar("loadingProgressBar");

    // Initialize userlist combobox.
    HC$CoreApp.userlistCombobox = new HC$UI.Combobox("combobox", HC$CoreApp.screensContainer);

    // Initialize settings UI control.
    HC$CoreApp.settingsInfo = new HC$UI.SettingsInfo("settingsList");

    // Validate and prepare configuration.
    HC$.config = HC$CoreApp.parseConfig(HC$.config);
    
    // Interpret configuration and prepare methods queue.
    HC$CoreApp.controller.prepareSteps(HC$.config);

    // After API is ready, start the controller.
    window.onLaunchboxLoaded = function() {
        HC$CoreApp.controller.doStart();
    };
};

HC$CoreApp.parseConfig = function(config) {
    // Make sure application URL is trimmed.
    if (config.applicationURL) {
        config.applicationURL = config.applicationURL.trim();
    }
    if (config.localURL) {
        config.localURL = config.localURL.trim();
    }
    return config;
}


/* -------------------------------------------------------------------------------------------------------------------*/
/* Controller */
/* -------------------------------------------------------------------------------------------------------------------*/


/**
 * Controller class. The instance is stored as the HC$CoreApp.controller and created during HC$CoreApp.onload.
 * @class HC$CoreApp.Controller
 * @constructor
 */
HC$CoreApp.Controller = function() {
    this._stepsController = new HC$CoreApp.Controller.StepsController();

    //Fallback for now() method
    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    this.askForUpdateTimestamp = Date.now();
};

// Contains an instance of web application class in 'singleapp' mode.
HC$CoreApp.Controller.singleWebApplication = undefined;

/*-----------------------------*/
/* Populating steps controller */
/*-----------------------------*/

/**
 * Depending on the configuration, prepares steps that will be invoked with the specified order. This can be:
 * <ul>
 * <li>For multiapp profile-based: enroll to the Profile Service, load multiapp module</li>
 * <li>For singleapp profile-based: enroll, load application from updated profile</li>
 * <li>For singleapp prepackaged: optionally enroll, load application from prepackaged resources</li>
 * <li>For singleapp: optionally enroll, load application from URL</li>
 * </ul>
 * Additionally AccountManager authentication is always required.
 * @method prepareSteps
 * @param {String} config Configuration object.
 */
HC$CoreApp.Controller.prototype.prepareSteps = function(config) {
    console.log("HC$CoreApp: Following steps will be invoked in order to run the application:");
    this.isProfileServiceMode = config.profileService && config.profileService.url && config.profileService.url !== '';

    if (config.mode == "multiapp") {
        // For multiapp mode, enrollment is obligatory and we should load multiapp module after enrollment.
        console.log("HC$CoreApp: - Profile Service enrollment");
        console.log("HC$CoreApp: - Store enrolled user");
        console.log("HC$CoreApp: - Authenticate to the AccountManager");
        console.log("HC$CoreApp: - Load MultiApp module");

        this._stepsController.addSteps([this.doEnroll, this.doStoreUser, this.doAccountManagerAuthenticate, this.doInitACF, this.doLoadMultiapp]);
    } else {
        if(!config.showLoginScreen) {
            // In case of singleapp mode and lack of profile service, some credentials must be provided to authenticate to AccountManager
            // Credentials will be taken from config so far, but this should be reconsidered in the future
            console.log("HC$CoreApp: - Set default credentials");
            this._stepsController.addStep(this.doSetSingleappDefaultCredentials);
        }

        if (this.isProfileServiceMode) {
            // Enroll
            console.log("HC$CoreApp: - Profile Service enrollment");
            this._stepsController.addStep(this.doEnroll);
        }

        // Storing user.
        console.log("HC$CoreApp: - Store user");
        // Authentication to the AccountManager is always required.
        console.log("HC$CoreApp: - Authenticate to the AccountManager");
        this._stepsController.addSteps([this.doStoreUser, this.doAccountManagerAuthenticate]);

        if (this.isProfileServiceMode && !config.applicationURL) {
            // Update profile, if we are in multiapp or singleapp profile-based.
            console.log("HC$CoreApp: - Profile Service update");
            this._stepsController.addStep(this.doProfileUpdate);
        }

        // Depending on whether we are in singleapp, singleapp prepackaged or single app profile-based, assign different load methods.
        if (config.applicationURL === undefined) {
            console.log("HC$CoreApp: - Load SingleApp from profile");
            this._stepsController.addStep(this.doLoadSingleappFromProfile);
        } else if (config.applicationURL.indexOf("prepackaged://") === 0) {
            console.log("HC$CoreApp: - Load SingleApp from prepackaged resources");
            this._stepsController.addStep(this.doLoadSingleappPrepackaged);
        } else {
            console.log("HC$CoreApp: - Load SingleApp from URL");
            this._stepsController.addStep(this.doLoadSingleapp);
        }
    }
};

/*--------------------*/
/* Controller methods */
/*--------------------*/

/* Those methods can be used stand-alone or invoked from the steps queue. */

/**
 * Fired after all initialization has completed. Triggers entire flow.
 * @method doStart
 */
HC$CoreApp.Controller.prototype.doStart = function() {
    console.log("HC$CoreApp: Starting CoreApp Controller.");

    //setting account manager callback
    launchbox.AccountManager.accountManagerListener = {
        onOpen: function() {},
        onClose: function() {}
    };

    //setting info on settings screen
    if(HC$.config.showLoginScreen) {
        var bootstrapApp = launchbox.ApplicationManager.self;
        var psUrl = "Profile service url not configured";
        if(this.isProfileServiceMode) {
            psUrl = HC$.config.profileService.url;
        }
        var versionString = launchbox.Container.version + "; bootstrap ver. " + bootstrapApp.version;
        HC$CoreApp.settingsInfo.setContainerInfo(bootstrapApp.name, versionString, launchbox.Container.deviceId, psUrl, bootstrapApp.description, launchbox.Container.phoneNumber);
    }

    if (HC$.config.showLoginScreen !== false) {
        this.doAccountsCheck();
    } else {
        this.doStartScreensFlow();
    }

    //setting lifecycle listener
    if (this.isProfileServiceMode && !HC$.config.applicationURL) {
        var that = this;
        launchbox.Container.addLifecycleListener({
            onPause: function() {},
            onResume: function() {
                that._profileUpdateCheck();
            },
            onHide: function() {},
            onShow: function() {}
        });
    }
};

/**
 * Retrieves proper information from AccountManager.
 * @method doAccountsCheck
 */
HC$CoreApp.Controller.prototype.doAccountsCheck = function() {
    console.log("HC$CoreApp: Checking accounts.");

    var that = this;
    window.launchbox.AccountManager.getAccountList({
        onSuccess: function(accounts) {

            if(Object.keys(accounts).length !== 0) {
                var usernames = [];
                for(var username in accounts) {
                    usernames.push(username);
                }

                that.usernames = usernames;

                //accounts exists - fill combobox UI control
                HC$CoreApp.userlistCombobox.setSimpleMode(false);
                HC$CoreApp.userlistCombobox.setUsernames(usernames);
            }

            that.doStartScreensFlow();
        },
        onFailure: function(error) {
            console.log("HC$CoreApp: Fatal: could not retrieve accounts: " + error.description);
            alert(that._getErrorMessage("account-manager", error));
            launchbox.Container.shutdown();
        }
    });
};

/**
 * Starts screen flow. Called after all necessary information from AccountManager have been retrieved. Reads configuration data and initiates
 * all work, that is switches to the login screen (if enabled) or switches to the loading screen
 * and invokes steps from the steps queue.
 * @method doStartScreensFlow
 */
HC$CoreApp.Controller.prototype.doStartScreensFlow = function() {
    console.log("HC$CoreApp: Starting screens flow.");

    if (HC$.config.showLoginScreen !== false) {
        // Go to the login screen.
        this.onReady(true);
    } else {
        // Go to the loading screen.
        this.onReady(false);
        // We are ready to start loading.
        this._stepsController.startSteps();
    }
    window.launchbox.SplashScreen.hide();
};

/**
 * Reads username and password from the UI and performs sign in operation.
 * @method doSignIn
 */
HC$CoreApp.Controller.prototype.doSignIn = function() {
    console.log("HC$CoreApp: Invoking sign in...");
    // Set credentials on DefaultCredentials.
    var credentials = this._getCredentialsFromScreen();
    if (credentials.username === "" || credentials.password === "") {
        this.onLoginFailed({description: "Username or password empty."});
        return;
    }
    window.DefaultCredentials = window.DefaultCredentials || {};
    window.DefaultCredentials.username = credentials.username;
    window.DefaultCredentials.password = credentials.password;

    // We are ready to start steps.
    this._stepsController.startSteps();
};

/**
 * Sets user credentials for singleapp (not profile based) - some dummy credentials are necessary to open AccountManager.
 * Dummy credentials are taken from configuration file
 * @method doSignIn
 */
HC$CoreApp.Controller.prototype.doSetSingleappDefaultCredentials = function() {
    console.log("HC$CoreApp: Setting default user credentials...");
    window.DefaultCredentials = window.DefaultCredentials || {};
    window.DefaultCredentials.username = HC$.config.defaultUsername;
    window.DefaultCredentials.password = HC$.config.defaultPassword;

    this._stepsController.nextStep();
};

/**
 * Invokes enrollment to the Profile Service.
 * @method doEnroll
 */
HC$CoreApp.Controller.prototype.doEnroll = function() {
    console.log("HC$CoreApp: Invoked doEnroll...");
    if (this.isProfileServiceMode) {
        this.onEnrollmentStarted();
        var that = this;
        launchbox.ProfileServiceClient.enrollmentURL = HC$.config.profileService.url;
        launchbox.ProfileServiceClient.username = DefaultCredentials.username;
        launchbox.ProfileServiceClient.password = DefaultCredentials.password;
        launchbox.ProfileServiceClient.enroll({
            onProgress: function(progress) {
                that.onEnrollmentProgress(progress);
            },
            onFailure:  function(error) {
                if(error.code === launchbox.ProfileServiceClient.COMMUNICATION_FAILURE_ERROR) {
                    if(!that._isAccountExists(DefaultCredentials.username)) {
                        that.onEnrollmentFailed(error);
                    } else {
                        that._stepsController.nextStep();
                    }
                } else {
                    that.onEnrollmentFailed(error);
                }
            },
            onSuccess: function() {
                that.onEnrollmentFinished();
                that._stepsController.nextStep();
            }
        });
    }
};

/**
 * Performs profile update and checks whether an update is necessary.
 * @method doProfileUpdate
 */
HC$CoreApp.Controller.prototype.doAskForUpdate = function() {
    console.log("HC$CoreApp: Profile update started...");
    if(launchbox.Container.networkStatus.type === "none") {
        return;
    }
    var that = this;
    launchbox.ProfileServiceClient.enrollmentURL = HC$.config.profileService.url;
    this.onProfileUpdateStarted();
    launchbox.ProfileServiceClient.updateProfile({
        onProgress: function(progress) {},
        onFailure:  function(error) {},
        onSuccess:  function(applications) {
            var applicationURL = that._getApplicationURLFromProfile(applications, HC$.config.profileService.applicationURLFilter);
            if(applicationURL !== undefined) {
                if(applicationURL !== that.installedAppUrl) {
                    var updateConfirmed = confirm("Your application needs to be updated.\n Would you like to reinstall it now?");
                    if(updateConfirmed) {
                        //stop and uninstall old app
                        launchbox.ApplicationManager.stopApplication(that.installedAppUrl);
                        launchbox.ApplicationManager.removeApplications([that.installedAppUrl]);
                        that.doLoadSingleappFromProfile(applicationURL);
                    }
                }
            }
        }
    });
};

/**
 * Performs profile update.
 * @method doProfileUpdate
 */
HC$CoreApp.Controller.prototype.doProfileUpdate = function() {
    console.log("HC$CoreApp: Profile update started...");
    if(launchbox.Container.networkStatus.type === "none") {
        this._stepsController.nextStep();
        return;
    }
    var that = this;
    this.onProfileUpdateStarted();
    launchbox.ProfileServiceClient.updateProfile({
        onProgress: function(progress) {
            that.onProfileUpdateProgress(progress);
        },
        onFailure:  function(error) {
            that.onProfileUpdateFailed(error);
        },
        onSuccess:  function(applications) {
            that.applicationsList = applications;
            that.onProfileUpdateSucceeded();
            that._stepsController.nextStep();
        }
    });
};

/**
 * Invokes adding user to AccountManager module.
 * @method doStoreUser
 */
HC$CoreApp.Controller.prototype.doStoreUser = function() {
    console.log("HC$CoreApp: Invoked doStoreUser...");
    var that = this;
    window.launchbox.AccountManager.addAccount(
        window.DefaultCredentials.username,
        window.DefaultCredentials.password,
        {
            onSuccess: function() {
                that._stepsController.nextStep();
            },
            onFailure: function(error) {
                if (error.code === launchbox.AccountManager.ACCOUNT_EXISTS_ERROR) {
                    that._stepsController.nextStep();
                } else {
                    alert("Fatal: " + that._getErrorMessage("account-manager", error));
                    if(HC$.config.showLoginScreen) {
                        that._switchScreen("loadingScreen", "loginScreen");
                    } else {
                        launchbox.Container.shutdown();
                    }
                }
            }
        }
    );
};

/**
 * Invokes authentication to the AccountManager module.
 * @method doAccountManagerAuthenticate
 */
HC$CoreApp.Controller.prototype.doAccountManagerAuthenticate = function() {
    console.log("HC$CoreApp: Invoked doAccountManagerAuthenticate...");
    this.onAccountManagerAuthenticationStarted();
    var that = this;
    launchbox.AccountManager.openAccount(
        window.DefaultCredentials.username,
        window.DefaultCredentials.password,
        {
            onSuccess: function() {
                if (!HC$.config.partitioning){
                    var removeCallbacks = {
                        onSuccess: function(identifier) {
                        },
                        onFailure: function(error) {
                        }
                    };
                    for (var user in that.usernames) {
                        var identifier = that.usernames[user];
                        if (identifier != launchbox.AccountManager.identifier) {
                            window.launchbox.AccountManager.removeAccount(identifier, removeCallbacks);
                        }
                    }
                }
                that.onAccountManagerAuthenticationSucceeded();
                that._stepsController.nextStep();
            },
            onFailure: function(error) {
                var configMatches = HC$.config.profileService && HC$.config.profileService.url && HC$.config.profileService.url !== '' && HC$.config.showLoginScreen;
                if (error.code === launchbox.AccountManager.INVALID_CREDENTIALS_ERROR && configMatches && launchbox.Container.networkStatus.type !== "none") {
                    console.log("HC$CoreApp: AccountManager reported invalid credentials: " + error.description+".");
                    that.onAccountManagerAuthenticationRequiresOldPassword();
                } else {
                    console.log("HC$CoreApp: Fatal: could not authenticate to AccountManager: " + error.description);
                    alert("Could not authenticate to AccountManager: " + that._getErrorMessage("account-manager", error));
                    that._switchScreen("loadingScreen", "loginScreen");
                }
            }
        }
    );
};

/**
 * Reencrypts AccountManager using password entered on the Old Password screen.
 * @method doReencryptStorage
 */
HC$CoreApp.Controller.prototype.doReencryptStorage = function() {
    console.log("HC$CoreApp: Invoked doReencryptStorage...");
    var oldPassword = this._getOldPasswordFromScreen();
    var that = this;
    launchbox.AccountManager.changePassword(
        window.DefaultCredentials.username,
        window.DefaultCredentials.password,
        oldPassword, 
        {
            onSuccess: function() {
                that.onAccountManagerAuthenticationSucceeded();
                that.doAccountManagerAuthenticate();
            },
            onFailure: function(error) {
                var configMatches = HC$.config.profileService && HC$.config.profileService.url && HC$.config.profileService.url !== '' && HC$.config.showLoginScreen;
                if (error.code === launchbox.AccountManager.INVALID_CREDENTIALS_ERROR && configMatches && launchbox.Container.networkStatus.type !== "none") {
                    console.log("HC$CoreApp: AccountManager reported invalid credentials: " + error.description+".");
                    alert(that._getErrorMessage("account-manager", error));
                    that.onAccountManagerAuthenticationRequiresOldPassword();
                } else {
                    console.log("HC$CoreApp: Fatal: could not authenticate to AccountManager: " + error.description);
                    alert("Fatal: " + that._getErrorMessage("account-manager", error));
                    if(HC$.config.showLoginScreen) {
                        launchbox.AccountManager.closeAccount({
                            onSuccess: function(accounts) {
                                that._switchScreen("loadingScreen", "loginScreen");
                            },
                            onFailure: function(error) {
                                console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
                                alert(that._getErrorMessage("account-manager", error));
                                launchbox.Container.shutdown();
                            }
                        });
                    } else {
                        launchbox.Container.shutdown();
                    }
                }
            }
        }
    );
};

/**
 * Loads MultiApp module to this WebView.
 * @method doLoadMultiapp
 */
HC$CoreApp.Controller.prototype.doLoadMultiapp = function() {
    console.log("HC$CoreApp: Invoked doLoadMultiapp...");
    window.location.href = "./multiapp.html";
};

/**
 * Initialize ACF configuration.
 * @method doInitACF
 */
HC$CoreApp.Controller.prototype.doInitACF = function(isSingleapp, application) {
    if (HC$.config.gatewayURL) {
        console.log("HC$CoreApp: Initializing ACF...");
        
        if(isSingleapp) {
            var masterConnectionOwner = {
                id: application.id,
                version: application.versionForAcf
            };
            launchbox.ACF.configure({ gatewayURL: HC$.config.gatewayURL, masterConnectionOwner: masterConnectionOwner });
        } else {
            launchbox.ACF.configure({ gatewayURL: HC$.config.gatewayURL });
        }

        launchbox.ACF.setCredentials({
            userId: launchbox.AccountManager.identifier,
            password: launchbox.AccountManager.password,
            deviceId: launchbox.Container.deviceId
        });
    }

    if(!isSingleapp) {
        this._stepsController.nextStep();
    }
};

/**
 * Loads SingleApp from the URL specified in HC$.config.
 * @method doLoadSingleapp
 */
HC$CoreApp.Controller.prototype.doLoadSingleapp = function() {
    var applicationURL = HC$.config.applicationURL;
    var localURL = HC$.config.localURL;
    console.log("HC$CoreApp: Invoked doLoadSingleapp for application "+applicationURL+"...");

    var that = this;
    if (applicationURL !== undefined) {
        
        if (this.applicationManagerListenerAdded &&
            this.applicationManagerListenerCallback !== null &&
            typeof this.applicationManagerListenerCallback === 'object') {
            
            launchbox.ApplicationManager.removeApplicationManagerListener(this.applicationManagerListenerCallback);
            this.applicationManagerListenerAdded=false;
        }
        
        if (!this.applicationManagerListenerAdded) {
            // Save callback object to variable, so we will have possibility
            // to remove it when needed.
            this.applicationManagerListenerCallback = {
                onListChanged: function(applications) {
                    // If application already exists on the list, check for its update (but only when is ready - this prevents
                    // calling update after application installation)
                    // If not, start downloading the application but only when its not already installed
                    var currentApp = applications[applicationURL];
                    if (currentApp !== undefined && currentApp.state === "ready") {
                        that._updateSingleapp(currentApp);
                    } else if(currentApp === undefined) {
                        that._installSingleapp(true, applicationURL, localURL);
                    } else if(currentApp !== undefined && currentApp.state === "failed") {
                        that._reinstallSingleapp(true, applicationURL);
                    }
                },
                onApplicationChanged: function(application, progress, error) {
                    if (application.url !== applicationURL) {
                        // Skip notifications from different apps if any.
                        return;
                    }
                    if(error === undefined) {
                       var oldApplicationState = that.singleWebApplication ? that.singleWebApplication.state : undefined;
                       if(application.state === "installing") {
                           if(progress !== undefined) {
                               that.onApplicationInstallingProgress(application, progress);
                           }
                       // So far we don't have information whether state ready relates to installation or update process. So
                       // we have 'onApplicationReady' for both processes. Another idea is to store this information in webapp
                       } else if(application.state === "ready") {
                           if (oldApplicationState === "started") {
                               launchbox.AccountManager.closeAccount({
                                   onSuccess: function(accounts) {
                                       if(HC$.config.showLoginScreen) {
                                           that._clearCredentialsFromScreen();
                                           that._switchScreen("loadingScreen", "loginScreen");
                                       } else {
                                           launchbox.Container.shutdown();
                                       }
                                   },
                                   onFailure: function(error) {
                                       console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
                                       alert(that._getErrorMessage("account-manager", error));
                                       launchbox.Container.shutdown();
                                   }
                               });
                           } else {
                               that.doInitACF(true, application);
                               that.onApplicationReady();
                               // If we are in the special case of populating the cache from the prepackaged app,
                               // and this was the first launch of the application, check for cache manifest update.
                               if (application.localUrl && oldApplicationState !== "updating") {
                                   that._updateSingleapp(application);
                               } else {
                                   that._startSingleapp(application.url);
                               }
                           }
                       } else if(application.state === "updating") {
                           that.onApplicationUpdatingProgress(application, progress);
                       }
                    } else {
                        that.onApplicationPreparationFailed(application, error);
                    }
                    that.singleWebApplication = application;
                }
            };
            // Attach listener to know about the application state.
            launchbox.ApplicationManager.addApplicationManagerListener(this.applicationManagerListenerCallback);
            this.applicationManagerListenerAdded = true;
        }
        else {
            that._reinstallSingleapp(true, applicationURL);
        }
    } else {
        throw "Application URL cannot be empty in non-profile SingleApp mode.";
    }
};

/**
 * Loads SingleApp from the prepackaged contents.
 * @method doLoadSingleappPrepackaged
 */
HC$CoreApp.Controller.prototype.doLoadSingleappPrepackaged = function() {
    var applicationURL = HC$.config.applicationURL;
    console.log("HC$CoreApp: Invoked doLoadSingleappPrepackaged for application "+applicationURL+"...");

    var that = this;
    if (applicationURL !== undefined) {
        if (!this.applicationManagerListenerAdded) {
            launchbox.ApplicationManager.addApplicationManagerListener({
                onListChanged: function(applications) {
                    // If application already exists on the list, start it (no cache-manifest based updates
                    //   for prepackaged app).
                    // If not, start installing the application.
                    var currentApp = applications[applicationURL];
                    if (currentApp !== undefined && currentApp.state === "ready") {
                        that.doInitACF(true, currentApp);
                        that._startSingleapp(applicationURL);
                    } else if(currentApp === undefined) {
                        that._installSingleapp(true, applicationURL);
                    } else if(currentApp !== undefined && currentApp.state === "failed") {
                        that._reinstallSingleapp(true, applicationURL);
                    }
                },
                onApplicationChanged: function(application, progress, error) {
                    if (application.url !== applicationURL) {
                        // Skip notifications from different apps if any.
                        return;
                    }
                    if(error === undefined) {
                        var oldApplicationState = that.singleWebApplication ? that.singleWebApplication.state : undefined;
                        if(application.state === "installing") {
                            if(progress !== undefined) {
                                that.onApplicationInstallingProgress(application, progress);
                            }
                            // So far we don't have information whether state ready relates to installation or update process. So
                            // we have 'onApplicationReady' for both processes. Another idea is to store this information in webapp
                        } else if(application.state === "ready") {
                            if (oldApplicationState === "started") {
                                launchbox.AccountManager.closeAccount({
                                    onSuccess: function(accounts) {
                                        if(HC$.config.showLoginScreen) {
                                            that._clearCredentialsFromScreen();
                                            that._switchScreen("loadingScreen", "loginScreen");
                                        } else {
                                            launchbox.Container.shutdown();
                                        }
                                    },
                                    onFailure: function(error) {
                                        console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
                                        alert(that._getErrorMessage("account-manager", error));
                                        launchbox.Container.shutdown();
                                    }
                                });
                            } else {
                                that.doInitACF(true, application);
                                that.onApplicationReady();
                                that._startSingleapp(application.url);
                            }
                        }
                    } else {
                        that.onApplicationPreparationFailed(application, error);
                    }
                    that.singleWebApplication = application;
                }
            }); this.applicationManagerListenerAdded = true;
        }
        else {
            that._reinstallSingleapp(true, applicationURL);
        }
    } else {
        throw "Application URL cannot be empty in non-profile SingleApp mode.";
    }
};

/**
 * Updates profile and loads SingleApp after applying the URL filter.
 * @param {String} appUrl provided if we already have parsed url of application.
 * @method doLoadSingleappFromProfile
 */
HC$CoreApp.Controller.prototype.doLoadSingleappFromProfile = function(appUrl) {
    console.log("HC$CoreApp: Invoked doLoadSingleappFromProfile...");

    // Update profile to get applications list.
    var that = this;
    var installationStarted = false;

    // Determine the application URL.
    var applicationURL;
    if(!appUrl) {
        applicationURL = this._getApplicationURLFromProfile(this.applicationsList, HC$.config.profileService.applicationURLFilter);
    } else {
        applicationURL = appUrl;
    }

    if(!applicationURL) {
        alert("Application is not available. Incorrectly configured profile service or wrong application filter setting for 'singleapp' mode");
        window.launchbox.Container.shutdown();
    }

    if((!appUrl && this.applicationManagerListenerAdded) || appUrl) {
        this._installSingleapp(true, applicationURL);
    }

    if(!this.applicationManagerListenerAdded) {
        // Check for the application in ApplicationManager:
        // - if there is no application in ApplicationManager, it is an installation
        // - if there is one application in ApplicationManager, and has different URL, it is an update
        // - if there is one application in ApplicationManager, and has the same URL, it is a launch
        launchbox.ApplicationManager.addApplicationManagerListener({
            onListChanged: function(applications) {
                // If application already exists on the list, check for its update (but only when is ready - this prevents
                // calling update after application installation)
                // If not, start downloading the application but only when its not already installed
                // If not, start downloading the application but only when its not already installed
                if(!installationStarted) {
                    var currentApp = applications[applicationURL];
                    if (currentApp !== undefined && currentApp.state === "ready") {
                        that._updateSingleapp(currentApp);
                    } else if(currentApp === undefined) {
                        that._installSingleapp(true, applicationURL);
                    } else if(currentApp !== undefined && currentApp.state === "failed") {
                         that._reinstallSingleapp(true, applicationURL);
                    }
                    installationStarted = true;
                }
            },
            onApplicationChanged: function(application, progress, error) {
                if (application.url !== applicationURL) {
                    // Skip notifications from different apps if any.
                    return;
                }
                if(error === undefined) {
                    var oldApplicationState = that.singleWebApplication ? that.singleWebApplication.state : undefined;
                    if(application.state === "installing") {
                        if(progress !== undefined) {
                            that.onApplicationInstallingProgress(application, progress);
                        }
                        // So far we don't have information whether state ready relates to installation or update process. So
                        // we have 'onApplicationReady' for both processes. Another idea is to store this information in webapp
                    } else if(application.state === "ready") {
                        if (oldApplicationState === "started") {
                            launchbox.AccountManager.closeAccount({
                                onSuccess: function(accounts) {
                                    if(HC$.config.showLoginScreen) {
                                        that._clearCredentialsFromScreen();
                                        that._switchScreen("loadingScreen", "loginScreen");
                                    } else {
                                        launchbox.Container.shutdown();
                                    }
                                },
                                onFailure: function(error) {
                                    console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
                                    alert(that._getErrorMessage("account-manager", error));
                                    launchbox.Container.shutdown();
                                }
                            });
                        } else {
                            that.doInitACF(true, application);
                            that.onApplicationReady();
                            that._startSingleapp(application.url);
                        }
                    } else if(application.state === "updating") {
                        that.onApplicationUpdatingProgress(application, progress);
                    }
                } else {
                    that.onApplicationPreparationFailed(application, error);
                    launchbox.ApplicationManager.removeApplications([application.url]);
                }
                that.singleWebApplication = application;
            }
        });
        this.applicationManagerListenerAdded = true;
    }
};

HC$CoreApp.Controller.prototype._installSingleapp = function(includesDownloading, applicationURL, localURL) {
    var url = applicationURL === undefined ? HC$.config.applicationURL : applicationURL;
    console.log("HC$CoreApp: Installing application: "+url+"...");
    this.onApplicationInstallingStarted(includesDownloading);
    launchbox.ApplicationManager.installApplications([{ url: applicationURL, localUrl: localURL }]);
};

HC$CoreApp.Controller.prototype._reinstallSingleapp = function(includesDownloading, applicationURL) {
    var url = applicationURL === undefined ? HC$.config.applicationURL : applicationURL;
    console.log("HC$CoreApp: Re-installing application: "+url+"...");
    this.onApplicationInstallingStarted(includesDownloading);
    launchbox.ApplicationManager.reinstallApplication(applicationURL);
};

HC$CoreApp.Controller.prototype._updateSingleapp = function(app) {
    var appURL = app.url;
    console.log("HC$CoreApp: Checking for application update...");
    this.onApplicationCheckingForUpdates();
    var that = this;
    launchbox.ApplicationManager.isCacheManifestUpdateAvailable(
        appURL,
        {
            onSuccess: function(state) {
                if (state == "updateready") {
                    console.log("HC$CoreApp: Updating application...");
                    that.onApplicationUpdatingStarted();
                    launchbox.ApplicationManager.updateApplication(appURL, undefined);
                } else {
                    console.log("HC$CoreApp: No updates available.");
                    that.doInitACF(true, app);
                    that._startSingleapp(appURL);
                }
            },
            onFailure: function(error) {
                console.log("HC$CoreApp: Could not fetch updates, error code: "+ error.code +": "+ error.description);
                that.doInitACF(true, app);
                that._startSingleapp(appURL);
            }
        }
    );
};

HC$CoreApp.Controller.prototype._startSingleapp = function(applicationURL) {
    this.installedAppUrl = applicationURL === undefined ? HC$.config.applicationURL : applicationURL;
    console.log("HC$CoreApp: Starting single web application: "+ this.installedAppUrl +"...");
    this._hideProgressBar();
    this._setLoadingMessage(_("starting"));
    launchbox.ApplicationManager.startApplication(this.installedAppUrl);
};

HC$CoreApp.Controller.prototype._getApplicationURLFromProfile = function(applications, filter) {
    var applicationURL;
    if (filter) {
        // Apply application url filter. If the application is not the only one
        // matching the filter, fail.
        for (var application in applications) {
            if (filter.test(application)) {
                if (applicationURL === undefined) {
                    applicationURL = application;
                } else {
                    console.error("HC$CoreApp: More than one application matching.");
                    applicationURL = undefined;
                }
            }
        }
        if (applicationURL === undefined) {
            console.error("HC$CoreApp: No matching applications found.");
        }
    } else {
        // We do not have filter so we expect exactly one application returned in profile.
        if (Object.keys(applications).length === 1) {
            applicationURL = Object.keys(applications)[0];
        } else {
            console.log("HC$CoreApp: More than one application returned by the profile service.");
        }
    }
    return applicationURL;
};

/*-----------------------------------------------------------------*/
/* Callback methods */
/* Callback methods are called from steps methods and are used to  */
/* introduce changes in the UI. No logic should be here.           */
/*-----------------------------------------------------------------*/

/**
 * Fired when initialization is done. Goes to the login or loading screen,
 * depending on the parameter.
 * @param showLoginScreen Should login screen be used or not?
 */
HC$CoreApp.Controller.prototype.onReady = function(showLoginScreen) {
    console.log("HC$CoreApp: Ready.");
    this._switchScreen("startingScreen", showLoginScreen === true ? "loginScreen" : "loadingScreen");
};

/**
 * Fired when login has failed.
 * @method onLoginFailed
 * @param {Object} error Reason of the failed presented to the user.
 */
HC$CoreApp.Controller.prototype.onLoginFailed = function(error) {
    console.log("HC$CoreApp: Login failed: " + error.description);
    alert("Cannot login: " + error.description);
};

/**
 * Fired when enrollment procedure has started.
 * @method onEnrollmentStarted
 */
HC$CoreApp.Controller.prototype.onEnrollmentStarted = function() {
    console.log("HC$CoreApp: Enrollment procedure started...");
    this._switchScreen("loginScreen", "loadingScreen");
    this._setLoadingMessage(_("enrollingContainer"));
    this._publishProgress(0);
};

/**
 * Fired when enrollment procedure has progressed.
 * @method onEnrollmentProgress
 * @param {Number} progress Current progress, a decimal number from the range 0-1.
 */
HC$CoreApp.Controller.prototype.onEnrollmentProgress = function(progress) {
    console.log("HC$CoreApp: Enrollment progress: " + progress + "%");
    this._publishProgress(progress);
};

/**
 * Fired when enrollment procedure has failed.
 * @method onEnrollmentFailed
 * @param {Object} error The failure reason.
 */
HC$CoreApp.Controller.prototype.onEnrollmentFailed = function(error) {
    console.log("HC$CoreApp: Enrollment failed, reason " + error.code + ": " + error.description);
    alert(this._getErrorMessage("profile-service", error));
    var that = this;
    launchbox.AccountManager.closeAccount({
        onSuccess: function(accounts) {
            if(HC$.config.showLoginScreen) {
                that._switchScreen("loadingScreen", "loginScreen");
            } else {
                launchbox.Container.shutdown();
            }
        },
        onFailure: function(error) {
            console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
            alert(that._getErrorMessage("account-manager", error));
            launchbox.Container.shutdown();
        }
    });
    this._publishProgress(0);
};

/**
 * Fired when enrollment procedure has finished.
 * @method onProfileUpdateFinished
 */
HC$CoreApp.Controller.prototype.onEnrollmentFinished = function() {
    console.log("HC$CoreApp: Enrollment finished.");
    this._publishProgress(1);
};


HC$CoreApp.Controller.prototype.onAccountManagerAuthenticationStarted = function() {
    console.log("HC$CoreApp: AccountManager authentication started...");
};

HC$CoreApp.Controller.prototype.onAccountManagerAuthenticationRequiresOldPassword = function() {
    console.log("HC$CoreApp: Switching to Old Password screen...");
    this._switchScreen("loadingScreen", "oldPasswordScreen");
};

HC$CoreApp.Controller.prototype.onAccountManagerAuthenticationSucceeded = function() {
    console.log("HC$CoreApp: AccountManager authentication succeeded.");
    this._switchScreen("oldPasswordScreen", "loadingScreen");
};

HC$CoreApp.Controller.prototype.onApplicationInstallingStarted = function(includesDownloading) {
    console.log("HC$CoreApp: Application installation started...");
    if (includesDownloading) {
        console.log("HC$CoreApp: Installation includes downloading application.");
        this._setLoadingMessage(_("downloadingApplication"));
    } else {
        this._setLoadingMessage(_("installingApplication"));
    }
    this._publishProgress(0);
};

HC$CoreApp.Controller.prototype.onApplicationInstallingProgress = function(application, progress) {
    console.log("HC$CoreApp: Application installation progress: " + parseInt(100 * progress, 10) + "%");
    this._publishProgress(progress);
};

HC$CoreApp.Controller.prototype.onApplicationReady = function(application) {
    console.log("HC$CoreApp: Application is ready.");
    this._publishProgress(1);
};

HC$CoreApp.Controller.prototype.onApplicationPreparationFailed = function(application, error) {
    console.log("HC$CoreApp: Application preparation failed, reason: " + error.description);
    alert("Application downloading failed: " + error.description + "\nPlease try again.");
    if(HC$.config.showLoginScreen) {
        var that = this;
        launchbox.AccountManager.closeAccount({
            onSuccess: function(accounts) {
                that._switchScreen("loadingScreen", "loginScreen");
            },
            onFailure: function(error) {
                console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
                alert(that._getErrorMessage("account-manager", error));
                launchbox.Container.shutdown();
            }
        });
    } else {
        launchbox.Container.shutdown();
    }
};

HC$CoreApp.Controller.prototype.onApplicationCheckingForUpdates = function() {
    console.log("HC$CoreApp: Checking for application update procedure started...");
    this._setLoadingMessage(_("checkingForUpdates"));
    this._publishProgress(0);
};

HC$CoreApp.Controller.prototype.onApplicationUpdatingStarted = function() {
    console.log("HC$CoreApp: Application updating started...");
    this._setLoadingMessage(_("updatingApplication"));
    this._publishProgress(0);
};

HC$CoreApp.Controller.prototype.onApplicationUpdatingProgress = function(application, progress) {
    console.log("HC$CoreApp:   Application updating progress: " + parseInt(100 * progress, 10) + "%");
    this._publishProgress(progress);
};

HC$CoreApp.Controller.prototype.onProfileUpdateStarted = function() {
    console.log("HC$CoreApp: Profile update started - starting progress");
    this._setLoadingMessage(_("updatingProfile"));
    this._publishProgress(0);
};

HC$CoreApp.Controller.prototype.onProfileUpdateProgress = function(progress) {
    console.log("HC$CoreApp: Profile update progress: " + progress + "%");
    this._publishProgress(progress);
};

HC$CoreApp.Controller.prototype.onProfileUpdateSucceeded = function() {
    console.log("HC$CoreApp: Profile update finished.");
    this._publishProgress(1);
};

HC$CoreApp.Controller.prototype.onProfileUpdateFailed = function(error) {
    console.log("HC$CoreApp: Profile update failed, reason " + error.code + ": " + error.description);
    alert(this._getErrorMessage("profile-service", error));

    var that = this;
    launchbox.AccountManager.closeAccount({
        onSuccess: function(accounts) {
            that._switchScreen("loadingScreen", "loginScreen");
        },
        onFailure: function(error) {
            console.log("HC$CoreApp: Fatal: could not sign out: " + error.description);
            alert(that._getErrorMessage("account-manager", error));
            launchbox.Container.shutdown();
        }
    });
};


/* ------------------*/
/* Steps Queue class */
/* ------------------*/


/**
 * Creates empty steps controller.
 * @class HC$CoreApp.Controller.StepsController
 * @constructor
 */
HC$CoreApp.Controller.StepsController = function() {
    this.currentStep = -1;
    this.steps = [];
};

/**
 * Adds step to the end of the queue.
 * @method addStep
 * @param {function} step Step function.
 */
HC$CoreApp.Controller.StepsController.prototype.addStep = function(step) {
    this.steps.push(step);
};

/**
 * Adds steps to the end of the queue.
 * @param steps Array of step functions.
 */
HC$CoreApp.Controller.StepsController.prototype.addSteps = function(steps) {
    for (var index in steps) {
        this.addStep(steps[index]);
    }
};

/**
 * Starts invoking steps, from the step 0.
 * @method startSteps
 */
HC$CoreApp.Controller.StepsController.prototype.startSteps = function() {
    this.currentStep = -1;
    this.nextStep();
};

/**
 * Invokes next step from the steps queue.
 * @method nextStep
 */
HC$CoreApp.Controller.StepsController.prototype.nextStep = function() {
    this.currentStep++;
    var step = this.steps[this.currentStep];
    if (step !== undefined) {
        console.log("HC$CoreApp: Invoking step "+(this.currentStep+1)+" of "+this.steps.length+"...");
        step.call(HC$CoreApp.controller);
    } else {
        throw "HC$CoreApp: Error: no next step.";
    }
};


/* -------------------------*/
/* Private utility methods */
/* ------------------------*/

HC$CoreApp.Controller.prototype._getCredentialsFromScreen = function() {
    return {
        username: document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Username").value.toLowerCase(),
        password: document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Password").value
    };
};

HC$CoreApp.Controller.prototype._clearCredentialsFromScreen = function() {
    document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Username").value = "";
    document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Password").value = "";
};

HC$CoreApp.Controller.prototype._getOldPasswordFromScreen = function() {
    return document.getElementById("oldPassword").value;
};

HC$CoreApp.Controller.prototype._setLoadingMessage = function(message) {
    document.getElementById("loadingMessage").innerHTML = message;
};

HC$CoreApp.Controller.prototype._publishProgress = function(progress) {
    HC$CoreApp.loadingProgressBar.publishProgress(progress * 100);
};

HC$CoreApp.Controller.prototype._hideProgressBar = function() {
    (new HC$UI.Hidable(HC$CoreApp.loadingProgressBar.id)).hide();
};

HC$CoreApp.Controller.prototype._enableInputs = function(isLoginScreen) {
    if(isLoginScreen) {
        document.getElementById("oldPassword").readOnly = true;
        document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Username").readOnly = false;
        document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Password").readOnly = false;
    } else {
        document.getElementById("oldPassword").readOnly = false;
        document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Username").readOnly = true;
        document.getElementById(HC$CoreApp.userlistCombobox.mainId + "Password").readOnly = true;
    }
};

HC$CoreApp.Controller.prototype._switchScreen = function(from, to, args) {
    if (this._getCurrentScreen() == to) {
        return;
    }
    switch(to) {
        case "loginScreen":
            if (from == "startingScreen") {
                HC$CoreApp.screensContainer.switchScreen("loginScreen", "pos-right");
            } else if(from == "loadingScreen") {
                HC$CoreApp.screensContainer.switchScreen("loginScreen", "pos-left");
            } else if(from == "settingsScreen") {
                HC$CoreApp.mainLogo.show();
                HC$CoreApp.singleappHeader.hide();
                HC$CoreApp.screensContainer.switchScreen("loginScreen", "pos-left", true);
            }
            this._enableInputs(true);
            HC$CoreApp.settingsButton.show();
            break;
        case "loadingScreen":
            if (from == "loginScreen" || from == "startingScreen") {
                HC$CoreApp.screensContainer.switchScreen("loadingScreen", "pos-right");
            } else if (from == "oldPasswordScreen") {
                HC$CoreApp.screensContainer.switchScreen("loadingScreen", "pos-left");
            }
            HC$UI.fixLayoutAfterKeyboard();
            HC$CoreApp.settingsButton.hide();
            break;
        case "oldPasswordScreen":
            if (from == "loadingScreen") {
                HC$CoreApp.screensContainer.switchScreen("oldPasswordScreen", "pos-right");
            }
            this._enableInputs(false);
            HC$CoreApp.settingsButton.hide();
            break;
        case "settingsScreen":
            HC$CoreApp.mainLogo.hide();
            HC$CoreApp.singleappHeader.show();
            HC$CoreApp.screensContainer.switchScreen('settingsScreen', 'pos-right', true);
            HC$CoreApp.buttonGoBackSettings.show();
            HC$CoreApp.settingsButton.hide();
            break;
    }

    this._setCurrentScreen(to);
};

HC$CoreApp.Controller.prototype._getCurrentScreen = function() {
    return this.currentScreen;
};

HC$CoreApp.Controller.prototype._setCurrentScreen = function(scr) {
    this.currentScreen = scr;
};

HC$CoreApp.Controller.prototype._isAccountExists = function(identifier) {
    if(!this.usernames) {
        return false;
    } else {
        return this.usernames.indexOf(identifier) !== -1;
    }
};

HC$CoreApp.Controller.prototype._getErrorMessage = function(service, error) {
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
                case launchbox.AccountManager.INVALID_CREDENTIALS_ERROR:
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
    return "";
};

HC$CoreApp.Controller.prototype._startProfileUpdate = function() {
    console.debug("HC$CoreApp: ProfileUpdateCheck - starting profile update.");
    this.doAskForUpdate();
    this.askForUpdateTimestamp = Date.now();
}

HC$CoreApp.Controller.prototype._profileUpdateCheck = function() {
    var interval = HC$.config.updateInterval;
    if(interval === undefined || interval === null || interval.constructor !== Number || interval <= 0) {
        // Profile update check is disabled.
        return;
    }
    if(launchbox.Container.networkStatus.type === "none") {
        console.debug("HC$CoreApp: ProfileUpdateCheck - profile update skipped (no network connection).");
        return;
    }
    if((Date.now() - this.askForUpdateTimestamp) < interval) {
        console.debug("HC$CoreApp: ProfileUpdateCheck - profile update skipped (updateInterval not passed yet).");
        return;
    }
    if(!HC$.config.gatewayURL) {
        console.debug("HC$CoreApp: ProfileUpdateCheck - ACF is not configured, safe to start.");
        this._startProfileUpdate();
        return;
    }
    if(launchbox.ACF.connectionStatus() === launchbox.ACF.ConnectionStatus.CONNECTED) {
        console.debug("HC$CoreApp: ProfileUpdateCheck - ACF is connected, safe to start.");
        this._startProfileUpdate();
        return;
    }
    if (this._profileUpdateCheckACFListenerRegistered === true) {
        // Update check listener already registered.
        return;
    }
    console.debug("HC$CoreApp: ProfileUpdateCheck - ACF is not connected, registering ACF listener.");
    var that = this;
    launchbox.ACF.addListener({
        onConnectionStatusChanged: function(status) {
            console.debug("HC$CoreApp: ProfileUpdateCheck - ACF connection status changed to " + status + ".");
            if (status !== launchbox.ACF.ConnectionStatus.CONNECTED) {
                return;
            }
            console.debug("HC$CoreApp: ProfileUpdateCheck - ACF connected, safe to start.");
            launchbox.ACF.removeListener(this);
            that._profileUpdateCheckACFListenerRegistered = false;
            that._startProfileUpdate();
        }
    });
    this._profileUpdateCheckACFListenerRegistered = true;
}

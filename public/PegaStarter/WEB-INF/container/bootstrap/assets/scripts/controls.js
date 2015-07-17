/*
 Copyright (c) 2013 Antenna Software

 You may study, copy and/or modify this file and use it or any modified version within any
 instance of an Antenna Software product which you have been granted a license to use.

 You may not redistribute copies or modified versions of this file to third parties or make it
 accessible via any public medium without the written permission of Antenna Software.

 This copyright notice must be retained in all copies or modified versions of this file.
*/

// Prepare namespaces
var HC$UI = HC$UI || {};

/**
 * Common method creating DOM element with given class/classes name for given tag
 * @method createElement
 * @private
 * @param {string} tagName Tag name (div, td, etc.).
 * @param {string} className Classes to apply separated by space.
 */
HC$UI.createElement = function(tagName, className) {
    var el = document.createElement(tagName);
    if (className !== undefined) {
        el.className = className;
    }
    return el;
};

/**
 * Creates controller for progress bar, which is used for handling username field on login screen.
 * @class HC$UI.Combobox
 * @param {string} mainId Id of the combobox main element.
 * @param {Object} screensContainer reference to object holding screens.
 * @constructor
 */
HC$UI.Combobox = function(mainId, screensContainer) {
    this.screensContainer = screensContainer;

    this.simpleMode = true;
    this.mainId = mainId;

    this.selectEl = document.getElementById(this.mainId + "Userslist");
    this.inputEl = document.getElementById(this.mainId + "Username");
    this.passwordEl = document.getElementById(this.mainId + "Password");
    this.arrowEl = document.getElementById(this.mainId + "Arrow");
    this.crossEl = document.getElementById(this.mainId + "Cross");
    this.keyboardWereInvoked = false;
    this.hasBeenClicked = false;

    //workaround for bug introduced in UC-2085
    this.changeScreensVisibility = function() {};
    var that = this;
    var ua = navigator.userAgent;
    if(ua.indexOf("Android") !== -1) {
        var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
        if (androidversion >= 4.0 && androidversion <= 4.1) {
            that.changeScreensVisibility = function(visible) {
                that.screensContainer._changeScreensVisibility(visible, true);
            };
        }
    }
    //--------

    this.init();
};

/**
 * Initialize combobox control depending on its mode, to be used with HC$UI.Combobox class.
 * @method init
 */
HC$UI.Combobox.prototype.init = function() {
    //Workaround for bug introduced in UC-2085
    var that = this;
    var hideScreens = function() {
        that.changeScreensVisibility(false);
    };
    var showScreens = function() {
        that.changeScreensVisibility(true);
    };
    this.inputEl.onclick = hideScreens;
    this.inputEl.onblur = showScreens;
    this.passwordEl.onclick = hideScreens;
    this.passwordEl.onblur = showScreens;
    //--------

    if(this.simpleMode) {
        this.selectEl.onchange = null;
        this.selectEl.onclick = null;
        this.crossEl.onclick = null;

        this.selectEl.style.visibility = "hidden";
        this.crossEl.style.visibility = "hidden";
        this.arrowEl.style.visibility = "hidden";
    } else {
        this.selectEl.style.visibility = "visible";
        this.arrowEl.style.visibility = "visible";

        var that = this;
        this.selectEl.onchange = function() {
            that.inputEl.value = this.options[this.selectedIndex].value;
        };

        //this is a solution for problem with selecting first selected element (user wants to select option which is already selected -> 'onchange' is not called)
        this.selectEl.onclick = function() {
            if(!that.hasBeenClicked || that.inputEl.value === "") {
                that.inputEl.value = this.options[this.selectedIndex].value;
                that.hasBeenClicked = true;
            }
        };

        this.inputEl.onclick = function() {
            that.showCross(true);
            hideScreens();
        };

        this.inputEl.onblur = function() {
            if(that.inputEl.value === "") {
                that.showCross(false);
            }
            showScreens();
        };

        this.crossEl.onclick = function() {
            that.inputEl.value = "";
            that.passwordEl.value = "";
            that.showCross(false);
        };
    }
};

/**
 * Sets users on select control bound with combobox, to be used with HC$UI.Combobox class.
 * @method setUsernames
 * @param {Map<String, Map<String, String>} users map containing userName -> publicFields map (fieldKey -> fieldValue)
 */
HC$UI.Combobox.prototype.setUsernames = function(users) {
  var options = this.selectEl.options;
  for (var i = 0, len = options.length; i < len; i++) {
    this.selectEl.remove(options[i]);
  }

  for (var user in users) {
    option = document.createElement("option");
    option.text = users[user];
    option.value = users[user];
    this.selectEl.add(option);
  }
};

/**
 * Show/hide combobox cross, to be used with HC$UI.Combobox class.
 * @method showCross
 * @param {boolean} show Flag responsible for showing/hiding combobox cross.
 */
HC$UI.Combobox.prototype.showCross = function(show) {
    if(show) {
        this.arrowEl.style.visibility = "hidden";
        this.selectEl.style.visibility = "hidden";
        this.crossEl.style.visibility = "visible";
    } else {
        this.arrowEl.style.visibility = "visible";
        this.selectEl.style.visibility = "visible";
        this.crossEl.style.visibility = "hidden";
    }
};

/**
 * Sets mode of combobox control, to be used with HC$UI.Combobox class.
 * @method setSimpleMode
 * @param {boolean} setSimple Determines combobox mode.
 */
HC$UI.Combobox.prototype.setSimpleMode = function(setSimple) {
    if(!setSimple && this.simpleMode) {
        this.simpleMode = false;
        this.init();
    } else if(!this.simpleMode) {
        this.simpleMode = true;
        this.init();
    }
};

/**
 * Creates controller for details presented on settings screen.
 * @class HC$UI.SettingsInfo
 * @param {string} id id of main settings element.
 * @constructor
 */
HC$UI.SettingsInfo = function(id) {
    this.id = id;
};

/**
 * Sets callback which is called when uninstall button has been clicked.
 * @method registerRemoveAction
 * @param {Function} callback callback called when uninstall button has been clicked
 */
HC$UI.SettingsInfo.prototype.registerRemoveAction = function(callback) {
    this.removeAction = callback;
};

/**
 * Sets accounts list.
 * @method setAccounts
 * @param {Array} accounts accounts list
 * @param {string} loggedUser username of currently logged user
 */
HC$UI.SettingsInfo.prototype.setAccounts = function(accounts, loggedUser) {
    this._buildAccountsList(accounts, loggedUser);
};

/**
 * Removes account from the list.
 * @method removeAccount
 * @param {string} username identifies user to remove
 */
HC$UI.SettingsInfo.prototype.removeAccount = function(username) {
    var tbodyEl = document.getElementById(this.id).children[0];
    var toRemove = document.getElementById("user:" + username);
    tbodyEl.removeChild(toRemove);
};

/**
 * Sets information about container.
 * @method setContainerInfo
 * @param {string} deviceId device id
 * @param {string} profileService ProfileService url
 * @param {string} details container details
 */
HC$UI.SettingsInfo.prototype.setContainerInfo = function(name, version, deviceId, profileService, details, phoneNumber) {
    var tbodyEl = document.getElementById(this.id).children[0];
    var childrenNum = tbodyEl.children.length;
    var lastTREl = tbodyEl.children[childrenNum-1];
    var notLastTREl = tbodyEl.children[childrenNum-2];

    var nameEl = notLastTREl.children[1].children[0];
    var versionEl = notLastTREl.children[1].children[1];
    var deviceIdEl = lastTREl.children[0].children[0].children[1];
    var profileServiceEl = lastTREl.children[0].children[1].children[1];
    var detailsEl = lastTREl.children[0].children[2].children[1];
    var phoneNumberEl = lastTREl.children[0].children[3].children[1];

    nameEl.innerHTML = name;
    versionEl.innerHTML = "ver. " + version;
    deviceIdEl.innerHTML = deviceId;
    profileServiceEl.innerHTML = profileService;
    detailsEl.innerHTML = details;
    phoneNumberEl.innerHTML = phoneNumber;
};

/**
 * Builds list of accounts.
 * @private
 * @method _buildAccountsList
 * @param {Array} accounts accounts list
 * @param {string} loggedUser username of currently logged user
 */
HC$UI.SettingsInfo.prototype._buildAccountsList = function(accounts, loggedUser) {
    var that = this;
    var listener = function(evt) {
        var separatorInd = this.id.indexOf(":");
        var username =  this.id.substr(separatorInd + 1);
        that.removeAction(username);
        evt.stopPropagation();
    };
    for(var i= 0, len = accounts.length;i<len;i++) {
        var currentUsername = accounts[i];

        var fragment = document.createDocumentFragment();
        var tr = HC$UI.createElement("tr");
        var tdIcon = HC$UI.createElement("td", "icon");
        var tdName = HC$UI.createElement("td", "name-container");
        var tdDeleteButton = HC$UI.createElement("td", "delete-button");

        var divAvatar = null;
        var divName = HC$UI.createElement("div", "name");

        var divCross;
        if(loggedUser !== currentUsername) {
            divAvatar = HC$UI.createElement("div", "user-avatar");
            divCross = HC$UI.createElement("div", "cross");
        } else {
            divAvatar = HC$UI.createElement("div", "user-avatar-disabled");
            divCross = HC$UI.createElement("div", "cross-disabled");
        }
        var divCrossInner = HC$UI.createElement("div", "cross-inner");

        //prepare user avatar
        tdIcon.appendChild(divAvatar);

        //prepare name
        divName.innerHTML = currentUsername;
        tdName.appendChild(divName);

        //prepare cross
        divCross.appendChild(divCrossInner);
        tdDeleteButton.appendChild(divCross);
        tdDeleteButton.id = "deleteUser:" + currentUsername;

        if(loggedUser !== currentUsername) {
            tdDeleteButton.addEventListener("click", listener, false);
        }

        //append to the row
        tr.appendChild(tdIcon);
        tr.appendChild(tdName);
        tr.appendChild(tdDeleteButton);
        tr.id = "user:" + currentUsername;

        //append all
        fragment.appendChild(tr);

        //spacer
//        var trSpacer = HC$UI.createElement("tr", "spacer");
//        var tdEmpty = HC$UI.createElement("td");
//        trSpacer.appendChild(tdEmpty);
//        fragment.appendChild(trSpacer);

        var tbodyEl = document.getElementById(this.id).children[0];
        var secondTDel = tbodyEl.children[1];

        tbodyEl.insertBefore(fragment, secondTDel);
    }
};

/**
 * Creates controller for progress bar, which is used on loading screens.
 * @class HC$UI.ProgressBar
 * @param {string} id Id of the progress bar's div element.
 * @constructor
 */
HC$UI.ProgressBar = function(id) {
    this.id = id;
    this.progress = 0.0;
    this.hidden = false;
};

/**
 * Creates DOM fragment, to be used with HC$UI.ProgressBar class.
 * @method createDOM
 * @static
 * @param {string} id Id of the progress bar.
 * @param {string} [className] Additional classname to be used.
 * @return {DocumentFragment} Progress bar DOM fragment.
 */
HC$UI.ProgressBar.createDOM = function(id, className) {
    var fragment = document.createDocumentFragment();
    var div = document.createElement("div");
    div.id = id;
    div.className = "progress-bar";
    if (className !== undefined) {
        div.className += " "+className;
    }
    var innerHolder = document.createElement("div");
    innerHolder.className = "inner-holder";
    var inner = document.createElement("div");
    inner.className = "inner";
    innerHolder.appendChild(inner);
    div.appendChild(innerHolder);
    fragment.appendChild(div);
    return fragment;
};

/**
 * Sets the progress on the progress bar control.
 * @method publishProgress
 * @param {Number} progress Integer value of the progress, between 0 and 100.
 */
HC$UI.ProgressBar.prototype.publishProgress = function(progress) {
    this.progress = progress;
    this._redraw();
};

/**
 * Returns current progress value.
 * @method getProgress
 * @return {Number} Progress value.
 */
HC$UI.ProgressBar.prototype.getProgress = function() {
    return this.progress;
};

/**
 * Sets 'hidden' state on the ProgressBar.
 * @method hide
 */
HC$UI.ProgressBar.prototype.hide = function() {
    this.hidden = true;
    this._redraw();
};

/**
 * Sets 'visible' state on the ProgressBar.
 * @method show
 */
HC$UI.ProgressBar.prototype.show = function() {
    this.hidden = false;
    this._redraw();
};

/**
 * Applies styles to the corresponding DOM elements.
 * @method _redraw
 * @private
 */
HC$UI.ProgressBar.prototype._redraw = function() {
    if(!this.element) {
        this.element = document.getElementById(this.id);
    }

    if (this.element !== undefined) {
        var className = this.element.className;

        if (this.hidden && className.indexOf("hidden") == -1) {
            this.element.className += " hidden";
        } else if (!this.hidden && className.indexOf("hidden") !== -1) {
            this.element.className = className.substring(0, className.indexOf("hidden"));
        }
        var inner = this.element.children[0].children[0];
        if (inner !== undefined) {
            inner.style.width = this.progress+"%";
        }
    }
};

/**
 * Class for managing applications list.
 * @class HC$UI.AppList
 * @param {string} id Id of the list, matching the table DOM.
 * @param {boolean} [clickable] Should the list be initially clickable (default false)
 * @constructor
 */
HC$UI.AppList = function(id, clickable, switcherListId) {
    this.id = id;
    this.apps = [];
    this.switcherId = switcherListId;
    this.clickable = clickable !== undefined ? clickable : false;
    this.elementClickedListener = function() {};
    this.infoButtonClickedListener = function() {};
    this.removeButtonEventSet = false;
    this.idSuffix = "_switcher";
};

/**
 * Adds the application to the list, with default status "installing".
 * @method addApplication
 * @param {string} appUrl Application url.
 * @param {string} appName Name of the application, used in the list.
 * @param {string} version Version of the application.
 * @param {string} icon application icon.
 * @param {string} [status] Initial application status, default "installing". Use "detailed" to indicate that the list
 *                          element should contain only info button and status should not be updated.
 */
HC$UI.AppList.prototype.addApplication = function(appUrl, appName, version, icon, status) {
    if(!this.apps[appUrl]) {
        this.apps[appUrl] = ({"appName": appName,
                             "icon": icon,
                             "version": version,
                             "status": status !== undefined ? status : "installing",
                             "progressBar": undefined // to be populated when redrawn
                            });
        this._redraw("added", appUrl);
    }
};

/**
 * Sets information retrieved from webapp-descriptor (version/icon):
 * @method setApplicationInfo
 * @param {string} appUrl Application url.
 * @param {string} version version displayed under application name
 * @param {string} icon icon displayed on application list.
 * @param {string} largeIcon largeIcon displayed on details screen.
 */
HC$UI.AppList.prototype.setApplicationInfo = function(appUrl, version, icon, largeIcon, name) {
    if (this.apps[appUrl]) {
        this.apps[appUrl].version = version;
        this.apps[appUrl].appName = name;
        this.apps[appUrl].nameElement.innerHTML = name;
        if (icon) {
            this.apps[appUrl].icon = icon;
        }

        if (largeIcon) {
            this.apps[appUrl].largeIcon = largeIcon;
        }
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Adds application to applications switcher:
 * @method setApplicationInfo
 * @param {string} appUrl Application url.
 */
HC$UI.AppList.prototype.addtoAppSwitcher = function(appUrl) {
    if(this.switcherId && this.apps[appUrl] && this.apps[appUrl].status !== "installationFailed") {
        this._addAppToSwitcher(appUrl);
    } else if (!this.apps[appUrl]) {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Removes the application from the list.
 * @method removeApplication
 * @param {string} appUrl Application url.
 */
HC$UI.AppList.prototype.removeApplication = function(appUrl) {
    if (this.apps[appUrl]) {
        this._redraw("removed", appUrl);
        this._changeStatusOnSwitcher("removed", appUrl);
        delete this.apps[appUrl].progressBar;
        delete this.apps[appUrl];
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Changes current status of the application. Possible statuses are:
 * - ready
 * - starting
 * - started
 * @method changeStatus
 * @param {string} appUrl Application url.
 * @param {string} status New application status.
 */
HC$UI.AppList.prototype.changeStatus = function(appUrl, status) {
    if (this.apps[appUrl]) {
        this.apps[appUrl].status = status;

        if(status === "installed") {
            this.apps[appUrl].installingIndicator.innerHTML = _(status + "App")  + ":" ;
            this.apps[appUrl].infoButton.firstChild.style.display = "block";
            this._redraw("changedStatus", appUrl, [status]);
            return;
        }

        if(status === "installationFailed") {
            this.apps[appUrl].progressBar.hide();
            this.apps[appUrl].installingIndicator.innerHTML = _(status + "App")  + ":" ;
            this._redraw("changedStatus", appUrl, ["installed"]);
            return;
        }

        if (status === "ready" || status === "starting" || status === "started" || status === "failed") {
            this.apps[appUrl].progressBar.hide();
            this.apps[appUrl].installingIndicator.style.display = "none";
            this.apps[appUrl].versionInfo.style.display = "block";
            this.apps[appUrl].statusInfo.style.display = "block";
            this.apps[appUrl].infoButton.style.display = "table-cell";
            this.apps[appUrl].nameElement.className = "name";
            this.apps[appUrl].infoButton.firstChild.style.display = "block";
        }

        if (status === "installing") {
            this.apps[appUrl].progressBar.show();
            this.apps[appUrl].installingIndicator.style.display = "block";
            this.apps[appUrl].versionInfo.style.display = "none";
            this.apps[appUrl].statusInfo.style.display = "none";
            this.apps[appUrl].infoButton.firstChild.style.display = "none";
            this.apps[appUrl].nameElement.className = "name name-installing";
            this.apps[appUrl].installingIndicator.innerHTML = _(status + "App")  + ":" ;
        }

        this._redraw("changedStatus", appUrl, [status]);

        if(this.switcherId) {
            if(status === "starting" || status === "started" || status === "ready") {
                this._changeStatusOnSwitcher("", appUrl, [status]);
            }
        }
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Publishes progress to the specified application.
 * @method publishProgress
 * @param {string} appUrl Application url.
 * @param {Number} progress Progress.
 */
HC$UI.AppList.prototype.publishProgress = function(appUrl, progress) {
    if (this.apps[appUrl]) {
        this.apps[appUrl].progressBar.publishProgress(progress);
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Hides progress-bar related to specified application.
 * @method publishProgress
 * @param {string} appUrl Application url.
 */
HC$UI.AppList.prototype.hideProgressBar = function(appUrl) {
    if (this.apps[appUrl]) {
        this.apps[appUrl].progressBar.hide();
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Sets whether clicking on the items launches click listeners or not.
 * @method setClickable
 * @param {boolean} value True if items can be clicked, false otherwise.
 */
HC$UI.AppList.prototype.setClickable = function(value) {
    this.clickable = value;
};

/**
 * Tells whether clicking on the items launches click listeners or not.
 * @method isClickable
 * @return {boolean} True if items can be clicked, false otherwise.
 */
HC$UI.AppList.prototype.isClickable = function () {
    return this.clickable;
};

/**
 * Sets event listeners for the application list. Valid listeners are:
 * <ul>
 * <li>AppList:elementClicked - fired when user clicked on the list item</li>
 * <li>AppList:infoButtonClicked - fired when user clicked on the info button</li>
 * <li>AppList:removeButtonclicked - fired when user clicked on uninstall button on details screen</li>
 * </ul>
 * @method setEventListener
 * @param evt Event name.
 * @param f Function to be invoked.
 */
HC$UI.AppList.prototype.setEventListener = function(evt, f) {
    if (evt == "AppList:elementClicked") {
        this.elementClickedListener = f;
    } else if (evt == "AppList:infoButtonClicked") {
        this.infoButtonClickedListener = f;
    }  else if (evt == "AppList:removeButtonclicked") {
        this.removeButtonClickedListener = f;
    }
};

/**
 * Updates information on app details screen based on given application object
 * @method updateAppDetailsScreen
 * @param {Object} app application to display
 */
HC$UI.AppList.prototype.updateAppDetailsScreen = function(app, hasFailed) {
    var appInfoEl = document.getElementById("app-info");

    //set app name
    var appNameEl = appInfoEl.children[0];
    appNameEl.innerHTML = hasFailed ? app.name : app.name + " (" + app.version + ")";

    //set app author
    if(hasFailed || !app.copyright) {
        appInfoEl.children[1].style.display = "none";
    } else {
        appInfoEl.children[1].style.display = "block";
        var appAuthorEl = appInfoEl.children[1];
        appAuthorEl.innerHTML = app.copyright;
    }

    //set action for button
    var appUninstallButton = appInfoEl.children[2].children[0];
    var that = this;
    if(this.removeButtonEventSet === false) {
        appUninstallButton.addEventListener("click", function(evt) {
            that._dispatchAppListEvent("AppList:removeButtonclicked");
            evt.stopPropagation();
        }, false);
        this.removeButtonEventSet = true;
    }

    //set app description
    var appDescriptionEl = document.getElementById("app-description").children[1];
    if(hasFailed || !app.description) {
        document.getElementById("app-description").children[0].style.display = "none";
        appDescriptionEl.innerHTML = "";
    } else {
        document.getElementById("app-description").children[0].style.display = "block";
        appDescriptionEl.innerHTML = app.description;
    }

    //set app icon
    if (this.apps[app.url]) {
        var appIconEl = document.getElementById("app-icon").children[0];
        if (this.apps[app.url].largeIcon) {
            appIconEl.src = this.apps[app.url].largeIcon;
        } else {
            appIconEl.src = this.apps[app.url].icon;
        }
    } else {
        console.error("HC$: Could not find application: "+app.url);
    }

};

/**
 * Checks whether list is clickable and if so, fires attached listener for given event and with application id.
 * @method _dispatchAppListEvent
 * @private
 * @param evt Event name.
 * @param {string} appUrl Application url.
 */
HC$UI.AppList.prototype._dispatchAppListEvent = function(evt, appUrl) {
    if (this.isClickable()) {
        if (evt == "AppList:elementClicked" && this.elementClickedListener) {
            this.elementClickedListener({"name": "AppList:elementClicked", "appUrl": appUrl});
        } else if (evt == "AppList:infoButtonClicked" && this.infoButtonClickedListener) {
            this.infoButtonClickedListener({"name": "AppList:infoButtonClicked", "appUrl": appUrl});
        } else if (evt == "AppList:removeButtonclicked" && this.removeButtonClickedListener) {
            this.removeButtonClickedListener({"name": "AppList:removeButtonclicked"});
        }
    }
};

/**
 * Called when we start application in multiapp. This code moves launched application on top of the list.
 * @method reorganizeAppSwitcherList
 * @param {string} appUrl Application url.
 */
HC$UI.AppList.prototype.reorganizeAppSwitcherList = function(appUrl) {
    var toMove = document.getElementById(this._getElementId(appUrl) + this.idSuffix);
    var parent = document.getElementById(this.switcherId).children[0];
    parent.insertBefore(toMove,parent.firstChild);
};

/**
 * Creates element on app switcher for application with given url.
 * @method _addAppToSwitcher
 * @param {string} appUrl Application url.
 * @private
 */
HC$UI.AppList.prototype._addAppToSwitcher = function(appUrl) {
    var el = document.getElementById(this._getElementId(appUrl) + this.idSuffix);
    if(!el) {
        var fragment = document.createDocumentFragment();
        var tr = HC$UI.createElement("tr");
        var tdIcon = HC$UI.createElement("td", "icon");
        var tdApp = HC$UI.createElement("td", "app");
        var divName = HC$UI.createElement("div", "name");

        // Create and append app icon
        var imgIcon = HC$UI.createElement("img");
        imgIcon.src = this.apps[appUrl].icon;
        imgIcon.alt = "";
        tdIcon.appendChild(imgIcon);
        tr.appendChild(tdIcon);

        // Create and append app name
        divName.innerHTML = this.apps[appUrl].appName;
        tdApp.appendChild(divName);
        tr.appendChild(tdApp);

        // Create and append status div
        var tdInfo = HC$UI.createElement("td", "info info-switcher");
        var divStatus = HC$UI.createElement("div");
        divStatus.id = this._getStatusId(appUrl) + this.idSuffix;
        tdInfo.appendChild(divStatus);
        tr.appendChild(tdInfo);

        // Append all
        fragment.appendChild(tr);

        // Set DOM ID
        tr.id = this._getElementId(appUrl) + this.idSuffix;

        // Set tr onclick action
        var that = this;
        tr.addEventListener("click", function(evt) {
            that._dispatchAppListEvent("AppList:elementClicked", appUrl);
            evt.stopPropagation();
        }, false);

        // Append fragment
        document.getElementById(this.switcherId).children[0].appendChild(fragment);
    }
};

/**
 * Redraws app switcheer UI after specified operation.
 * @method _changeStatusOnSwitcher
 * @param {string} operation One of the: "added", "removed", "changedStatus".
 * @param {string} appUrl Application url.
 * @param {Array} args Arguments for the operation, i.e. new status for "changedStatus".
 * @private
 */
HC$UI.AppList.prototype._changeStatusOnSwitcher = function(operation, appUrl, args) {
    if(operation === "removed") {
        var parent = document.getElementById(this.switcherId).children[0];
        var toRemove = document.getElementById(this._getElementId(appUrl) + this.idSuffix);
        if(toRemove) {
            parent.removeChild(toRemove);
        }
    } else {
        var divStatus = document.getElementById(this._getStatusId(appUrl) + this.idSuffix);
        var infoContainer = divStatus.parentNode;
        divStatus.className = args[0];
    }
};

/**
 * Incrementally redraws the control after specified operation.
 * @method _redraw
 * @param {string} operation One of the: "added", "removed", "changedStatus".
 * @param {string} appUrl Application url.
 * @param {Array} args Arguments for the operation, i.e. new status for "changedStatus".
 * @private
 */
HC$UI.AppList.prototype._redraw = function(operation, appUrl, args) {
    if (this.apps[appUrl]) {
        switch (operation) {
            case "added":
                // Create container elements
                var isDetailed = this.apps[appUrl].status === "detailed";

                var fragment = document.createDocumentFragment();
                var tr = HC$UI.createElement("tr");
                var tdIcon = HC$UI.createElement("td", "icon");
                var tdApp = HC$UI.createElement("td", "app");
                var divName = this.apps[appUrl].nameElement = HC$UI.createElement("div", "name");
                divName.className += " name-installing";

                // Create and append app icon
                var imgIcon = this.apps[appUrl].iconElement = HC$UI.createElement("img");
                imgIcon.src = this.apps[appUrl].icon;
                imgIcon.alt = "";
                tdIcon.appendChild(imgIcon);
                tr.appendChild(tdIcon);

                // Create and append app status during installation
                var divInstallingStatus = this.apps[appUrl].installingIndicator = HC$UI.createElement("div",
                                                                                                      "installing-status");
                divInstallingStatus.innerHTML = _(this.apps[appUrl].status + "App") + ":";
                tdApp.appendChild(divInstallingStatus);

                // Create and append app name
                divName.innerHTML = this.apps[appUrl].appName;
                tdApp.appendChild(divName);
                tr.appendChild(tdApp);

                // Create and append version name
                var divVersion = this.apps[appUrl].versionInfo = HC$UI.createElement("div", "version");
                divVersion.innerHTML = "";
                tdApp.appendChild(divVersion);

                // Create and append progress bar
                var divProgress = HC$UI.createElement("div", "progress");
                var progressBarId = this._getProgressBarId(appUrl);
                var progressBarDOM = HC$UI.ProgressBar.createDOM(progressBarId, "small");
                var progressBar = new HC$UI.ProgressBar(progressBarId);
                divProgress.appendChild(progressBarDOM);
                this.apps[appUrl].progressBar = progressBar;
                tdApp.appendChild(divProgress);

                // Create and append info button
                var tdInfo = this.apps[appUrl].infoButton = HC$UI.createElement("td", "info");
                var reversedIcon = HC$UI.createElement("a", "info-button reversed");
                var reversedIconInner = HC$UI.createElement("div", "arrow");
                var that = this;
                reversedIcon.addEventListener("click", function (evt) {
                    that._dispatchAppListEvent("AppList:infoButtonClicked", appUrl);
                    evt.stopPropagation();
                }, false);
                reversedIcon.appendChild(reversedIconInner);

                // Create and append status div
                var tdStatus = this.apps[appUrl].statusInfo = HC$UI.createElement("td", "status");
                var divStatus = HC$UI.createElement("div");
                divStatus.id = this._getStatusId(appUrl);

                tdInfo.appendChild(reversedIcon);
                tdInfo.appendChild(divStatus);
                tr.appendChild(tdInfo);

                // Append all
                fragment.appendChild(tr);

                // Set DOM ID
                tr.id = this._getElementId(appUrl);

                // Set tr onclick action
                var that = this;
                tr.addEventListener("click", function (evt) {
                    that._dispatchAppListEvent("AppList:elementClicked", appUrl);
                    evt.stopPropagation();
                }, false);

                // Append fragment
                document.getElementById(this.id).children[0].appendChild(fragment);
                break;
            case "removed":
                var parent = document.getElementById(this.id).children[0];
                parent.removeChild(document.getElementById(this._getElementId(appUrl)));
                break;
            case "changedStatus":
                var divStatus = document.getElementById(this._getStatusId(appUrl));
                if (this.apps[appUrl].status !== "failed") {
                    this.apps[appUrl].versionInfo.innerHTML = _("ver") + " " + this.apps[appUrl].version;
                } else {
                    this.apps[appUrl].versionInfo.innerHTML = _("reinstall");
                }
                this.apps[appUrl].iconElement.src = this.apps[appUrl].icon;
                divStatus.className = args[0];
                break;
        }
    } else {
        console.error("HC$: Could not find application: "+appUrl);
    }
};

/**
 * Gets id for the list element associated with specified application.
 * @method _getElementId
 * @param {string} appUrl Application url.
 * @return {string} Element id.
 * @private
 */
HC$UI.AppList.prototype._getElementId = function(appUrl) {
    return this.id+appUrl;
};

/**
 * Gets id for the progress bar associated with specified application.
 * @method _getProgressBarId
 * @param {string} appUrl Application url.
 * @return {string} Progress bar id.
 * @private
 */
HC$UI.AppList.prototype._getProgressBarId = function(appUrl) {
    return this.id+appUrl+"ProgressBar";
};

/**
 * Gets id for the status div associated with specified application.
 * @method _getStatusId
 * @param {string} appUrl Application url.
 * @return {string} Status div id.
 * @private
 */
HC$UI.AppList.prototype._getStatusId = function(appUrl) {
    return this.id+appUrl+"Status";
};

/**
 * Represent application details control. It requires following placeholder items:
 * <ul>
 * <li>`id+"Name"` - for application name</li>
 * <li>`id+"Version"` - for application version</li>
 * <li>`id+"Icon"` - IMG element for application icon</li>
 * <li>`id+"Description"` - for application description</li>
 * <li>`id+"Copyright"` - for application copyright</li>
 * </ul>
 * @class HC$UI.AppDetails
 * @constructor
 * @param {string} id Id of the control, matching DOM elements.
 */
HC$UI.AppDetails = function(id) {
    this.id = id;
};

/**
 * Represents container for screens without continuous feedback.
 * Note: this is not typical stack container. Instead of keeping all screens on the absolute (0,0), after moving
 * them to pos-left or pos-right, we leave them there.
 * @param id Id of the container.
 * @class HC$UI.StackContainer
 * @constructor
 */
HC$UI.StackContainer = function(id) {
    this.id = id;
    this.screens = [];
    this.currentScr = undefined;
};

/**
 * Registers the screen withing the container
 * @method addScreen
 * @param {HC$UI.Screen} scr Screen object to be registered.
 * @param {string} [current] True if the screen is currently visible, false otherwise.
 * @param {boolean} [isLoginScreen] true if added screen is a login screen.
 */
HC$UI.StackContainer.prototype.addScreen = function(scr, current, isLoginScreen) {
    if(isLoginScreen) {
        this.loginScreenId = scr.id;
    }
    this.screens[scr.id] = scr;
    if (current) {
        this.currentScr = scr;
    }
};

/**
 * Unregisters the screen from the container. It's the user's responsibility to ensure that the screen was not current.
 * If this was the only screen in the container, we set "undefined" to "current screen" value.
 * Does not destroy the screen object.
 * @method removeScreen
 * @param {HC$UI.Screen} scr Screen object to be unregistered.
 */
HC$UI.StackContainer.prototype.removeScreen = function(scr) {
    this.screens[scr.id] = undefined;
    delete this.screens[scr.id];
    if (this.currentScr === scr && this.screens.length === 0) this.currentScr = undefined;
};

/**
 * Makes provided screen current, revealing it from provided position.
 * @method
 * @param {string} scrId Screen id.
 * @param {string} fromPos One of "pos-left", "pos-right".
 */
HC$UI.StackContainer.prototype.switchScreen = function(scrId, fromPos, withoutTransition) {
    var isTransition = true;
    if(withoutTransition) {
        isTransition = false;
    }

    var scr = this.screens[scrId];
    var currentPos = scr.getCurrentPosition();
    if (fromPos !== currentPos) {
        scr._changeCurrentPosition(fromPos, false);
    }
    this.currentScr._changeCurrentPosition(HC$UI.Screen._getAlterPosition(fromPos), isTransition);
    scr._changeCurrentPosition("pos-center", isTransition);
    this.currentScr = scr;
};


/**
 * Changes visibility of all screens inside container.
 * @method _changeScreensVisibility
 * @param {boolean} visible determines whether screen should be visible or not.
 * @param {boolean} excludeLogin determines whether login screen should be excluded from visibility changes.
 */
HC$UI.StackContainer.prototype._changeScreensVisibility = function(visible, excludeLogin) {
    for(var id in this.screens) {
        if(excludeLogin) {
            if(id !== this.loginScreenId) {
                this.screens[id]._setVisible(visible);
            }
        } else {
            this.screens[id]._setVisible(visible);
        }
    }
};

/**
 * Represents screen object, to be used in stack container.
 * @param {string} id Id of the screen.
 * @class HC$UI.Screen
 * @constructor
 */
HC$UI.Screen = function(id) {
    this.id = id;
};

/**
 * Shows/hides screen.
 * @method _setVisible
 * @param {boolean} visible determines whether screen should be visible or not.
 */
HC$UI.Screen.prototype._setVisible = function(visible) {
    var el = document.getElementById(this.id);
    if(!visible) {
        if (el.className.indexOf("hidden") == -1) {
            el.className += " hidden";
        }
    } else {
        if (el.className.indexOf("hidden") !== -1) {
            el.className = el.className.substring(0, el.className.indexOf("hidden"));
        }
    }
};

/**
 * Changes current screen position.
 * @method _changeCurrentPosition
 * @param {string} position One of "pos-left", "pos-center", "pos-right".
 * @param {boolean} [withTransition] Should the change be invoked with position? Default false.
 */
HC$UI.Screen.prototype._changeCurrentPosition = function(position, withTransition) {
    if (withTransition === true) {
        this._addClass("transition");
    } else {
        this._removeClass("transition");
    }
    var oldPos = this.getCurrentPosition();
    this._addClass(position);
    this._removeClass(oldPos);
};

/**
 * Returns current screen position. This value be changed using screens container.
 * @see HC$UI.StackContainer#switchScreen
 * @method getCurrentPosition
 * @return {string} Current screen position, one of "pos-left", "pos-center", "pos-right".
 */
HC$UI.Screen.prototype.getCurrentPosition = function() {
    var el = document.getElementById(this.id);
    if (el.className.indexOf("pos-right") !== -1) {
        return "pos-right";
    } else if (el.className.indexOf("pos-left") !== -1) {
        return "pos-left";
    } else {
        return "pos-center";
    }
};

/**
 * Adds class to the screen DOM element.
 * @method _addClass
 * @param className Class name to add.
 * @private
 */
HC$UI.Screen.prototype._addClass = function(className) {
    var el = document.getElementById(this.id);
    if (el.className.indexOf(className) === -1) {
        el.className += " "+className;
    }
};

/**
 * Removes class from the screen DOM element.
 * @method _removeClass
 * @param className Class name to be removed.
 * @private
 */
HC$UI.Screen.prototype._removeClass = function(className) {
    var el = document.getElementById(this.id);
    var classSplitted = el.className.split(" ");
    var result = "";
    for (var i = 0; i < classSplitted.length; i++) {
        if (classSplitted[i] !== className) {
            result += classSplitted[i]+" ";
        }
    }
    el.className = result;
};

/**
 * Returns altered value for provided position.
 * @method _getAlterPosition
 * @private
 * @static
 * @param {string} pos One of "pos-left", "pos-center", "pos-right".
 * @return {string} Altered value.
 */
HC$UI.Screen._getAlterPosition = function(pos) {
    if (pos == "pos-left") {
        return "pos-right";
    }
    if (pos == "pos-right") {
        return "pos-left";
    }
    return pos;
};

/**
 * Represents object that can be hidden.
 * @param {string} id Id of the object.
 * @param {boolean} hidden Should the object be initially hidden or not?. Default false.
 * @class HC$UI.Hidable
 * @constructor
 */
HC$UI.Hidable = function(id, hidden) {
    this.id = id;
    this.hidden = (hidden === undefined ? false : hidden);
    if (this.hidden) {
        this.hide();
    } else {
        this.show();
    }
};

/**
 * Shows the hidable object, that is, removes "hidden" subclass.
 * @method show
 */
HC$UI.Hidable.prototype.show = function() {
    var el = document.getElementById(this.id);
    if (el !== undefined && el !== null && el.className.indexOf("hidden") !== -1) {
        el.className = el.className.substring(0, el.className.indexOf("hidden"));
    }
};

/**
 * Hides the hidable object, that is, adds "hidden" subclass.
 * @method hide
 */
HC$UI.Hidable.prototype.hide = function() {
    var el = document.getElementById(this.id);
    if (el !== undefined && el !== null && el.className.indexOf("hidden") == -1) {
        el.className += " hidden";
    }
};

/**
 * Provides static methods for internationalization settings.
 * @class HC$I18N
 */
var HC$I18N = HC$I18N || function() {
};

/**
 * Loads internationalization settings and retranslates DOM values. If language is not provided, it uses value
 * from window.navigator.language. If language is not available, it fallbacks to the language defined in config
 * as the default.
 * @method init
 * @static
 * @param {string} [language] Language to be used.
 */
HC$I18N.init = function(language) {
    console.log("HC$: Initializing i18n feature with language "+language);
    if (language === undefined) {
        console.log("HC$: Got language from window.navigator: "+window.navigator.language);
        language = window.navigator.language;
    }
    if (HC$I18N.config !== undefined && !(language in HC$I18N.config)) {
        console.log("HC$: Could not find data for language "+language+", using default: "+HC$I18N.config["default"]);
        language = HC$I18N.config["default"];
    }
    HC$I18N.language = language;
    console.log("HC$: Initialized i18n features with language: "+language);
    HC$I18N._retranslateDOM();
};

/**
 * Sets current language and invokes retranslation.
 * @method setCurrentLanguage
 * @static
 * @param {string} language Language code.
 */
HC$I18N.setCurrentLanguage = function(language) {
    HC$I18N.language = language;
    HC$I18N._retranslateDOM();
};

/**
 * Invokes retranslation of DOM elements.
 * @method _retranslateDOM
 * @static
 * @private
 */
HC$I18N._retranslateDOM = function() {
    var elements = HC$I18N.config.dom;
    for (var id in elements) {
        var el = document.getElementById(id);
        if (el !== undefined && el !== null) {
            el.innerHTML = _(elements[id]);
        }
    }
};

/**
 * Fixes problem with layout updated on iOS after hiding keyboard
 * @method fixLayoutAfterKeyboard
 * @static
 */
HC$UI.fixLayoutAfterKeyboard = function() {
    window.setTimeout(function() {
        window.scrollTo(0, 0);
    }, 0);
};

HC$UI.isiOS = function() {
    return (/iPad/i).test(navigator.userAgent) || (/iPhone/i).test(navigator.userAgent);
};

/// Does not return micro version.
HC$UI.iOSVersion = function() {
    // Example matches contents: ["iPhone; CPU iPhone OS 7_1", "iPhone", "7", "1"]
    var matches = navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS (\d)_(\d)/i);
    if (!matches || matches.length !== 4) {
        return {};
    }
    var major = parseInt(matches[2], 10);
    var minor = parseInt(matches[3], 10);
    return { major: major, minor: minor};
};

/**
 * Sets proper CSS for Retina displays.
 * @method setRetinaCSS
 * @static
 */
HC$UI.setRetinaCSS = function() {
    if(HC$UI.isiOS() && devicePixelRatio === 2.0) {
        var retinaCSS = document.createElement("link");
        retinaCSS.setAttribute("rel", "stylesheet");
        retinaCSS.setAttribute("type", "text/css");
        retinaCSS.setAttribute("href", "./assets/styles/device-specific/retina.css");
        document.getElementsByTagName("head").item(0).appendChild(retinaCSS);
    }
};

/**
 * Sets proper meta for iOS. This is necessary due to different viewport handling in iOS 7+.
 * @method setiOSMeta
 * @static
 */
HC$UI.setiOSMeta = function() {
    if (!HC$UI.isiOS()) {
        // Android, WP8, etc.
        return;
    }
    
    var version = HC$UI.iOSVersion();
    if (version.major >= 7) {
        var metaEl = document.getElementById("viewport-meta");
        metaEl.setAttribute("content", metaEl.getAttribute("content") + ", height=device-height-20");
    }
};

/**
 * Global translation method. Given key from I18N.config map, returns value for the current language.
 * This also has a callback to default language in case of non-existing value in current language.
 * @method window._
 * @static
 * @param {string} str
 * @return {string}
 */
window._ = function(str) {
    var text = HC$I18N.config[HC$I18N.language][str];
    if (text === undefined) {
        text = HC$I18N.config[HC$I18N.config["default"]][str];
    }
    return text;
};

/**
 * Internationalization configuration object.
 * This consists of following fields:
 * <ul>
 * <li>`default`: specifies default language code,</li>
 * <li>`dom`: specifies map {DOM element id:string id}.</li>
 * </ul>
 * and maps `id:value` for the each of the languages.
 * @property config
 */
HC$I18N.config = HC$I18N.config || {
    "default": "en",
    "en": {}, "dom": {}
};
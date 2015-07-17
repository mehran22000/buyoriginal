/* ----------------------------------------------------------------------------
 * (c) 2013-2014 Antenna Software.
 * ---------------------------------------------------------------------------- */

/*global $, jQuery, ko*/



var App;

/**
 * The App class wraps the whole application logic
 *
 * @class App
 */
App = function () {
    'use strict';

    var DELIVERY_COMPLETE_STATUS_VALUES,
        CREATE_PARCELS_TABLE_SQL,
        UPSERT_PARCEL_SQL,
        SELECT_PARCELS_SQL,
        launchboxLoaded,
        parcels,
        wsqldb,
        gpsStarted,
        gpsStartedButtonEnabled,
        username,
        password,
        startMessaging,
        sendMessage,
        openDatabase,
        ParcelViewModel,
        LoginScreenViewModel,
        ParcelsScreenViewModel;

    /**
     * Delivers start work requests to AMP Service Engine
     * @private
     * @method startWork
     */
    function startWork() {
        // Sending Start Work and Parcels Download requests
        sendMessage('startWorkRequest').then(function () {
            sendMessage('getParcelsRequest').done(function (message) {
                // Updating the observable Parcels list
                message.payload.forEach(function (parcel) {
                    var parcelVM = ko.utils.arrayFirst(parcels(), function (parcelVM) {
                        return parcelVM.id() === parcel.parcelId;
                    });
                    if (!parcelVM) {
                        parcelVM = new ParcelViewModel(parcel);
                        parcels.push(parcelVM);
                    }
                    // Saving or updating in WebSql DB
                    parcelVM.save();
                });
            });
        });
    }
    /**
     * Delivers end work requests to AMP Service Engine
     * @private
     * @method endWork
     */
    function endWork() {
        sendMessage('endWorkRequest');
    }

    function initApp() {
        $.mobile.navigate('#parcel-list', { transition: 'slidefade' });
        openDatabase().done(function () {
            var username = Application$Config.acfCredentials.userId;
            if (window.launchbox && window.launchbox.ProfileServiceClient) {
                username = window.launchbox.ProfileServiceClient.username;
            }
            wsqldb.transaction(function (tx) {
                // Before starting messaging we need to restore Parcel records from previous sessions stored locally in WebSql DB
                tx.executeSql(
                    SELECT_PARCELS_SQL,
                    [
                        username
                    ],
                    function (tx, result) {
                        var i;
                        if (result && result.rows) {
                            for (i = 0; i < result.rows.length; i++) {
                                parcels.push(new ParcelViewModel(result.rows.item(i)));
                            }
                        }
                    }
                );
            });
            // Starting a new messaging session with AMP Services Engine
            startMessaging();
            startWork();
        });
    }

    function dateReplacer(key, value) {
        var result;
        if (value.toString && value.toString().length > 200) {
            result = 'LONG: ' + value.substring(0, 20);
        } else {
            result = value;
        }
        return result;
    }

    function closeApp() {
        console.info('app :: stoping application');
        if (window.AMP$.isRunningInContainer()) {
            // Stop messaging
            window.launchbox.ACF.stop();
            // Clear the observable list of parcels
            parcels.removeAll();
            // Stop tracker
            window.launchbox.GeolocationTracker.stop();
            gpsStarted(false);
            gpsStartedButtonEnabled(true);
            // Reset the workStarted and workStartedButtonEnabled flags
            endWork();
            window.launchbox.ApplicationManager.stopApplication(window.launchbox.ApplicationManager.self.id);
        } else {
            console.info('app :: can\'t stop outside container');
        }
    }

    /**
     * Possible status values which denote a parcel delivery completion
     * @private
     * @type {array}
     * @property DELIVERY_COMPLETE_STATUS_VALUES
     */
    DELIVERY_COMPLETE_STATUS_VALUES = ['DELIVERED', 'NOT DELIVERED'];

    /**
     * SQL statement used to create parcels WebSql DB table
     * @private
     * @type {string}
     * @property CREATE_PARCELS_TABLE_SQL
     */
    CREATE_PARCELS_TABLE_SQL =
        'CREATE TABLE IF NOT EXISTS parcels (id TEXT, user TEXT' +
        ', deliveryTime TEXT, name TEXT, address1 TEXT, address2 TEXT, city TEXT,' +
        'postalCode TEXT, phone TEXT, status TEXT, reason TEXT,' +
        ' PRIMARY KEY (id, user))';

    /**
     * SQL statement used to insert or update records into parcels WebSql DB table
     * @private
     * @type {string}
     * @property UPSERT_PARCEL_SQL
     */
    UPSERT_PARCEL_SQL =
        'INSERT OR REPLACE INTO parcels ' +
        '(id, user, deliveryTime, name, address1, address2, city, postalCode, phone, status, reason) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    /**
     * SQL statement used to extract records from parcels WebSql DB table
     * @private
     * @type {string}
     * @property SELECT_PARCELS_SQL
     */
    SELECT_PARCELS_SQL =
        'SELECT * FROM parcels WHERE user = ?';

    /**
     * Observable flag which indicates if the AMP Hybrid Client's API has been already loaded
     *
     * @private
     * @type {boolean}
     * @property launchboxLoaded
     */
    launchboxLoaded = ko.observable(false);

    /**
     * The observable array of Parcels assigned to the user
     *
     * @private
     * @type {array}
     * @property parcels
     */
    parcels = ko.observableArray();

    /**
     * Observable flag which indicates if user has clicked the start gps button
     *
     * @private
     * @type {boolean}
     * @property gpsStarted
     */
    gpsStarted = ko.observable(false);

    /**
     * Observable flag which indicates if the start/stop gps button should be enabled
     *
     * @private
     * @type {boolean}
     * @property gpsStartedButtonEnabled
     */
    gpsStartedButtonEnabled = ko.observable(true);

    /**
     * The method initializes AMP Hybdrid Client's ACF messaging, establishing a new session with AMP Services Engine
     * @private
     * @method startMessaging
     */
    startMessaging = function () {
        if (!window.AMP$.isRunningInContainer() || window.AMP$.isRunningOnWindowsPhone()) {
            window.messengerLogger.setLogLevel('debug');
            // On AMP Hybrid Container the configuration is set automatically
            window.launchbox.ACF.configure({
                gatewayURL : Application$Config.acfConfig.gatewayURL
            });
            window.launchbox.ACF.setCredentials({
                userId: Application$Config.acfCredentials.userId,
                password: Application$Config.acfCredentials.password,
                deviceId: Application$Config.acfCredentials.deviceId
            });
        }

        // We declare messaging listener here but most of them will be used only for logging purposes.
        // "onUnsolited" will have additional logic to handle unsolicited Parcel updates coming from
        // the backend.
        window.launchbox.ACF.addListener({
            // Indicates that the messaging service connection status with the ASE's CAP has been changed.
            onConnectionStatusChanged: function (status) {
                console.info('Connection status changed to ' + status);
            },
            // Indicates that the user authentication process has failed.
            onAuthenticationFailure: function (failureType, info) {
                console.info('error ' + info);
            },
            // Indicates that a message was successfully confirmed (ACK'ed) by the server.
            onSuccess: function (attributes, description) {
                console.info('on success');
            },
            // Handles a response from the server, correlated with a message that was sent by the client.
            onResponse: function (message) {
                console.info('Received message: ' + message.payload);
            },
            // Indicates that a message was not received or processed by the server due to an error specified
            // by means of the type and description parameters.
            onFailure: function (attributes, type, info) {
                console.error('Message sending failed: ' + info);
            },
            // Indicates that the message receipt process has failed due to an error.
            onReceiveFailure: function (failureType, message) {
                console.error(failureType);
            },
            // Handles a message from the server that is not correlated with any message previously sent by the
            // client or when there was no message listener specified during the sending of the original correlated message.
            onUnsolicited: function (message, messageSender) {
                console.info('Got a parcel update');
                var parcel = JSON.parse(message.payload),
                    parcelVM = ko.utils.arrayFirst(parcels(), function (parcelVM) {
                        return parcelVM.id() === parcel.parcelId;
                    });

                if (parcel['text-notification']) {
                    console.info('..it\'s push notification');
                } else {
                    if (!parcelVM) {
                        parcelVM = new ParcelViewModel(parcel);
                        parcels.push(parcelVM);
                    }
                    parcelVM.save();
                }
            }
        });

        // Start the ACF service.
        window.launchbox.ACF.start();
    };

    /**
     * This method wraps AMP Hybrid Client's ACF send method for usage convenience
     * @private
     * @param {string} operation the operation name registered in AMP Services Engine
     * @param {object} payload the data payload object
     * @returns {object} deferred jquery deferred object
     * @method sendMessage
     */
    sendMessage = function (operation, payload) {
        var deferred = $.Deferred();
        // Sends a new message to AMP Services Engine (store and forward)
        window.launchbox.ACF.send(
            {
                // Specifies the name of an operation to be run on the server side.
                // Please note that from AMP 2 this is mapped to the transaction name.
                operation: operation,
                // Specifies the message to be sent to the server.
                payload: (payload && JSON.stringify(payload)) || '{}'
            },
            {
                // Specifies the timeout of a single message that has been sent to ASE. Default value: 60 seconds.
                serverTimeout: 60,
                // Specifies the wait time for a response from the host since ACK. This timer can be disabled by passing 0 as its value.
                // Default value: 300 seconds.
                responseTimeout: 300,
                // Specifies the amount of time for which the message can stay in the queue since it has been inserted.
                // Exceeding the expiryTimout discards the message and triggers the failure handler. Default value: not set.
                expiryTimeout: undefined
            },
            {
                // Invoked when a message was successfully confirmed (ACK'ed) by the server.
                // The required description parameter contains message processing information passed as string.
                onSuccess: function () {
                    deferred.resolve();
                },
                // Handles a response from the server, correlated with a message that was sent by the client
                onResponse: function (message) {
                    deferred.resolveWith(this, [{payload: JSON.parse(message.payload)}]);
                },
                // Indicates that a message was not received or processed by the server due to an error
                onFailure: function (type, message) {
                    deferred.rejectWith(this, message.description);
                }
            }
        );
        return deferred;
    };

    /**
     * This method initializes the WebSql DB used to store the user's Parcel records
     * @private
     * @returns {object} deferred jquery deferred object
     * @method openDatabase
     */
    openDatabase = function () {
        var deferred = $.Deferred();
        wsqldb = window.openDatabase('parceldb', '0.1b', 'Parcel Delivery', 5 * 1024 * 1024);
        if (!wsqldb) {
            console.error('app :: setupDatabase :: Failed to open web database for Parcel Delivery Application');
            deferred.reject();
        }
        wsqldb.transaction(
            function (tx) {
                tx.executeSql(
                    CREATE_PARCELS_TABLE_SQL,
                    [],
                    function () {
                        console.info('app :: openDatabase :: database ready');
                        deferred.resolve();
                    },
                    function (error) {
                        console.error('app :: openDatabase :: error opening database: ' + error);
                        deferred.reject();
                    }
                );
            },
            function (error) {
                console.error('app :: openDatabase :: error opening database: ' + error);
                deferred.reject();
            }
        );
        return deferred;
    };

    /**
     * This class wraps a plain Parcel object with observable properties and methods ready to interact with
     * the view (HTML), messaging and persistence layers of the application
     * @private
     * @param {object} parcel plain Parcel object
     * @class ParcelViewModel
     */
    ParcelViewModel = function (parcel) {
        var parcelDetailScreen,
            parseTime,
            exportTime;

        this.logout = closeApp;

        /**
         * This method converts a time string into a Date object
         * @private
         * @param {string} time
         * @returns {date} date
         * @method parseTime
         */
        parseTime = function (time) {
            var parts, date;
            if (time) {
                parts = time.split(':');
                date = new Date(new Date().setHours(parts[0], parts[1]));
            } else {
                console.error('parseTime :: time is undefined');
            }
            return date;
        };

        /**
         * This method converts a Date object into a time string
         * @private
         * @param {date} date
         * @returns {string} time
         * @method exportTime
         */
        exportTime = function (date) {
            var hours, minutes, time;
            if (date) {
                hours = String(date.getHours());
                minutes = String(date.getMinutes());
                time = (hours.length === 1 ? '0' + hours : hours) + ':' + (minutes.length === 1 ? '0' + minutes : minutes);
            } else {
                console.error('exportTime :: date is undefined');
            }
            return time;
        };

        parcelDetailScreen = $('#parcel-list-detail')[0];

        // Observable Parcel properties
        this.id = ko.observable(parcel.id || parcel.parcelId);
        this.deliveryTime = ko.observable(parseTime(parcel.deliveryTime));
        this.displayedDeliveryTime = ko.computed(function () {
            return exportTime(this.deliveryTime());
        }, this);
        this.hasHighPriority = ko.computed(function () {
            return (Math.abs(this.deliveryTime() - Date.now()) < (60 * 60 * 1000) || this.deliveryTime() < Date.now());
        }, this);
        this.cssPriority = ko.computed(function () {
            return this.hasHighPriority() ? 'delivery-time-urgent' : '';
        }, this);
        this.name = ko.observable(parcel.name || parcel.address.name);
        this.address1 = ko.observable(parcel.address1 || (parcel.address && parcel.address.address1));
        this.address2 = ko.observable(parcel.address2 || (parcel.address && parcel.address.address2));
        this.city = ko.observable(parcel.city || (parcel.address && parcel.address.city));
        this.postalCode = ko.observable(parcel.postalCode || (parcel.address && parcel.address.postalCode));
        this.phone = ko.observable(parcel.phone || (parcel.address && parcel.address.phone));
        this.status = ko.observable(parcel.status);
        this.cssStatus = ko.computed(function () {
            return this.status() ? 'parcel-status--' + this.status().toLowerCase().replace(/ /g, '-') : '';
        }, this);
        this.lastStatusChange = ko.observable();
        this.lastStatusChangeTime = ko.computed(function () {
            return exportTime(this.lastStatusChange());
        }, this);
        this.pendingClose = ko.observable(false);
        this.cssPendingClose = ko.computed(function () {
            return this.pendingClose() ? 'pending-close' : '';
        }, this);
        this.reason = ko.observable(parcel.reason);

        /**
         * This method makes the application navigate to parcels list detail screen
         * @private
         * @method goToDetails
         */
        this.goToDetails = function () {
            // Unbinding previous parcel view model from the parcel detail view (HTML)
            ko.cleanNode(parcelDetailScreen);
            // Binding the new parcel view model with the parcel detail view (HTML)
            ko.applyBindings(this, parcelDetailScreen);
            // Navigating to parcel detail screen
            $.mobile.navigate('#parcel-list-detail', { transition: 'slidefade' });
        }.bind(this);

        /**
         * Saves or updates the current Parcel view model state in the WebSql DB
         * @private
         * @method save
         */
        this.save = function () {
            var username = Application$Config.acfCredentials.userId;
            if (window.launchbox && window.launchbox.ProfileServiceClient) {
                username = window.launchbox.ProfileServiceClient.username;
            }
            wsqldb.transaction(function (tx) {
                tx.executeSql(
                    UPSERT_PARCEL_SQL,
                    [
                        this.id(),
                        username,
                        exportTime(this.deliveryTime()),
                        this.name(),
                        this.address1(),
                        this.address2(),
                        this.city(),
                        this.postalCode(),
                        this.phone(),
                        this.status(),
                        this.reason()
                    ]
                );
            }.bind(this));
        }.bind(this);

        /**
         * Syncs the local Parcel view model changes with the backend
         * @private
         * @method sync
         */
        this.sync = function () {
            sendMessage('updateParcelStatusRequest', {
                parcelId: this.id(),
                status: this.status(),
                reason: this.reason()
            }).done(function () {
                if (DELIVERY_COMPLETE_STATUS_VALUES.indexOf(this.status()) !== -1) {
                    this.pendingClose(false);
                }
            }.bind(this));
        }.bind(this);

        this.onStatusChange = this.status.subscribe(function (value) {
            this.lastStatusChange(new Date());
            if (DELIVERY_COMPLETE_STATUS_VALUES.indexOf(value) !== -1) {
                this.pendingClose(true);
            }
            this.save();
            this.sync();
        }.bind(this));
        this.notDelivering = ko.observable(false);
    };

    /**
     * This class is used to create an instance of the Parcels List screen view model. It exposes the observable list of Parcels
     * properly filtered and sorted according to the status and delivery time. It also exposes the logic related to start/end work.
     * @private
     * @param {array} parcels the observable array of Parcels
     * @class ParcelsScreenViewModel
     */
    ParcelsScreenViewModel = function (parcels) {
        // Boolean observable which indicates if gps has been started
        this.gpsStarted = gpsStarted;
        // Boolean observable which disables start/stop gps button while processing the requests
        this.gpsStartedButtonEnabled = gpsStartedButtonEnabled;

        this.logout = closeApp;

        /**
         * Enabling/disabling GPS Tracker if it is available
         * @private
         * @method toggleGPS
         */
        this.toggleGPS = function (vm, event) {
            // The GeolocationTracker object provides methods that allow the client application to track the position of the device,
            // and collect and send the data to the AMP Services Engine using AMP Communications Framework (ACF).
            this.tracker = window.launchbox && window.launchbox.GeolocationTracker;

            this.gpsStartedButtonEnabled(false);
            if (this.gpsStarted() === false) {
                this.gpsStarted(true);
                this.gpsStartedButtonEnabled(true);
                $(event.target).removeClass('ui-btn-c').addClass('ui-btn-d');
                if (this.tracker) {
                    this.tracker.addListener({
                        onError: function (error) {
                            console.error('GeolocationTracker error occured : ' + error.code + ' ' + error.message);
                        },
                        onStatusChanged: function (status) {
                            console.info('GeolocationTracker status changed : ' + status);
                        }
                    });
                    this.tracker.configure({
                        // The GPS location accuracy. It has to be one of the LOCATION_ACCURACY constants. Using lower accuracy
                        // settings for the Geolocation Tracker may significantly extend battery life of the device.
                        locationAccuracy: this.tracker.LOCATION_ACCURACY_BEST,
                        // The minimum period of time, in seconds, between subsequent reads from the GPS service. Updates provided
                        // earlier will be ignored. If the value of the parameter is zero or less, the parameter is ignored. The default value is '0'.
                        updateInterval: 0,
                        // The number of location updates sent in a single ACF message. If the value of the parameter is zero or less,
                        // the parameter is ignored. The default value is '1'.
                        batchSize: 1,
                        // The time, in seconds, that defines the minimum interval between sending two subsequent messages to the AMP Services Engine instance.
                        // If the value of the parameter is zero or less, the periodic updates are disabled. The default value is '0'.
                        // This value is overriden, when updateInterval and batchSize are set to a smaller timespan. E.g. even if sendInterval is set to 25000 (25 s),
                        // but updateInterval is set to 1000 (1 s) and batchSize is set to 4, the ACF message will be sent every 4 seconds.
                        sendInterval: 5000,
                        // The time, in seconds, after which the gelocation tracker service stops collecting and sending the location data. If the value of the
                        // parameter is zero or less, the geolocation tracker will work indefinitely, unless the user explicitly stops it. The default value is '0'.
                        workingPeriod: 0
                    });
                    this.tracker.start();
                } else {
                    console.warn('GPS Tracker is not available');
                }
            } else {
                this.gpsStarted(false);
                this.gpsStartedButtonEnabled(true);
                $(event.target).removeClass('ui-btn-d').addClass('ui-btn-c');
                if (this.tracker) {
                    console.info('Stopping GPS Tracker');
                    this.tracker.stop();
                }
            }
        }.bind(this);

        /**
         * The observable filtered and sorted list of parcels
         *
         * @private
         * @type {array}
         * @property parcels
         */
        this.parcels = ko.computed(function () {
            return parcels().filter(function (parcelVM) {
                return !(DELIVERY_COMPLETE_STATUS_VALUES.indexOf(parcelVM.status()) !== -1 && parcelVM.pendingClose() === false);
            }).sort(function (left, right) {
                var result;
                if (DELIVERY_COMPLETE_STATUS_VALUES.indexOf(left.status()) === -1 && DELIVERY_COMPLETE_STATUS_VALUES.indexOf(right.status()) === -1) {
                    if (left.status() === 'DELIVERING' && right.status() !== 'DELIVERING') {
                        result = -1;
                    } else if (left.status() !== 'DELIVERING' && right.status() === 'DELIVERING') {
                        result = 1;
                    } else {
                        result = left.deliveryTime() === right.deliveryTime() ? 0 : (left.deliveryTime() < right.deliveryTime() ? -1 : 1);
                    }
                } else if (DELIVERY_COMPLETE_STATUS_VALUES.indexOf(left.status()) !== -1 && DELIVERY_COMPLETE_STATUS_VALUES.indexOf(right.status()) !== -1) {
                    result = left.lastStatusChangeTime() === right.lastStatusChangeTime() ? 0 : (left.lastStatusChangeTime() < right.lastStatusChangeTime() ? -1 : 1);
                } else if (DELIVERY_COMPLETE_STATUS_VALUES.indexOf(left.status()) !== -1) {
                    result = -1;
                }
                result = 1;
                return result;
            });
        });
    };

    // Listening for screen navigation events
    $(window).on('navigate', function (event, data) {
        if (launchboxLoaded()) {
            switch (window.location.hash) {
            case '#parcel-list-detail':
                break;
            case '#parcel-list':
                break;
            default:
                // We only need to react to navigation events which direct the application to login screen or outside the application in
                // order to:
                // Stop messaging
                window.launchbox.ACF.stop();
                // Clear the observable list of parcels
                parcels.removeAll();
                // Reset the workStarted and workStartedButtonEnabled flags
                gpsStarted(false);
                gpsStartedButtonEnabled(true);
                break;
            }
        }
    }.bind(this));

    this.init = function () {
        // Creating instances of our application screen's view models
        this.parcelsViewModel = new ParcelsScreenViewModel(parcels);

        // Binding the new view model instances with the applications view (HTML)
        ko.applyBindings(this.parcelsViewModel, $('#parcel-list')[0]);

        // Register for Native Push Notifications
        window.onLaunchboxLoaded = function () {
            // onLaunchboxLoaded is called by the AMP Hybrid Client when it loads all JavaScript/native code and web apps are allowed to call all their APIs.
            launchboxLoaded(true);
            // Registering for native push notifications
            if (window.launchbox && window.launchbox.PushNotifications) {
                window.launchbox.PushNotifications.addListener({
                    onPushNotification: function (data) {
                        console.log('PUSH: addListener::onPushNotification');
                        console.log('data:' + JSON.stringify(data));
                        var msg = (data.c2dm && data.c2dm.message) || (data.aps && data.aps.alert);
                        window.alert(msg);
                    }
                });
                window.launchbox.PushNotifications.register({
                    onRegistrationSucceeded: function () {
                        console.info('Successfully registered for native push notifications');
                    },
                    onRegistrationFailed: function (error) {
                        console.error('Failed to register for native push notifications: ' + error.description + ' (' + error.code + ')');
                    }
                });
            }
            // Initialiting the web application logic
            initApp();
        };
    }.bind(this);
};
window.Application$ = window.Application$ || new App();
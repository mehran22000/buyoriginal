
var MessengerConfig = {
    url: undefined,
    userId: "not_provided",
    password: "not_provided",
    httpCapURL: undefined
};

var DescriptorParser = function () {
    this.defaultVersion = "1.0.0";
    this.defaultAppkeyVersion = "1.0.0";
};
DescriptorParser.prototype.readDescriptor = function () {
    // Parse operation mappings if available.
    var linkElements = document.head.getElementsByTagName("link");
    for (var i = linkElements.length - 1; i >= 0; i--) {
        if (linkElements[i].getAttribute("rel") == "x-antenna-managed-webapp-descriptor") {
            var that = this;
            var request = new XMLHttpRequest();
            request.open("GET", linkElements[i].getAttribute("href"));
            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status === 200) {
                    try {
                        that.parseResponse(request.responseText);
                    } catch (err) {
                        console.error(err.message);
                        throw err;
                    }
                }
            };
            request.send();
        }
    };
};
DescriptorParser.prototype.parseResponse = function (responseXml) {
    var descriptorNamespace20 = "http://www.antennasoftware.com/application-hosting/web-app-descriptor/2.0";
    var parser = new DOMParser();
    var doc = parser.parseFromString(responseXml, "application/xml");
    var rootElement = doc.documentElement;
    if (rootElement.tagName != "webapp-descriptor") {
        throw new Error("Invalid root element of the webapp descriptor file.");
    }
    if (rootElement.getAttribute("xmlns") != descriptorNamespace20) {
        // Read the 1.0 descriptor format. TODO: Implement if necessary!
        throw new Error("Unsupported webapp descriptor namespace version. Should be: " + descriptorNamespace20);
    }
    var readDescriptorElement = function(tagName) {
        var elements = rootElement.getElementsByTagName(tagName);
        return elements.length ? elements[0].textContent : null;
    };
    var idValue = readDescriptorElement("id");
    var appkeyValue = readDescriptorElement("appkey");
    var nameValue = readDescriptorElement("name");
    var versionValue = readDescriptorElement("version");
    var appkeyVersionValue = readDescriptorElement("appkey-version");
    var displayVersionValue = readDescriptorElement("display-version");
    var descriptionValue = readDescriptorElement("description");
    var copyrightValue = readDescriptorElement("copyright");
    if (idValue == null && appkeyValue == null) {
        throw new Error("Neither id nor appkey found in webapp descriptor.");
    }
    if (idValue != null && appkeyValue != null) {
        throw new Error("Both id and appkey found in webapp descriptor.");
    }
    var version = versionValue != null ? versionValue : this.defaultVersion;
    var id;
    var versionForAcf;
    if (idValue != null) {
        if (appkeyVersionValue != null) {
            throw new Error("appkey version defined while no appkey was specified.");
        }
        versionForAcf = version;
        id = idValue;
    } else {
        versionForAcf = appkeyVersionValue != null ? appkeyVersionValue : this.defaultAppkeyVersion;
        id = appkeyValue;
    }
    window.launchbox.ApplicationManager.self.id = id;
    window.launchbox.ApplicationManager.self.versionForAcf = versionForAcf;
    window.launchbox.ApplicationManager.self.version = version;
    if (nameValue != null) {
        window.launchbox.ApplicationManager.self.name = nameValue;
    }
    if (displayVersionValue != null) {
        window.launchbox.ApplicationManager.self.displayVersion = displayVersionValue;
    }
    if (descriptionValue != null) {
        window.launchbox.ApplicationManager.self.description = descriptionValue;
    }
    if (copyrightValue != null) {
        window.launchbox.ApplicationManager.self.copyright = copyrightValue;
    }
};
(function() {
    window.launchbox = window.launchbox || {};
    window.launchbox.ApplicationManager = {
        self: {
            URL: null,
            id: null,
            name: null,
            icon: null,
            version: null,
            displayVersion: null,
            description: null,
            copyright: null,
            state: "started"
        }
    };
    // Read the descriptor.
    new DescriptorParser().readDescriptor();
})();

var IACF = {
    
    AuthenticationFailure: {
        CREDENTIALS_REQUIRED: 1,
        INVALID_SERVER_CREDENTIALS: 2,
        USER_ALREADY_AUTHENTICATED: 3,      // It should never happen with this API (no explicit connect method). TO BE REMOVED!
        INVALID_SERVICE_CREDENTIALS: 4,     // It should never happen with this API (no explicit connect method). TO BE REMOVED!
        ACCESS_FORBIDDEN: 5                 // HTTP status code 403.
    },
    
    ConnectionStatus: {
        
        DISCONNECTED: 0,
        
        CONNECTING: 1,
        
        CONNECTED: 2
    },
    
    MessageReceiveFailure: {
        RESPONSE_NOT_MATCHING_ANY_REQUEST: 1
    },
    
    MessageSendFailure: {
        
        APPLICATION: 0,
        
        COMMUNICATION: 1,
        
        INTERNAL: 2
    },
    
    configure: function(configuration) {},
    
    setCredentials: function(credentials) {},
    
    start: function() {},
    
    stop: function() {},
    
    send: function(message, timeouts, callbacks) {},
    
    sendResponse: function(message, originalMessageId, timeouts, callbacks) {},
    
    addListener: function(listener) {},
    
    removeListener: function(listener) {},
    
    connectionStatus: function() {},
    
    overrideOnSessionExpiredHandler: function() {}
};
// Deprecated stuff for maintaining backwards compatibility with earlier 6.x releases.

IACF.CREDENTIALS_REQUIRED_ERROR = IACF.AuthenticationFailure.CREDENTIALS_REQUIRED;

IACF.INVALID_SERVER_CREDENTIALS_ERROR = IACF.AuthenticationFailure.INVALID_SERVER_CREDENTIALS;

var OperationMappingsParser = function() {
    this.defaultHost = null;
    this.mappings = {};
    // Parse operation mappings if available.
    var linkElements = document.head.getElementsByTagName("link");
    for (var i = linkElements.length - 1; i >= 0; i--) {
        if (linkElements[i].getAttribute("rel") == "x-antenna-operation-mappings") {
            var that = this;
            var request = new XMLHttpRequest();
            request.open("GET", linkElements[i].getAttribute("href"));
            request.onreadystatechange = function() {
                if (request.readyState === 4 && request.status === 200) {
                    that.parseResponse(request.responseText);
                }
            };
            request.send();
        }
    };
};
OperationMappingsParser.prototype.parseResponse = function(responseXML) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(responseXML, "application/xml");
    if (doc.documentElement.tagName != "operation-mappings") {
        console.warn("Invalid root element of operation mappings file.");
        return;
    }
    // Read default host id.
    this.defaultHost = doc.documentElement.getAttribute("default-host-id");
    // Read operations.
    var hostElement = doc.documentElement.firstElementChild;
    while (hostElement) {
        if (hostElement.tagName == "host") {
            var hostId = hostElement.getAttribute("id");
            var operationElement = hostElement.firstElementChild;
            while (operationElement) {
                if (operationElement.tagName == "operation") {
                    operationName = operationElement.getAttribute("name");
                    this.mappings[operationName] = hostId;
                }
                operationElement = operationElement.nextElementSibling;
            }
        }
        hostElement = hostElement.nextElementSibling;
    }
};

OperationMappingsParser.prototype.getHostId = function(operationName) {
    if (this.mappings[operationName]) {
        return this.mappings[operationName];
    }
    return this.defaultHost;
};

var ACFWebImpl = function(operationMappingsParser) {
    // Private ivars.
    this._started = false;
    this._listeners = [];
    this._messenger = null;
    this._configuration = {};
    this._credentials = {};
    this._callbackCounter = 0; // A counter for local send callbacks.
    this._operationMappingsParser = operationMappingsParser;
    this._connectionStatus = 0;
};
ACFWebImpl.prototype = Object.create(IACF);
ACFWebImpl.prototype.configure = function(configuration) {
    this._configuration = configuration;
};
ACFWebImpl.prototype.setCredentials = function(credentials) {
    this._credentials = credentials;
};
ACFWebImpl.prototype.start = function() {
    var dbase = null;
    var dbaseName = null;
    if (this._messenger !== null) {
        dbase = this._messenger.systemDB.db;
        this._messenger.wipeMessanger();
    }
    if (dbase == null) {
        if (dbase = window.indexedDB) {
            dbaseName = 'Indexed DB';
        } else {
            if (dbase = openDatabase('WebMessagingServiceDB', '', 'WebMessagingService database', 1024 * 64)) {
                dbaseName = 'Web SQL DB';
            }
        }
        console.info("Database to be used by WebMessagingService: " + dbaseName);
    }
    var connectionOwner = this._configuration.masterConnectionOwner;
    if (connectionOwner && !connectionOwner.id) {
        throw new Error("masterConnectionOwner was specified but it is missing a required 'id' property");
    }
    if (connectionOwner && !connectionOwner.version) {
        throw new Error("masterConnectionOwner was specified but it is missing a required 'version' property");
    }
    var id = connectionOwner ? connectionOwner.id : window.launchbox.ApplicationManager.self.id;
    var version = connectionOwner ? connectionOwner.version : window.launchbox.ApplicationManager.self.versionForAcf;
    var messengerSpec = {
        appId: id,
        appVersion: version,
        systemDB: {
            val: null,
            cfgSet: function(dummy, value) {
                this.val = value;
            },
            cfgGet: function() {
                return this.val;
            },
            db: dbase
        }
    };
    this._messenger = new Messenger(messengerSpec);
    this._messenger.initialize();
    var enableMessagingSpec = {
        userId: this._credentials.userId,
        password: this._credentials.password,
        deviceId: this._credentials.deviceId,
        url: this._configuration.gatewayURL,
        httpCapUrl: this._configuration.httpCapURL,
        defaultMode: this._configuration.defaultMode
    };
    var that = this;
    var handleResponseMessageNotMatchingAnyRequest = function(message, receivedMessageDetail) {
        for (var i = that._listeners.length - 1; i >= 0; i--) {
            if (that._listeners[i].onReceiveFailure) {
                var failureType = receivedMessageDetail;
                var info = {
                    operation: message.operation,
                    reference: message.reference,
                    host: message.hostAddress,
                    payload: message.originalPayload
                };
                that._listeners[i].onReceiveFailure(failureType, info);
            }
        }
    };
    var failureTypeDescription = function(type) {
        switch (type) {
            case 0: return "Application error.";
            case 1: return "Communication error.";
            case 2: return "Internal error.";
            /* should not happen */
            default: return "";
        }
    };
    this._messenger.RegisterMessageReceiveHandler({
        handleMessageReceived: function(message, receivedMessageDetail) {
            if (receivedMessageDetail === that.MessageReceiveFailure.RESPONSE_NOT_MATCHING_ANY_REQUEST) {
                handleResponseMessageNotMatchingAnyRequest(message, receivedMessageDetail);
                return "true";
            }
            var payload = message.originalPayload ? message.originalPayload : "";
            var receivedMessage = {
                operation: message.operation,
                payload: payload,
                refId: message.reference
            };
            // A MessageSender object for sending correlated responses to messages.
            var messageSender = {
                _service: that,
                _originalMessage: {
                    id: message.reference,
                    operation: message.operation,
                    payload: payload
                },
                send: function(messageToSend, timeouts, callbacks) {
                    this._service._sendMessage(messageToSend, this._originalMessage.id, timeouts, callbacks);
                }
            };
            if (message.correlation) {
                // A response for sent message.
                for (var i = that._listeners.length - 1; i >= 0; i--) {
                    receivedMessage.attributes = message.userAttributes;
                    if (that._listeners[i].onResponse) {
                        that._listeners[i].onResponse(receivedMessage, messageSender);
                    }
                }
            } else {
                // An unsolicited message.
                for (var j = that._listeners.length - 1; j >= 0; j--) {
                    if (that._listeners[j].onUnsolicited) {
                        that._listeners[j].onUnsolicited(receivedMessage, messageSender);
                    }
                }
            }
            return "true";
        },
        handleNotification: function(message, type, level) {
            if (!message.id) {
                var reference = message.reference;
                if (reference) {
                    message.id = reference;
                } else {
                    message.id = "";
                }
            }
            if (type == "ack") {
                for (var i = that._listeners.length - 1; i >= 0; i--) {
                    if (that._listeners[i].onSuccess) {
                        that._listeners[i].onSuccess(message, message.data);
                    }
                }
            } else if (type == "nack") {
                var failureType = that.MessageSendFailure.APPLICATION;
                if (level == "opc") {
                    failureType = that.MessageSendFailure.COMMUNICATION;
                }
                for (var j = that._listeners.length - 1; j >= 0; j--) {
                    if (that._listeners[j].onFailure) {
                        //not the best way of cloning objects but sufficient for this particular one
                        var attributes = JSON.parse(JSON.stringify(message.userAttributes));
                        delete attributes.CALLBACK_KEY;
                        that._listeners[j].onFailure(attributes, failureType, {description: failureTypeDescription(failureType), message: message.data});
                    }
                }
            }
            return "true";
        }
    });
    this._messenger.RegisterConnectionStatusHandler(function(state, statusCode, userInfo) {
        var numStatus = that.ConnectionStatus.DISCONNECTED;
        switch (state) {
            case "DISCONNECTED":
                if (statusCode === 401) {
                    // How to detect CREDENTIALS_REQUIRED_ERROR? 
                    // Does it even make sense to connect without credentials?
                    that._authenticationFailed(that.AuthenticationFailure.INVALID_SERVER_CREDENTIALS);
                } else if (statusCode === 403) {
                    that._authenticationFailed(that.AuthenticationFailure.ACCESS_FORBIDDEN, userInfo);
                }
                break;
            case "CONNECTING":
                numStatus = that.ConnectionStatus.CONNECTING;
                break;
            case "CONNECTED":
                numStatus = that.ConnectionStatus.CONNECTED;
                break;
            default:
                console.warn("Unknown connection state: " + state + ", falling back to: DISCONNECTED");
                break;
        }
        that._updateConnectionStatus(numStatus);
    });
    this._messenger.EnableMessaging(true, enableMessagingSpec);
    this._started = true;
};
ACFWebImpl.prototype.stop = function() {
    this._started = false;
    if (this._messenger) {
        this._messenger.disconnect();
    }
};
ACFWebImpl.prototype.send = function(message, timeouts, callbacks) {
    this._sendMessage(message, null, timeouts, callbacks);
};
ACFWebImpl.prototype.sendResponse = function(message, originalMessageId, timeouts, callbacks) {
    this._sendMessage(message, originalMessageId, timeouts, callbacks);
};
ACFWebImpl.prototype.addListener = function(listener) {
    this._listeners.push(listener);
};
ACFWebImpl.prototype.removeListener = function(listener) {
    var index = this._listeners.indexOf(listener);
    if (index > -1) {
        this._listeners.splice(index, 1);
    }
};
ACFWebImpl.prototype.connectionStatus = function() {
    return this._connectionStatus;
};

ACFWebImpl.prototype._updateConnectionStatus = function(status) {
    this._connectionStatus = status;
    for (var i = this._listeners.length - 1; i >= 0; i--) {
        if (this._listeners[i].onConnectionStatusChanged) {
            this._listeners[i].onConnectionStatusChanged(status);
        }
    }
};

ACFWebImpl.prototype._authenticationFailed = function(failureType, userInfo) {
    for (var i = this._listeners.length - 1; i >= 0; i--) {
        if (this._listeners[i].onAuthenticationFailure) {
            this._listeners[i].onAuthenticationFailure(failureType, userInfo);
        }
    }
};

ACFWebImpl.prototype._sendMessage = function(message, originalMessageId, timeouts, callbacks) {
    if (!message.payload) {
        throw new Error("Missing payload data.");
    }
    if (!this._started) {
        throw new Error("Messaging disconnected, call connect before sending messages.");
    }
    if (!message.operation) {
        message.operation = "PREPARED";
    }
    timeouts = timeouts || {};
    timeouts.serverTimeout = timeouts.serverTimeout || 60;
    timeouts.responseTimeout = timeouts.responseTimeout || 300;
    timeouts.expiryTimeout = timeouts.expiryTimeout || 0;
    // This wrapper allows for per-message callbacks using the global listener.
    // Implementation here is similar to the one in AMP4.
    var that = this;
    message.attributes = message.attributes || {};
    message.attributes.CALLBACK_KEY = ++this._callbackCounter; // In AMP4 it's a this.toString() call on the wrapper object.
    this.addListener({
        callbackId: that._callbackCounter,
        onFailure: function(attributes, type, info) {
            if (attributes && this.callbackId == attributes.CALLBACK_KEY) {
                if (callbacks && callbacks.onFailure) {
                    callbacks.onFailure(type, info);
                }
                that.removeListener(this);
            }
        },
        onResponse: function(responseMessage, messageSender) {
            if (responseMessage.attributes && this.callbackId == responseMessage.attributes.CALLBACK_KEY) {
                if (callbacks && callbacks.onResponse) {
                    callbacks.onResponse({ operation: responseMessage.operation, payload: responseMessage.payload }, messageSender);
                }
                that.removeListener(this);
            }
        },
        onSuccess: function(attributes, info) {
            if (attributes && this.callbackId == attributes.userAttributes.CALLBACK_KEY) {
                if (callbacks && callbacks.onSuccess) {
                    callbacks.onSuccess(info);
                }
                that.removeListener(this);
            }
        }
    });
    this._queueMessage(message, originalMessageId, timeouts, message.host);
};

ACFWebImpl.prototype._queueMessage = function(message, originalMessageId, timeouts, host) {
    var operationName = message.operation;
    var hostId = host ? host : (operationName ? this._operationMappingsParser.getHostId(operationName) : null);
    var queueMessageSpec = {
        userAttributes: message.attributes,
        correlation: originalMessageId ? originalMessageId : null,
        originalPayload: message.payload,
        hostAddress: hostId
    };
    queueMessageSpec.transaction = operationName;
    if (!queueMessageSpec.userAttributes) {
        queueMessageSpec.userAttributes = {};
    }
    if (timeouts) {
        queueMessageSpec.msgAckTimeout = timeouts.serverTimeout;
        queueMessageSpec.msgRecvTimeout = timeouts.responseTimeout;
        queueMessageSpec.msgExpTimeout = timeouts.expiryTimeout;
    }
    this._messenger.QueueMessage(queueMessageSpec);
};
// Initialiation
window.launchbox = window.launchbox || {};
window.launchbox.ACF = new ACFWebImpl(new OperationMappingsParser());
var messengerLogger = function () {
    var logLevel = 'warn';
    var isFunction = function (value) {
        if (value === undefined || value === null) {
            return false;
        }
        return typeof value === 'function';
    };
    var getTimeString = function () {
        var time = new Date();
        var timeStr = time.getHours();
        timeStr += ":";
        var temp = time.getMinutes();
        if (temp < 10) {
            timeStr += "0";
        }
        timeStr += temp;
        timeStr += ":";
        temp = time.getSeconds();
        if (temp < 10) {
            timeStr += "0";
        }
        timeStr += temp;
        timeStr += ".";
        temp = time.getMilliseconds();
        if (temp < 10) {
            timeStr += "00";
        }
        else if (temp < 100) {
            timeStr += "0";
        }
        timeStr += temp;
        return timeStr;
    };
    var log = function (level, args) {
        if (window.console) {
            var logger = window.console[level];
            if (isFunction(logger)) {
                var logString = getTimeString();
                for (var i = 0, len = args.length; i < len; i++) {
                    logString += " ";
                    logString += args[i];
                }
                var newArgs = new Array();
                newArgs.push(logString);
                logger.apply(window.console, newArgs);
            }
        }
    };
    var warn = function () {
        log.call(this, 'warn', arguments);
    };
    var info = function () {
        if (logLevel != 'warn') {
            log.call(this, 'info', arguments);
        }
    };
    var debug = function () {
        if (logLevel == 'debug') {
            log.call(this, 'debug', arguments);
        }
    };
    var that = {};
    that.debug = function () {
        debug.apply(that, arguments);
    };
    that.info = function () {
        info.apply(that, arguments);
    };
    that.warn = function () {
        warn.apply(that, arguments);
    };
    that.setLogLevel = function (newLevel) {
        logLevel = newLevel;
    };
    return that;
}();
var Message = function () {
    this.msgAckTimeout = 60;
    this.msgRecvTimeout = 300;
    this.msgExpTimeout = 0;
    this.originalPayload = null;
    this.userAttributes = null;
    this.correlation = null;
    this.hostAddress = null;
};
var MessageDAO = function (mainSpec) {
    var GET_ALL_PENDING_MESSAGES = "SELECT id, hostAddress, state, created, timeout, reference, correlation, msgAckTimeout, msgRecvTimeout, msgExpTimeout, operation FROM _message ORDER BY created";
    var CREATE_MESSAGE_TABLE_SQL = "CREATE TABLE IF NOT EXISTS _message (id INTEGER NOT NULL PRIMARY KEY,"
        + " state INTEGER, hostAddress TEXT, reference TEXT, correlation TEXT, created INTEGER, timeout INTEGER, msgAckTimeout INTEGER, msgRecvTimeout INTEGER, msgExpTimeout INTEGER, originalPayload TEXT, userAttributes TEXT, operation TEXT)";
    var INSERT_MESSAGE_SQL = "INSERT INTO _message"
        + " (originalPayload, state, hostAddress, reference, correlation, timeout, created, msgAckTimeout, msgRecvTimeout, msgExpTimeout, userAttributes, operation)"
        + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
    var SELECT_MESSAGE_BY_ID_SQL = "SELECT * FROM _message WHERE id = ?";
    var DELETE_MESSAGE_BY_ID_SQL = "DELETE FROM _message WHERE id = ?";
    var DELETE_MESSAGE_QUEUE_SQL = "DELETE FROM _message";
    var UPDATE_MESSAGE_TO_SENT_BY_ID_SQL = "UPDATE _message SET state = ?, timeout = ? WHERE id = ?";
    var database;
    var activeDatabase = null;
    var convertRowToMessageSummary = function (row) {
        var message = {};
        message.id = row.id;
        message.host = row.hostAddress;
        message.reference = row.reference;
        message.correlation = row.correlation;
        message.state = row.state;
        message.created = row.created;
        message.timeout = row.timeout;
        message.msgAckTimeout = row.msgAckTimeout;
        message.msgRecvTimeout = row.msgRecvTimeout;
        message.msgExpTimeout = row.msgExpTimeout;
        message.expires = row.msgExpTimeout > 0 ? row.created + row.msgExpTimeout * 1000 : null;
        message.operation = row.operation;
        return message;
    };
    var convertRowToMessageData = function (row) {
        var message = {};
        message.id = row.id;
        message.host = row.hostAddress;
        message.originalPayload = row.originalPayload;
        message.userAttributes = JSON.parse(row.userAttributes);
        message.operation = row.operation;
        return message;
    };
    var executeTransaction = function (spec) {
        var errorHandler;
        if (spec.errorHandler) {
            if (typeof (spec.errorHandler) === 'function') {
                errorHandler = spec.errorHandler;
            } else {
                messengerLogger.warn('MessageDAO.executeTransaction; errorHandler is defined, but not a function');
                errorHandler = function () { };
            }
        } else {
            errorHandler = function () { };
        }
        var resultsHandler;
        if (spec.resultsHandler) {
            if (typeof (spec.resultsHandler) === 'function') {
                resultsHandler = spec.resultsHandler;
            } else {
                messengerLogger.warn('MessageDAO.executeTransaction; resultsHandler is defined, but not a function');
                resultsHandler = function () { };
            }
        } else {
            resultsHandler = function () { };
        }
        var successHandler;
        if (spec.successHandler) {
            if (typeof (spec.successHandler) === 'function') {
                successHandler = spec.successHandler;
            } else {
                messengerLogger.warn('MessageDAO.executeTransaction; successHandler is defined, but not a function');
                successHandler = function () { };
            }
        } else {
            successHandler = function () { };
        }
        //var convertResultToMessage = convertRowToMessage;
        var internalResultsHandler = function (transaction, results) {
            var messages = [];
            for (var i = 0, len = results.rows.length; i < len; i++) {
                if (spec.summary) {
                    messages.push(convertRowToMessageSummary(results.rows.item(i)));
                } else {
                    messages.push(convertRowToMessageData(results.rows.item(i)));
                }
            }
            var insertId = null;
            if (spec.isInsert) {
                try {
                    insertId = results.insertId;
                } catch (err) {
                    messengerLogger.warn('Error - insertId was not returned for an insert statement');
                }
            }
            resultsHandler(transaction, messages, results.rowsAffected, insertId);
        };
        if (spec.database.open) { //Indexed DB:
            spec.command(internalResultsHandler, errorHandler);
        } else { //Web SQL DB:
            if (spec.transaction) {
                spec.transaction.executeSql(spec.sql, spec.args, internalResultsHandler, errorHandler);
            } else {
                spec.database.transaction(function (transaction) {
                    transaction.executeSql(spec.sql, spec.args, internalResultsHandler, errorHandler);
                }, function (error) {
                    errorHandler(null, error, spec.errorText || 'Unknown error');
                }, successHandler);
            }
        }
    };
    function getArrayItem(i) {
        return this[i];
    };
    function IndexedResultsObject() {
        this.rows = [];
        this.rowsAffected = 0;
        //rows.item function is needed to keep results object consistent between IndexedDB and WebDB 
        this.rows.item = getArrayItem;
    };
    IndexedResultsObject.prototype.addResult = function (result) {
        this.rows.push(result);
        this.rowsAffected++;
    };
    var createMessageTable = function (db, errorHandler, successHandler) {
        var createMessageTableSpec = {
            database: db,
            sql: CREATE_MESSAGE_TABLE_SQL,
            command: function (internalResultsHandler, commandErrorHandler) {
                var request = database.open("MessageDAO", 1);
                request.onupgradeneeded = function (e) {
                    var activeDatabase2 = e.target.result;
                    if (!activeDatabase2.objectStoreNames.contains('_message')) {
                        activeDatabase2.createObjectStore('_message', { keyPath: 'id', autoIncrement: true });
                    }
                };
                request.onsuccess = function (e) {
                    activeDatabase = e.target.result;
                    successHandler(activeDatabase);
                };
                request.onerror = commandErrorHandler;
            },
            args: [],
            resultsHandler: function () { },
            successHandler: function () {
                messengerLogger.debug('Created _message table');
                if (!activeDatabase) {
                    activeDatabase = database;
                }
                successHandler(database);
            },
            errorText: 'Create _message table failed',
            isInsert: false,
            summary: false
        };
        executeTransaction(createMessageTableSpec);
    };
    var insertMessage = function (db, message, spec) {
        function waitForDbReady() {
            if (activeDatabase === null) {
                setTimeout(waitForDbReady, 50);
                return;
            }
            var insertMessageSpec = {
                database: db,
                transaction: spec.transaction,
                sql: INSERT_MESSAGE_SQL,
                command: function (internalResultsHandler, errorHandler) {
                    var trans = activeDatabase.transaction(["_message"], "readwrite");
                    var store = trans.objectStore("_message");
                    var data = {
                        'originalPayload': message.originalPayload,
                        'state': message.state,
                        'hostAddress': message.hostAddress,
                        'reference': message.reference,
                        'correlation': message.correlation,
                        'timeout': null,
                        'created': message.created,
                        'msgAckTimeout': message.msgAckTimeout,
                        'msgRecvTimeout': message.msgRecvTimeout,
                        'msgExpTimeout': message.msgExpTimeout,
                        'userAttributes': JSON.stringify(message.userAttributes),
                        'operation': message.transaction
                    };
                    var request = store.put(data);
                    var resultsObject = new IndexedResultsObject();
                    request.onsuccess = function (e) {
                        resultsObject.rowsAffected = 1;
                        resultsObject.insertId = e.target.result;
                        internalResultsHandler(trans, resultsObject);
                    };
                    request.onerror = errorHandler;
                },
                args: [
                    message.originalPayload, message.state,
                    message.hostAddress, message.reference, message.correlation, null,
                    message.created, message.msgAckTimeout, message.msgRecvTimeout,
                    message.msgExpTimeout, JSON.stringify(message.userAttributes),
                    message.transaction
                ],
                resultsHandler: spec.resultsHandler,
                successHandler: spec.successHandler,
                errorHandler: spec.errorHandler,
                errorText: 'Insert into message table failed',
                isInsert: true,
                summary: false
            };
            executeTransaction(insertMessageSpec);
        };
        waitForDbReady();
    };
    var retrieveMessage = function (db, id, spec) {
        var retrieveMessageSpec = {
            database: db,
            transaction: spec.transaction,
            sql: SELECT_MESSAGE_BY_ID_SQL,
            command: function (internalResultsHandler, errorHandler) {
                var trans = activeDatabase.transaction(["_message"], "readonly");
                var store = trans.objectStore("_message");
                var request = store.get(id);
                var resultsObject = new IndexedResultsObject();
                request.onsuccess = function (e) {
                    if (e.target.result) {
                        resultsObject.addResult(e.target.result);
                    }
                    internalResultsHandler(trans, resultsObject);
                };
                request.onerror = errorHandler;
            },
            args: [id],
            resultsHandler: spec.resultsHandler,
            successHandler: spec.successHandler,
            errorHandler: spec.errorHandler,
            errorText: 'Retrieve from message table failed',
            isInsert: false,
            summary: false
        };
        executeTransaction(retrieveMessageSpec);
    };
    var updateMessageToSent = function (db, params, spec) {
        var updateMessageToSentSpec = {
            database: db,
            transaction: spec.transaction,
            sql: UPDATE_MESSAGE_TO_SENT_BY_ID_SQL,
            command: function (internalResultsHandler, errorHandler) {
                var trans = activeDatabase.transaction(["_message"], "readwrite");
                var store = trans.objectStore("_message");
                var keyRange = IDBKeyRange.only(params.id);
                var cursorRequest = store.openCursor(keyRange);
                cursorRequest.onsuccess = function (e) {
                    var result = e.target.result;
                    if (!!result == false) {
                        errorHandler(null, null, 'No such message');
                        return;
                    }
                    result.value.state = params.state;
                    result.value.timeout = params.timeout;
                    var updateRequest = result.update(result.value);
                    updateRequest.onerror = errorHandler;
                };
                cursorRequest.onerror = errorHandler;
            },
            args: [params.state, params.timeout, params.id],
            resultsHandler: spec.resultsHandler,
            successHandler: spec.successHandler,
            errorHandler: spec.errorHandler,
            errorText: 'Retrieve from message table failed',
            isInsert: false,
            summary: false
        };
        executeTransaction(updateMessageToSentSpec);
    };
    var deleteMessage = function (db, id, spec) {
        var deleteMessageSpec = {
            database: db,
            transaction: spec.transaction,
            sql: DELETE_MESSAGE_BY_ID_SQL,
            command: function (internalResultsHandler, errorHandler) {
                var trans = activeDatabase.transaction(["_message"], "readwrite");
                var store = trans.objectStore("_message");
                var request = store.delete(id);
                var resultsObject = new IndexedResultsObject();
                request.onsuccess = function () {
                    resultsObject.rowsAffected = 1;
                    internalResultsHandler(trans, resultsObject);
                };
                request.onerror = errorHandler;
            },
            args: [id],
            resultsHandler: spec.resultsHandler,
            successHandler: spec.successHandler,
            errorHandler: spec.errorHandler,
            errorText: 'Delete from message table failed',
            isInsert: false,
            summary: false
        };
        executeTransaction(deleteMessageSpec);
    };
    var deleteMessageQueue = function (db, spec) {
        function waitForDbReady() {
            if (activeDatabase === null) {
                setTimeout(waitForDbReady, 50);
                return;
            }
            var deleteMessageQueueSpec = {
                database: db,
                transaction: spec.transaction,
                sql: DELETE_MESSAGE_QUEUE_SQL,
                command: function (internalResultsHandler, errorHandler) {
                    var trans = activeDatabase.transaction(["_message"], "readwrite");
                    var store = trans.objectStore("_message");
                    var request = store.clear();
                    request.onsuccess = function () {
                        spec.successHandler();
                    };
                    request.onerror = errorHandler;
                },
                args: [],
                resultsHandler: spec.resultsHandler,
                successHandler: spec.successHandler,
                errorHandler: spec.errorHandler,
                errorText: 'Delete from Message Queeue table failed',
                isInsert: false,
                summary: false
            };
            executeTransaction(deleteMessageQueueSpec);
        };
        waitForDbReady();
    };
    var getAllPendingMessages = function (db, spec) {
        var getAllPendingMessagesSpec = {
            database: db,
            transaction: spec.transaction,
            sql: GET_ALL_PENDING_MESSAGES,
            command: function (internalResultsHandler, errorHandler) {
                var trans = activeDatabase.transaction(["_message"], "readonly");
                var store = trans.objectStore("_message");
                var resultsObject = new IndexedResultsObject();
                var cursorRequest = store.openCursor();
                cursorRequest.onsuccess = function (e) {
                    var result = e.target.result;
                    if (!!result == false) {
                        internalResultsHandler(trans, resultsObject);
                        return;
                    }
                    resultsObject.addResult(result.value);
                    result.continue();
                };
                cursorRequest.onerror = errorHandler;
            },
            args: [],
            resultsHandler: spec.resultsHandler,
            successHandler: spec.successHandler,
            errorHandler: spec.errorHandler,
            errorText: 'Select next outbound message failed',
            isInsert: false,
            summary: true
        };
        executeTransaction(getAllPendingMessagesSpec);
    };
    var that = {};
    database = mainSpec.database;
    createMessageTable(database, mainSpec.errorHandler, mainSpec.successHandler);
    that.getAllPendingMessages = function (spec) {
        getAllPendingMessages(database, spec);
    };
    that.insertMessage = function (message, spec) {
        insertMessage(database, message, spec);
    };
    that.deleteMessage = function (id, spec) {
        deleteMessage(database, id, spec);
    };
    that.retrieveMessage = function (id, spec) {
        retrieveMessage(database, id, spec);
    };
    that.updateMessageToSent = function (params, spec) {
        updateMessageToSent(database, params, spec);
    };
    that.deleteMessageQueue = function (spec) {
        deleteMessageQueue(database, spec);
    };
    return that;
};
var MESSAGE_TYPE = {
    CONNECT_REQUEST: 'connect-request',
    CONNECT_SUCCESS: 'connect-success',
    CONNECT_FAILURE: 'connect-failure',
    DISCONNECT_REQUEST: 'disconnect-request',
    UNSOLICITED_DATA: 'unsolicited-data',
    NOTICE: 'notice'
};
var CONNECTION_STATE = {
    DISCONNECTED: 0,
    CONNECTING_PART1: 1,
    CONNECTING_PART2: 2,
    CONNECTED: 3,
    DISCONNECTING: 4
};
var IWebSocketMessenger = {
    connect: function () { },
    disconnect: function () { },
    sendMessage: function () { },
    isGSB: function () { },
    isConnected: function () { },
    messageInProgress: function () { }
};
var WebSocketMessenger = function (mainSpec, logger, messengerConfig) {
    if (!("WebSocket" in window)) {
        throw {
            name: "FeatureNotSupported",
            message: "WebSockets not supported by this browser"
        };
    }
    this.websocket = null;
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.isGsb = true;
    this.connectTimer = null;
    this.disconnectTimer = null;
    this.xhrConnectTimer = null;
    this.outstandingMessage = null;
    this.messengerLogger = logger;
    this.messengerConfig = messengerConfig;
    this.webSocketBaseUrl = mainSpec.url;
    this.httpCapUrl = mainSpec.httpCapUrl;
    this.messageCallback = mainSpec.messageCallback;
    this.disconnectCallback = mainSpec.disconnectCallback;
    this.appId = mainSpec.appId;
    this.appVersion = mainSpec.appVersion;
    this.userId = mainSpec.userId;
    this.password = mainSpec.password;
    this.deviceId = mainSpec.deviceId;
    this.defaultMode = mainSpec.defaultMode;
    this.handleUnsolicitedDataMessage = function (unsolicitedMessage) {
        var that = this;
        if (that.messageCallback) {
            that.messageCallback(unsolicitedMessage['data-message-type'], unsolicitedMessage['data-message-params']);
        }
        var notice = {
            'message-type': MESSAGE_TYPE.NOTICE,
            'app-id': unsolicitedMessage['app-id'],
            'app-version': unsolicitedMessage['app-version'],
            'notice-type': 'ack',
            'id': unsolicitedMessage['id']
        };
        var textMessage = JSON.stringify(notice);
        that.websocket.send(textMessage);
        that.messengerLogger.info("MESSAGE SENT:" + textMessage);
    };
    this.handleNoticeMessage = function (noticeMessage) {
        var that = this;
        if (!that.outstandingMessage || that.outstandingMessage.id !== noticeMessage['id']) {
            return;
        }
        if (that.outstandingMessage.timer) {
            clearTimeout(that.outstandingMessage.timer);
            that.outstandingMessage.timer = null;
        }
        var noticeType = noticeMessage['notice-type'];
        var callbackSuccess = that.outstandingMessage['success'];
        var callbackFailure = that.outstandingMessage['failure'];
        that.outstandingMessage = null;
        switch (noticeType) {
            case 'ack':
                if (callbackSuccess) {
                    callbackSuccess();
                }
                break;
            case 'nack':
                if (callbackFailure) {
                    callbackFailure(noticeMessage['data']);
                }
                break;
            default:
                if (callbackFailure) {
                    callbackFailure('Invalid notice type ' + noticeType);
                }
                break;
        }
    };
    this.handleDisconnectRequestMessage = function () {
        var that = this;
        that.connectionState = CONNECTION_STATE.DISCONNECTING;
        if (that.disconnectCallback) {
            that.disconnectCallback(that);
            that.messageCallback = null;
            that.disconnectCallback = null;
        }
        that.disconnectTimer = setTimeout(function () {
            if (that.connectionState !== CONNECTION_STATE.DISCONNECTED) {
                that.connectionState = CONNECTION_STATE.DISCONNECTED;
                that.websocket.close();
            }
        }, 10000);
    };
    this.messageReceived = function (event) {
        var that = this;
        var message = JSON.parse(event.data);
        switch (message['message-type']) {
            case 'unsolicited-data':
                that.handleUnsolicitedDataMessage(message);
                break;
            case 'notice':
                that.handleNoticeMessage(message);
                break;
            case MESSAGE_TYPE.DISCONNECT_REQUEST:
                that.handleDisconnectRequestMessage();
                break;
        }
    };
    this.getWebSocketURL = function (baseURL, uid, pwd) {
        if (!baseURL) {
            throw new Error("base URL must be specified");
        }
        var that = this;
        var url = baseURL;
        var urlParams = {};
        // Add application-id, if needed.
        if (baseURL.indexOf("application-id=") === -1) {
            urlParams["application-id"] = that.appId;
        }
        // Add credentials and auth scheme, if needed.
        if (pwd && pwd !== that.messengerConfig.password) {
            // Warn about security issue if not using WSS.
            if (baseURL.indexOf("wss") !== 0) {
                that.messengerLogger.warn("The connection type is not secure WebSocket, the credentials will not be secured.");
            }
            // Add scheme.
            urlParams["scheme"] = "URLBasic";
            // Encode and add credentials.
            urlParams["credentials"] = encodeURIComponent(btoa(uid + ":" + pwd));
        }
        // Append all params.
        if (url.indexOf("?") !== -1) {
            url += "&";
        } else {
            url += "?";
        }
        for (var key in urlParams) {
            url += key + "=" + urlParams[key] + "&";
        }
        if (url[url.length - 1] === "&") {
            url = url.substr(0, url.length - 1);
        }
        return url;
    };
    this.getHTTPCAPLoginEndpoint = function (baseURL, uid, pwd) {
        var that = this;
        var url = baseURL;
        if (url.indexOf("/login") === -1) {
            if (url[url.length - 1] !== "/") {
                url += "/";
            }
            url += "login";
        }
        return that.getWebSocketURL(url, uid, pwd);
    };
};
WebSocketMessenger.prototype = Object.create(IWebSocketMessenger);
WebSocketMessenger.prototype.connect = function (spec) {
    var that = this;
    if (that.websocket !== null) {
        alert('throwing exception - Web Socket Messenger already initialized');
        throw {
            name: "IllegalState",
            message: "Web Socket Messenger already initialized"
        };
    }
    that.messengerLogger.debug('Connecting to: ' + that.webSocketBaseUrl);
    var completeWebSocketUrl = that.getWebSocketURL(that.webSocketBaseUrl, that.userId, that.password);
    var protocols = ['com.antennasoftware.device.protocol.amp2-json', 'com.antennasoftware.device.protocol.gsb-json'];
    that.websocket = new WebSocket(completeWebSocketUrl, protocols);
    that.connectionState = CONNECTION_STATE.CONNECTING_PART1;
    if (spec.timeoutVal) {
        that.connectTimer = setTimeout(function () {
            if ((that.connectionState === CONNECTION_STATE.CONNECTING_PART1) || (that.connectionState === CONNECTION_STATE.CONNECTING_PART2)) {
                that.messengerLogger.debug('Disconnect due to connect timeout');
                that.websocket.close();
                if (spec.timeout) {
                    spec.timeout(that);
                    that.callback = null;
                }
            }
        }, spec.timeoutVal * 1000);
    }
    that.websocket.onopen = function () {
        messengerLogger.debug("WebSocket 'onopen' callback.");
        if (that.connectionState === CONNECTION_STATE.CONNECTING_PART1) {
            if (that.websocket.protocol === 'com.antennasoftware.device.protocol.amp2-json') {
                that.isGsb = false;
            } else if (that.websocket.protocol === 'com.antennasoftware.device.protocol.gsb-json') {
                that.isGsb = true;
            } else {
                that.messengerLogger.warn('Could not determine the protocol, will try to use defaultMode param (=' + that.defaultMode + ')...');
                if (that.defaultMode === 'amp2') {
                    that.messengerLogger.warn('...using AMP2 mode.');
                    that.isGsb = false;
                } else {
                    that.messengerLogger.warn('...using GSB mode.');
                    that.isGsb = true;
                }
            }
            var handshake = {
                'message-type': MESSAGE_TYPE.CONNECT_REQUEST,
                'user-id': that.userId,
                'device-id': that.deviceId,
                'app-id': that.appId,
                'app-version': that.appVersion
            };
            that.connectionState = CONNECTION_STATE.CONNECTING_PART2;
            var message = JSON.stringify(handshake);
            that.websocket.send(message);
            that.messengerLogger.info('MESSAGE SENT: ' + message);
            //alert('handshake sent');
        }
        else if (that.connectionState !== CONNECTION_STATE.DISCONNECTED) {
            that.websocket.close();
        }
    };
    that.websocket.onclose = function (closeEvent) {
        that.messengerLogger.info("Close = " + closeEvent.wasClean + ", code=" + closeEvent.code + ", reason=" + closeEvent.reason);
        if (that.disconnectTimer) {
            clearTimeout(that.disconnectTimer);
            that.disconnectTimer = null;
        }
        if ((that.connectionState === CONNECTION_STATE.CONNECTING_PART1) || (that.connectionState === CONNECTION_STATE.CONNECTING_PART2)) {
            that.connectionState = CONNECTION_STATE.DISCONNECTED;
            if (that.connectTimer) {
                clearTimeout(that.connectTimer);
                that.connectTimer = null;
            }
            if (!that.httpCapUrl) {
                that.messengerLogger.warn("Cannot check websocket close reason due to missing HTTP CAP URL.");
                if (spec.failure) {
                    spec.failure(that, 0);
                }
                return;
            }
            var xhr = new XMLHttpRequest();
            that.xhrConnectTimer = setTimeout(function() {
                that.messengerLogger.warn("XHR request for checking websocket close reason has timeouted");
                spec.failure(that, -3);
            }, 10000);
            xhr.open('GET', that.getHTTPCAPLoginEndpoint(that.httpCapUrl, that.userId, that.password), false);
            xhr.onreadystatechange = function () {
                if (this.readyState !== this.DONE) {
                    return;
                }
                if (that.xhrConnectTimer) {
                    clearTimeout(that.xhrConnectTimer);
                    that.xhrConnectTimer = null;
                }
                if (this.status !== 200 && spec.failure) {
                    var info = {};
                    if (this.status === 403) {
                        info.code = xhr.getResponseHeader("Chroma-Auth-Error-Code");
                        info.message = xhr.responseText;
                    }
                    spec.failure(that, this.status, info);
                }
            };
            xhr.send();
        } else {
            that.connectionState = CONNECTION_STATE.DISCONNECTED;
            if (that.disconnectCallback) {
                that.disconnectCallback(that);
            }
        }
    };
    that.websocket.onmessage = function (event) {
        that.messengerLogger.info('MESSAGE RECEIVED: ' + event.data);
        if (that.connectionState === CONNECTION_STATE.CONNECTING_PART2) {
            if (that.connectTimer) {
                clearTimeout(that.connectTimer);
                that.connectTimer = null;
            }
            var message = JSON.parse(event.data);
            var messageType = message['message-type'];
            if (messageType !== null) {
                if (messageType === 'connect-success') {
                    that.connectionState = CONNECTION_STATE.CONNECTED;
                    if (spec.success) {
                        spec.success(that);
                    }
                }
                else if (messageType === 'connect-failure') {
                    if (spec.failure) {
                        spec.failure(that, message['data']);
                    }
                    that.callback = null;
                    that.disconnect();
                }
                else {
                    if (spec.failure) {
                        spec.failure(that, 'Unexpected message received = ' + message);
                    }
                    that.callback = null;
                    that.disconnect();
                }
            }
        }
        else if (that.connectionState === CONNECTION_STATE.CONNECTED) {
            that.messageReceived(event);
        }
        else {
            that.messengerLogger.warn('Unexpected message received while in state ' + that.connectionState + '] message = ' + event.data);
        }
    };
};
WebSocketMessenger.prototype.disconnect = function () {
    var that = this;
    that.messageCallback = null;
    that.disconnectCallback = null;
    if (that.connectionState === CONNECTION_STATE.CONNECTED) {
        var disconnectMsg = {
            'message-type': MESSAGE_TYPE.DISCONNECT_REQUEST,
            'app-id': that.appId,
            'app-version': that.appVersion
        };
        that.connectionState = CONNECTION_STATE.DISCONNECTING;
        that.websocket.send(JSON.stringify(disconnectMsg));
        that.disconnectTimer = setTimeout(function () {
            if (that.connectionState !== CONNECTION_STATE.DISCONNECTED) {
                that.connectionState = CONNECTION_STATE.DISCONNECTED;
                that.websocket.close();
            }
        }, 10000);
    }
    else if ((that.connectionState === CONNECTION_STATE.CONNECTING_PART1)
        || (that.connectionState === CONNECTION_STATE.CONNECTING_PART2)) {
        that.connectionState = CONNECTION_STATE.DISCONNECTED;
        that.websocket.close();
    }
};
WebSocketMessenger.prototype.sendMessage = function (messageType, message, spec) {
    var that = this;
    that.messengerLogger.debug("Trying to send message ...");
    if (that.websocket === null) {
        throw {
            name: "IllegalState",
            message: "Web Socket Messenger not initialized"
        };
    }
    var unsolicitedData = {
        'message-type': MESSAGE_TYPE.UNSOLICITED_DATA,
        'app-id': that.appId,
        'app-version': that.appVersion,
        'data-message-type': messageType,
        'id': new Date().getTime() + '',
        'data-message-params': message
    };
    that.outstandingMessage = {
        id: unsolicitedData['id']
    };
    if (spec) {
        that.outstandingMessage.success = spec['success'];
        that.outstandingMessage.failure = spec['failure'];
        that.outstandingMessage.timeout = spec['timeout'];
        if (spec.timeoutVal) {
            var currentId = that.outstandingMessage.id;
            that.outstandingMessage.timer = setTimeout(function () {
                if (that.outstandingMessage) {
                    if (that.outstandingMessage.id === currentId) {
                        // OK it is a timeout
                        var timeoutFunction = that.outstandingMessage.timeout;
                        that.outstandingMessage = null;
                        if (spec.timeout) {
                            timeoutFunction();
                        }
                    }
                    else {
                        that.messengerLogger.warn('Invalid message timeout for id: ' + currentId);
                    }
                }
                else {
                    that.messengerLogger.warn('Invalid message timeout for id:' + currentId);
                }
            }, spec.timeoutVal * 1000);
        }
    }
    var textMessage = JSON.stringify(unsolicitedData);
    that.websocket.send(textMessage);
    that.messengerLogger.info('MESSAGE SENT:' + textMessage);
};
WebSocketMessenger.prototype.isGSB = function () {
    return this.isGsb;
};
WebSocketMessenger.prototype.isConnected = function () {
    return this.connectionState === CONNECTION_STATE.CONNECTED;
};
WebSocketMessenger.prototype.messageInProgress = function () {
    return (this.outstandingMessage !== null);
};
var MESSAGE_STATE = {
    QUEUED: 2,
    SENT: 3,
    FAILED: 4
};
var RECEIVED_MESSAGE_DETAIL = {
    RESPONSE_NOT_MATCHING_ANY_REQUEST: 1
};
var MessageList = {
    addMessage: function (message) { },
    hasMessagesToSend: function () { },
    getNextMessageToBeSent: function () { },
    setMessageSent: function () { },
    setMessageFailed: function () { },
    getMessageByReference: function (ref) { },
    getNextTimeout: function () { },
    getNextRemoveExpiredMessagesTimeout: function () { },
    getTimedOutMessages: function () { },
    getFailedMessages: function () { },
    getExpiredMessages: function () { },
    deleteMessage: function (id) { },
};
var PendingMessageList = function (internalMessages, onScheduleExpiredMessagesRemoval, messengerLogger) {
    this.pendingMessages = {};
    this.messagesToBeSent = [];
    this.messengerLogger = messengerLogger;
    for (var i = 0; i < internalMessages.length; i++) {
        var currentMessage = internalMessages[i];
        if (currentMessage.state === MESSAGE_STATE.QUEUED) {
            this.messagesToBeSent.push(currentMessage);
        }
        this.pendingMessages[currentMessage.id] = currentMessage;
    }
    var nextTimeout = this.getNextRemoveExpiredMessagesTimeout();
    if (nextTimeout !== null) {
        onScheduleExpiredMessagesRemoval(nextTimeout - (new Date()).getTime());
    }
    if (this.messagesToBeSent.length > 1) {
        // sort it
        this.messagesToBeSent.sort(function (msg1, msg2) {
            var k1 = msg1["created"], k2 = msg2["created"];
            return (k1 > k2) ? 1 : ((k2 > k1) ? -1 : 0);
        });
    }
};
PendingMessageList.prototype = Object.create(MessageList);
PendingMessageList.prototype.addMessage = function (message) {
    this.messagesToBeSent.push(message);
    this.pendingMessages[message.id] = message;
};
PendingMessageList.prototype.getTimedOutMessages = function () {
    var timedOutMessages = [];
    var currentTime = new Date().getTime();
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var currentMessage = this.pendingMessages[msgId];
            if (currentMessage.state === MESSAGE_STATE.SENT) {
                if (currentMessage.timeout <= currentTime) {
                    timedOutMessages.push(currentMessage);
                    this.deleteMessage(msgId);
                }
            }
        }
    }
    return timedOutMessages;
};
PendingMessageList.prototype.getFailedMessages = function () {
    var failedMessages = [];
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var currentMessage = this.pendingMessages[msgId];
            if (currentMessage.state === MESSAGE_STATE.FAILED) {
                failedMessages.push(currentMessage);
                this.deleteMessage(msgId);
            }
        }
    }
    return failedMessages;
};
PendingMessageList.prototype.getExpiredMessages = function () {
    var expiredMessages = [];
    var currentTime = new Date().getTime();
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var currentMessage = this.pendingMessages[msgId];
            if (currentMessage.expires != null && currentMessage.expires <= currentTime) {
                expiredMessages.push(currentMessage);
                this.deleteMessage(msgId);
            }
        }
    }
    return expiredMessages;
};
PendingMessageList.prototype.hasMessagesToSend = function () {
    return (this.messagesToBeSent.length > 0);
};
PendingMessageList.prototype.getNextMessageToBeSent = function () {
    if (this.messagesToBeSent.length === 0) {
        return null;
    }
    return this.messagesToBeSent[0];
};
PendingMessageList.prototype.setMessageSent = function () {
    var currentMessage = this.messagesToBeSent.shift();
    this.pendingMessages[currentMessage.id].state = MESSAGE_STATE.SENT;
    if (currentMessage.msgRecvTimeout > 0) {
        this.pendingMessages[currentMessage.id].timeout = (new Date()).getTime() + currentMessage.msgRecvTimeout * 1000;
        this.messengerLogger.debug('Setting timeout for message with id ' + currentMessage.id + ' to ' + this.pendingMessages[currentMessage.id].timeout);
        return this.pendingMessages[currentMessage.id].timeout;
    }
    return null;
};
PendingMessageList.prototype.setMessageFailed = function () {
    var currentMessage = this.messagesToBeSent.shift();
    this.pendingMessages[currentMessage.id].state = MESSAGE_STATE.FAILED;
};
PendingMessageList.prototype.getNextTimeout = function () {
    var timeout = null;
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var currentMessage = this.pendingMessages[msgId];
            if (currentMessage.state === MESSAGE_STATE.SENT) {
                if (timeout === null || currentMessage.timeout < timeout) {
                    timeout = currentMessage.timeout;
                }
            }
        }
    }
    return timeout;
};
PendingMessageList.prototype.getNextRemoveExpiredMessagesTimeout = function () {
    var timeout = null;
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var expires = this.pendingMessages[msgId].expires;
            if (timeout === null || expires != null && expires < timeout) {
                timeout = expires;
            }
        }
    }
    return timeout;
};
PendingMessageList.prototype.getMessageByReference = function (ref) {
    for (var msgId in this.pendingMessages) {
        if (this.pendingMessages.hasOwnProperty(msgId)) {
            var currentMessage = this.pendingMessages[msgId];
            if (currentMessage.reference === ref) {
                return currentMessage;
            }
        }
    }
    return null;
};
PendingMessageList.prototype.deleteMessage = function (id) {
    var messageToDelete = this.pendingMessages[id];
    if (messageToDelete != null) {
        delete this.pendingMessages[id];
        if (messageToDelete.state === MESSAGE_STATE.QUEUED) {
            for (var j = 0; j < this.messagesToBeSent.length; j++) {
                if (this.messagesToBeSent[j].id === id) {
                    this.messagesToBeSent.splice(j, 1);
                    return;
                }
            }
        }
    }
};
var IMessenger = {
    RegisterMessageReceiveHandler: function (handler) { },
    RegisterConnectionStatusHandler: function (handler) { },
    EnableMessaging: function (enable, updateParamsSpec) { },
    QueueMessage: function (message) { },
    disconnect: function () { },
    systemDB: function () { },
    wipeMessanger: function () { },
    IsGSB: function () { }
};
var Messenger = function (mainSpec) {
    this.CREF_COUNTER = "comm.reference_id";
    this.connectFailureCalled = false;
    this.webSocketUrl = null;
    this.webSocketMessenger = null;
    this.messagingEnabled = false;
    this.userId = null;
    this.password = null;
    this.deviceId = null;
    this.messageDao = null;
    this.messageList = null;
    this.messageReceivedHandler = null;
    this.notificationHandler = null;
    this.connectionStatusHandler = null;
    this.nextProcessMessageQueueTimeoutTime = null;
    this.nextProcessQueueTimeout = null;
    this.nextRemoveExpiredMessagesTimeout = null;
    this.nextRemoveExpiredMessagesTimeoutTime = null;
    this.isGSB = null;
    this.defaultMode = null;
    this.httpCapUrl = null;
    this.reference = null;
    this.reconnectTimeout = null;
    this.appId = mainSpec.appId;
    this.appVersion = mainSpec.appVersion;
    this.systemDatabase = mainSpec.systemDB;
    this.int2hex3 = function (intValue) {
        var hex = intValue.toString(36).toUpperCase();
        return '00'.substring(0, 2 - hex.length) + hex;
    };
    this.incrementReference = function () {
        var that = this;
        that.reference = that.reference >= 1295 ? 0x001 : that.reference + 1;
        that.systemDatabase.cfgSet(that.CREF_COUNTER, this.int2hex3(that.reference));
    };
    this.connectionStatusChanged = function (newState, statusCode, userInfo) {
        var that = this;
        messengerLogger.debug("Messenger connection status changed, state : " + newState + " , status code : " + statusCode);
        if (that.connectionStatusHandler) {
            setTimeout(function () {
                that.connectionStatusHandler(newState, statusCode, userInfo);
            }, 0);
        }
    };
    this.purgeMessages = function (messages, cause) {
        var that = this;
        if (messages.length <= 0) {
            return;
        }
        var retrieveMessageResultsHandler = function (transaction, retrieveResult) {
            if (retrieveResult.length !== 1) {
                return;
            }
            var innerSpec = {
                transaction: transaction,
                resultsHandler: function (tx, deleteResult, rowsAffected) {
                    if (rowsAffected !== 1) {
                        messengerLogger.warn("Could not find message to delete");
                    }
                },
                successHandler: null,
                errorHandler: function () {
                    messengerLogger.warn("Could not delete message");
                }
            };
            if (that.notificationHandler) {
                setTimeout(
                    function () {
                        that.notificationHandler(
                        {
                            originalPayload: retrieveResult[0].originalPayload,
                            data: cause,
                            userAttributes: retrieveResult[0].userAttributes
                        }, "nack", "opc");
                    }, 0); // application should process these asynchronously
            }
            that.messageDao.deleteMessage(retrieveResult[0].id, innerSpec);
        };
        var retrieveMessageSpec = {
            transaction: null,
            resultsHandler: retrieveMessageResultsHandler,
            successHandler: null,
            errorHandler: function () {
                messengerLogger.warn("Error retrieving message");
            }
        };
        for (var i = 0; i < messages.length; i++) {
            that.messageList.deleteMessage(messages[i].id);
            that.messageDao.retrieveMessage(messages[i].id, retrieveMessageSpec);
        }
    };
    this.removeExpiredMessages = function () {
        var that = this;
        messengerLogger.debug('removeExpiredMessages called - current time = ' + new Date().getTime());
        if (that.nextRemoveExpiredMessagesTimeoutTime > new Date().getTime()) {
            // need that because of a broken js timeouts
            that.scheduleRemoveExpiredMessages(50);
            return;
        }
        that.nextRemoveExpiredMessagesTimeoutTime = null;
        that.purgeMessages(that.messageList.getExpiredMessages(), 'message expired');
        var nextTimeout = that.messageList.getNextRemoveExpiredMessagesTimeout();
        if (nextTimeout !== null) {
            that.scheduleRemoveExpiredMessages(nextTimeout - new Date().getTime());
        }
    };
    this.processMessageQueue = function () {
        var that = this;
        messengerLogger.debug('processMessageQueue called - current time = ' + new Date().getTime());
        that.nextProcessMessageQueueTimeoutTime = null;
        that.nextProcessQueueTimeout = null;
        if (that.webSocketMessenger === null || !that.webSocketMessenger.isConnected()) {
            messengerLogger.warn('Not connected');
            return;
        }
        that.purgeMessages(that.messageList.getFailedMessages(), 'message failed');
        that.purgeMessages(that.messageList.getTimedOutMessages(), 'message timed out');
        if (!that.webSocketMessenger.messageInProgress() && that.messageList.hasMessagesToSend()) {
            messengerLogger.debug('Message ready to be sent');
            var messageToBeSent = that.messageList.getNextMessageToBeSent();
            var retrieveSpec = {
                transaction: null,
                success: null,
                resultsHandler: function (transaction, retrieveResult) {
                    if (retrieveResult.length === 0) {
                        messengerLogger.warn("Could not find message to send for id: " + messageToBeSent.id);
                        return;
                    }
                    if (retrieveResult.length > 1) {
                        messengerLogger.error("retrieveMessage returned more than one result which should never happen");
                        return;
                    }
                    if (that.webSocketMessenger === null || !that.webSocketMessenger.isConnected()) {
                        messengerLogger.warn('Not connected');
                        return;
                    }
                    if (that.webSocketMessenger.messageInProgress()) {
                        messengerLogger.debug("Another message just got sent. Delay sending this message");
                        return;
                    }
                    var ecMessage = {
                        reference: messageToBeSent.reference,
                        correlation: messageToBeSent.correlation,
                        type: 'data',
                        data: retrieveResult[0].originalPayload
                    };
                    var messageType = 'ECDataMessage';
                    var operation = messageToBeSent.operation;
                    if (that.isGSB()) {
                        ecMessage.operation = operation;
                    } else {
                        ecMessage.host = messageToBeSent.host;
                        messageType = 'AMP2DataMessage';
                        if (operation) {
                            var prefix = '<' + operation + '><CONTENT>';
                            var postfix = '</CONTENT></' + operation + '>';
                            ecMessage.data = prefix + ecMessage.data + postfix;
                        }
                    }
                    var sendMessageSpec = {
                        success: function () {
                            var nextMessage = that.messageList.getNextMessageToBeSent();
                            if (nextMessage != null && nextMessage.id === messageToBeSent.id) {
                                var newTimeout = that.messageList.setMessageSent();
                                var updateMessageSpec = {
                                    transaction: null,
                                    success: null,
                                    resultsHandler: null,
                                    failure: function () {
                                        messengerLogger.warn('failed to update message');
                                    }
                                };
                                that.messageDao.updateMessageToSent({
                                    state: MESSAGE_STATE.SENT,
                                    timeout: newTimeout,
                                    id: messageToBeSent.id
                                }, updateMessageSpec);
                            } else {
                                messengerLogger.warn('Massage with id=' + messageToBeSent.id + ' has been already marked as sent');
                            }
                            if (that.messageList.hasMessagesToSend()) {
                                that.scheduleProcessMessageQueueNow();
                                return;
                            }
                            var nextMsgTimeout = that.messageList.getNextTimeout();
                            if (nextMsgTimeout !== null) {
                                that.scheduleProcessMessageQueue(nextMsgTimeout - (new Date()).getTime());
                            }
                        },
                        failure: function () {
                            messengerLogger.warn('Send message failed');
                            var nextMessage = that.messageList.getNextMessageToBeSent();
                            if (nextMessage != null && nextMessage.id === messageToBeSent.id) {
                                that.messageList.setMessageFailed();
                                var updateMessageSpec = {
                                    transaction: null,
                                    success: null,
                                    resultsHandler: null,
                                    failure: function () {
                                        messengerLogger.warn('failed to update message');
                                    }
                                };
                                that.messageDao.updateMessageToSent({
                                    state: MESSAGE_STATE.FAILED,
                                    timeout: null,
                                    id: messageToBeSent.id
                                }, updateMessageSpec);
                            } else {
                                messengerLogger.warn('Massage with id=' + messageToBeSent.id + ' has been already marked as sent');
                            }
                            // schedule queue process in order remove failed messages.
                            that.scheduleProcessMessageQueue(0);
                        },
                        timeout: function () {
                            messengerLogger.warn('Message timed out');
                            // update connection state
                            that.onDisconnected(that.webSocketMessenger);
                        },
                        timeoutVal: messageToBeSent.msgAckTimeout
                    };
                    if (ecMessage.correlation === null) {
                        delete ecMessage.correlation;
                    }
                    that.webSocketMessenger.sendMessage(messageType, ecMessage, sendMessageSpec);
                },
                failure: function () {
                    messengerLogger.warn('Database error - Retrieve failed');
                }
            };
            that.messageDao.retrieveMessage(messageToBeSent.id, retrieveSpec);
        }
        var nextTimeout = that.messageList.getNextTimeout();
        if (nextTimeout !== null) {
            that.scheduleProcessMessageQueue(nextTimeout - (new Date()).getTime());
        }
    };
    this.parseAMP2Data = function (xmlString) {
        var result = { data: xmlString, operation: null };
        var xmlDoc = (new DOMParser()).parseFromString(xmlString, "text/xml");
        var operationNode = xmlDoc.firstChild;
        if (operationNode) {
            result.operation = operationNode.nodeName;
            if (result.operation) {
                var contentNode = operationNode.firstChild;
                if (contentNode && contentNode.nodeName == 'CONTENT') {
                    var startPos = result.operation.length + 'CONTENT'.length + 4;
                    var endPos = xmlString.length - (startPos + 2);
                    result.data = xmlString.substring(startPos, endPos);
                }
            }
        }
        return result;
    };
    this.parseAMP2Message = function (message) {
        var that = this;
        var amp2Data = that.parseAMP2Data(message.data);
        message.data = amp2Data.data;
        message.operation = amp2Data.operation;
    };
    this.messageReceived = function (messageType, message) {
        var that = this;
        if (that.isGSB() && messageType == 'AMP2DataMessage' || !that.isGSB() && messageType == 'ECDataMessage') {
            messengerLogger.warn('Unexpected message type received: ' + messageType);
            return;
        }
        if (!message.correlation) {
            if (that.messageReceivedHandler) {
                if (!that.isGSB()) {
                    that.parseAMP2Message(message);
                }
                setTimeout(function () {
                    that.messageReceivedHandler({
                        hostAddress: message.host,
                        reference: message.reference,
                        operation: message.operation,
                        originalPayload: message.data
                    });
                }, 0);
            }
            return;
        }
        var messageData = that.messageList.getMessageByReference(message.correlation);
        if (!messageData) {
            messengerLogger.warn('Cannot find request for response: ' + message.correlation);
            if (!that.isGSB()) {
                that.parseAMP2Message(message);
            }
            var receivedMsg = {
                hostAddress: message.host,
                reference: message.reference,
                operation: message.operation,
                originalPayload: message.data
            };
            setTimeout(function () {
                that.messageReceivedHandler(receivedMsg, RECEIVED_MESSAGE_DETAIL.RESPONSE_NOT_MATCHING_ANY_REQUEST);
            }, 0);
            return;
        }
        that.messageList.deleteMessage(messageData.id);
        var retrieveResultsHandler = function (transaction, retrieveResult) {
            if (retrieveResult.length !== 1) {
                messengerLogger.warn('Could not find message with message id:' + messageData.id);
                return;
            }
            if (message.type === 'data') {
                if (that.messageReceivedHandler) {
                    if (!that.isGSB()) {
                        that.parseAMP2Message(message);
                    }
                    setTimeout(
                        function () {
                            that.messageReceivedHandler({
                                originalPayload: message.data,
                                hostAddress: message.host,
                                reference: message.reference,
                                operation: message.operation,
                                correlation: message.correlation,
                                userAttributes: retrieveResult[0].userAttributes
                            });
                        }, 0);
                }
            } else {
                if (that.notificationHandler) {
                    if (message.type === 'ack') {
                        that.notificationHandler(
                        {
                            data: message.data,
                            originalPayload: retrieveResult[0].originalPayload,
                            reference: message.reference,
                            userAttributes: retrieveResult[0].userAttributes
                        }, 'ack');
                    } else {
                        that.notificationHandler(
                        {
                            hostAddress: message.host,
                            data: message.data,
                            originalPayload: retrieveResult[0].originalPayload,
                            reference: message.reference,
                            userAttributes: retrieveResult[0].userAttributes
                        }, 'nack');
                    }
                }
            }
            var deleteSpec = {
                resultsHandler: function (tx, deleteResult, rowsAffected) {
                    if (rowsAffected !== 1) {
                        messengerLogger.warn("Could not find message to delete");
                    }
                },
                successHandler: null,
                errorHandler: function (tx, error, description) {
                    messengerLogger.warn("Could not delete message. Error="
                        + error + ", description=" + description);
                }
            };
            that.messageDao.deleteMessage(messageData.id, deleteSpec);
        };
        var retrieveSpec = {
            transaction: null,
            resultsHandler: retrieveResultsHandler,
            successHandler: null,
            errorHandler: function (transaction, error, description) {
                messengerLogger.warn("Could not retrieve message. Error=" + error
                    + ", description=" + description);
            }
        };
        that.messageDao.retrieveMessage(messageData.id, retrieveSpec);
    };
    this.deleteMessageQueue = function () {
        var that = this;
        var deleteSpec = {
            resultsHandler: null,
            successHandler: function () {
                messengerLogger.info("Clear Message Queue.");
            },
            errorHandler: function (transaction, error, description) {
                messengerLogger.warn("Could not clear message queeue. Error="
                + error + ", description=" + description);
            }
        };
        that.messageDao.deleteMessageQueue(deleteSpec);
    };
    this.onConnected = function (currentWebSocketMessenger) {
        var that = this;
        if (that.webSocketMessenger !== currentWebSocketMessenger) {
            messengerLogger.warn('onConnected - Websocket messenger mismatch. Disconnecting other messenger....');
            currentWebSocketMessenger.disconnect();
            return;
        }
        var inGSBMode = that.webSocketMessenger.isGSB();
        that.isGSB = function () {
            return inGSBMode;
        };
        that.connectionStatusChanged('CONNECTED');
        that.scheduleProcessMessageQueueNow();
    };
    
    this.onConnectFailure = function (currentWebSocketMessenger, statusCode, userInfo) {
        messengerLogger.debug("Messenger connection failure with code : " + statusCode + " ...");
        var that = this;
        if (that.connectFailureCalled) {
            messengerLogger.warn("Messenger failure callback already invoked.");
            return;
        }
        that.connectFailureCalled = true;
        if (that.webSocketMessenger !== currentWebSocketMessenger) {
            messengerLogger.warn('onConnectionFailure - Websocket messenger mismatch. Disconnecting other messenger....');
            return;
        }
        that.connectionStatusChanged('DISCONNECTED', statusCode, userInfo);
        that.webSocketMessenger = null;
        if (!that.messagingEnabled) {
            return;
        }
        if (statusCode === 401 || statusCode === 403 || statusCode === -1) {
            messengerLogger.debug("Messenger will not try to automatically schedule reconnect attempt.");
            // avoid reconnecting automatically in case of auth failure or misconfiguration (UC-2751)
            return;
        }
        that.scheduleReconnect();
    };
    this.onDisconnected = function (currentWebSocketMessenger) {
        var that = this;
        if (that.webSocketMessenger !== currentWebSocketMessenger) {
            messengerLogger.warn('onConnectionFailure - Websocket messenger mismatch. Disconnecting other messenger....');
            return;
        }
        that.connectionStatusChanged('DISCONNECTED');
        that.webSocketMessenger = null;
        if (that.messagingEnabled) {
            that.scheduleReconnect();
        }
    };
    this.scheduleReconnect = function () {
        var that = this;
        messengerLogger.debug("Messenger scheduling reconnect in 60s");
        that.clearReconnect();
        that.reconnectTimeout = setTimeout(function () {
            that.connect();
        }, 60000);
    };
    this.clearReconnect = function () {
        var that = this;
        if (that.reconnectTimeout) {
            clearTimeout(that.reconnectTimeout);
            that.reconnectTimeout = undefined;
        }
    };
    this.connect = function () {
        var that = this;
        messengerLogger.debug("Messenger trying to connect ...");
        if (that.messageList === null) {
            messengerLogger.info('Messenger not completely initialized yet. Delaying connect');
            return;
        }
        // Set default user id, if needed.
        if (!that.userId) {
            messengerLogger.debug('User id not provided, using "not_provided".');
            that.userId = "not_provided";
        }
        // Prepare WebSocketMessenger.
        var webSocketMessengerSpec = {
            url: that.webSocketUrl,
            httpCapUrl: that.httpCapUrl,
            messageCallback: function (messageType, message) {
                that.messageReceived(messageType, message);
            },
            disconnectCallback: function (currentWebSocketMessenger) {
                that.onDisconnected(currentWebSocketMessenger);
            },
            userId: that.userId,
            password: that.password,
            deviceId: that.deviceId,
            appId: that.appId,
            appVersion: that.appVersion,
            defaultMode: that.defaultMode
        };
        that.webSocketMessenger = new WebSocketMessenger(webSocketMessengerSpec, messengerLogger, MessengerConfig);
        // Check whether user provided gateway URL and device ID, or we have defaults available.
        that.connectFailureCalled = false;
        if (!that.webSocketUrl) {
            messengerLogger.warn('Connection failure - gateway URL not provided.');
            that.onConnectFailure(that.webSocketMessenger, -1);
            return;
        } else if (that.webSocketUrl.indexOf("ws://") !== 0 && that.webSocketUrl.indexOf("wss://") !== 0) {
            messengerLogger.warn('Connection failure - the URL\'s scheme must be either "ws" or "wss". Given: ' + that.webSocketUrl);
            that.onConnectFailure(that.webSocketMessenger, -1);
            return;
        }
        if (!that.deviceId) {
            messengerLogger.warn('Connection failure - deviceId not available.');
            that.onConnectFailure(that.webSocketMessenger, -1);
            return;
        }
        // Try to connect.
        that.webSocketMessenger.connect({
            success: function (currentWebSocketMessenger) {
                that.onConnected(currentWebSocketMessenger);
            },
            failure: function (currentWebSocketMessenger, statusCode, userInfo) {
                messengerLogger.warn('connection failure with status code ' + statusCode);
                that.onConnectFailure(currentWebSocketMessenger, statusCode, userInfo);
            },
            timeout: function (currentWebSocketMessenger) {
                messengerLogger.warn('connection timeout');
                that.onConnectFailure(currentWebSocketMessenger, -2);
            },
            timeoutVal: 60
        });
        that.connectionStatusChanged('CONNECTING');
    };
    this.scheduleRemoveExpiredMessages = function (delay) {
        if (!(delay > 0)) {
            return;
        }
        var that = this;
        var currentDate = new Date();
        var newNextTimeoutTime = delay + currentDate.getMilliseconds();
        if (that.nextRemoveExpiredMessagesTimeoutTime) {
            if (that.nextRemoveExpiredMessagesTimeoutTime <= newNextTimeoutTime) {
                return;
            }
            messengerLogger.debug('Clearing old remove expired messages timer');
            clearTimeout(that.nextRemoveExpiredMessagesTimeout);
        }
        that.nextRemoveExpiredMessagesTimeoutTime = newNextTimeoutTime;
        messengerLogger.debug('Scheduling message queue search for expired messages for ' + delay + 'ms');
        that.nextRemoveExpiredMessagesTimeout = setTimeout(function () {
            that.removeExpiredMessages();
        }, delay);
    };
    this.scheduleProcessMessageQueue = function (delay) {
        var that = this;
        messengerLogger.debug('Scheduling process message queue for :' + delay + 'ms');
        var currentDate = new Date();
        var newNextProcessQueueTimeoutTime = delay + currentDate.getMilliseconds();
        if (that.nextProcessMessageQueueTimeoutTime) {
            if (that.nextProcessMessageQueueTimeoutTime <= newNextProcessQueueTimeoutTime) {
                return;
            }
            messengerLogger.debug('Clearing old process message queue timer');
            clearTimeout(that.nextProcessQueueTimeout);
        }
        that.nextProcessMessageQueueTimeoutTime = newNextProcessQueueTimeoutTime;
        that.nextProcessQueueTimeout = setTimeout(function () {
            that.processMessageQueue();
        }, delay);
    };
    this.scheduleProcessMessageQueueNow = function () {
        this.scheduleProcessMessageQueue(0);
    };
    this.createMessageDao = function () {
        var that = this;
        var allPendingMessagesSpec = {
            resultsHandler: function (transaction, getPendingMessagesResult) {
                messengerLogger.debug('Initializing pending messages');
                var onScheduleExpiredMessagesRemoval = function (delay) {
                    that.scheduleRemoveExpiredMessages(delay);
                };
                that.messageList = new PendingMessageList(getPendingMessagesResult, onScheduleExpiredMessagesRemoval, messengerLogger);
                if (that.messagingEnabled && (that.webSocketMessenger === null)) {
                    that.connect();
                }
            },
            successHandler: null,
            errorHandler: function () {
            }
        };
        that.messageDao = MessageDAO({
            database: that.systemDatabase.db,
            successHandler: function () {
                that.messageDao.getAllPendingMessages(allPendingMessagesSpec);
            }
        });
    };
};
Messenger.prototype = Object.create(IMessenger);
Messenger.prototype.initialize = function () {
    var that = this;
    var storedReference = that.systemDatabase.cfgGet(that.CREF_COUNTER, null);
    if (storedReference === null || isNaN(storedReference)) {
        that.reference = Math.floor(Math.random() * 1295) + 1;
        that.systemDatabase.cfgSet(that.CREF_COUNTER, that.int2hex3(that.reference));
    } else {
        that.reference = parseInt(storedReference, 16);
    }
    that.createMessageDao();
};
Messenger.prototype.RegisterMessageReceiveHandler = function (handler) {
    this.messageReceivedHandler = handler.handleMessageReceived;
    this.notificationHandler = handler.handleNotification;
};
Messenger.prototype.RegisterConnectionStatusHandler = function (handler) {
    this.connectionStatusHandler = handler;
};
Messenger.prototype.EnableMessaging = function (enable, updatedParamsSpec) {
    var that = this;
    if (that.messagingEnabled === enable) {
        return;
    }
    that.messagingEnabled = enable;
    if (updatedParamsSpec != null) {
        if (updatedParamsSpec.userId) {
            that.userId = updatedParamsSpec.userId;
        } else if (MessengerConfig && MessengerConfig.userId) {
            that.userId = MessengerConfig.userId;
        }
        if (updatedParamsSpec.password) {
            that.password = updatedParamsSpec.password;
        } else if (MessengerConfig && MessengerConfig.password) {
            that.password = MessengerConfig.password;
        }
        if (updatedParamsSpec.deviceId) {
            that.deviceId = updatedParamsSpec.deviceId;
        } else {
            messengerLogger.warn('Device id not provided, will try to use window.launchbox.Container.deviceId...');
            if (window.launchbox && window.launchbox.Container && window.launchbox.Container.deviceId) {
                that.deviceId = window.launchbox.Container.deviceId;
            }
        }
        if (updatedParamsSpec.url) {
            that.webSocketUrl = updatedParamsSpec.url;
        } else if (MessengerConfig && MessengerConfig.url) {
            that.webSocketUrl = MessengerConfig.url;
        }
        if (updatedParamsSpec.httpCapUrl) {
            that.httpCapUrl = updatedParamsSpec.httpCapUrl;
        } else if (MessengerConfig && MessengerConfig.httpCapURL && MessengerConfig.httpCapURL.indexOf("@") != 0) {
            that.httpCapUrl = MessengerConfig.httpCapURL;
        }
        if (updatedParamsSpec.defaultMode) {
            that.defaultMode = updatedParamsSpec.defaultMode;
        }
    }
    if (enable) {
        that.connect();
    } else {
        that.disconnect();
        if (that.nextProcessMessageQueueTimeoutTime) {
            clearTimeout(that.nextProcessQueueTimeout);
            that.nextProcessQueueTimeout = null;
            that.nextProcessMessageQueueTimeoutTime = null;
        }
    }
};
Messenger.prototype.QueueMessage = function (message) {
    var that = this;
    messengerLogger.info('queueMessage: entered');
    message.reference = that.int2hex3(that.reference);
    that.incrementReference();
    message.state = MESSAGE_STATE.QUEUED;
    message.created = new Date().getTime();
    var internalMessage = message;
    var insertMessageSpec = {
        transaction: null,
        resultsHandler: function (transaction, insertResult, rowsAffected, insertId) {
            var expires = internalMessage.msgExpTimeout > 0 ?
                    internalMessage.created + internalMessage.msgExpTimeout * 1000 : null;
            that.messageList.addMessage({
                id: insertId,
                host: internalMessage.hostAddress,
                msgAckTimeout: internalMessage.msgAckTimeout,
                msgRecvTimeout: internalMessage.msgRecvTimeout,
                msgExpTimeout: internalMessage.msgExpTimeout,
                expires: expires,
                state: internalMessage.state,
                timeout: null,
                created: internalMessage.created,
                operation: internalMessage.transaction,
                reference: internalMessage.reference,
                correlation: internalMessage.correlation
            });
            if (expires != null) {
                that.scheduleRemoveExpiredMessages(expires - (new Date()).getTime());
            }
            if ((that.webSocketMessenger !== null) && (!(that.webSocketMessenger.messageInProgress()))) {
                that.scheduleProcessMessageQueueNow();
            }
        },
        successHandler: null,
        errorHandler: function () {
            messengerLogger.warn("Insert message failed");
        }
    };
    that.messageDao.insertMessage(message, insertMessageSpec);
};
Messenger.prototype.disconnect = function () {
    var that = this;
    that.clearReconnect();
    if (that.webSocketMessenger) {
        that.webSocketMessenger.disconnect();
        that.webSocketMessenger = null;
        that.connectionStatusChanged('DISCONNECTED');
    }
};
Messenger.prototype.systemDB = function () {
    return this.systemDatabase;
};
Messenger.prototype.wipeMessanger = function () {
    var that = this;
    that.disconnect();
    clearTimeout(that.nextProcessQueueTimeout);
    clearTimeout(that.nextRemoveExpiredMessagesTimeout);
    that.nextProcessMessageQueueTimeoutTime = null;
    that.nextRemoveExpiredMessagesTimeoutTime = null;
    that.deleteMessageQueue();
};
Messenger.prototype.IsGSB = function () {
    var that = this;
    var rtn;
    function waitForWsmReady() {
        if (that.webSocketMessenger === null) {
            setTimeout(waitForWsmReady, 50);
            return;
        }
        rtn = that.webSocketMessenger.isGSB();
    }
    waitForWsmReady();
    return rtn;
};
(function () {
    var _ready = false;
    var _callback = window.onLaunchboxLoaded;
    Object.defineProperty(window, "onLaunchboxLoaded", {
        get: function () {
            return _callback;
        },
        set: function (callback) {
            _callback = callback;
            // Handle a situation, where function was set after _ready became true.
            if (typeof (callback) === 'function' && _ready === true) {
                setTimeout(callback, 0);
            }
        }
    });
    // Wait for webapp descriptor to be parsed.
    var intervalId = setInterval(function () {
        if(!window.launchbox){
            return;
        }
        if(!window.launchbox.ApplicationManager){
            return;
        }
        if(!window.launchbox.ApplicationManager.self){
            return;
        }
        if(!window.launchbox.ApplicationManager.self.id){
            return;
        }
        _ready = true;
        clearInterval(intervalId);
        if (_callback) {
            setTimeout(_callback, 0);
        }
    }, 500);
    // compatibility layer
    window.webApiReady = true;
})();
var messagingServiceCompatLayer = function() {
    var ResponseSender = function(messageSender) {
        this._messageSender = messageSender;
    };
    ResponseSender.prototype.sendMessage = function(message, timers, callbacks) {
        var wrapper = {
            onResponse: function(msg, messageSender) {
                if (callbacks && callbacks.onResponse) {
                    callbacks.onResponse(msg, new ResponseSender(messageSender));
                }
            },
            onSuccess: function(info) {
                if (callbacks && callbacks.onSuccess) {
                    callbacks.onSuccess(info);
                }
            },
            onFailure: function(type, info) {
                if (callbacks && callbacks.onFailure) {
                    callbacks.onFailure(type, info);
                }
            }
        };
        this._messageSender.send(message, timers, wrapper);
    };
    window.com = window.com || {};
    window.com.antenna = window.com.antenna || {};
    window.com.antenna.api = window.com.antenna.api || {};
    window.com.antenna.api.MessagingService = {
        CONNECTION_STATUS_CONNECTED: 2,
        CONNECTION_STATUS_CONNECTING: 1,
        CONNECTION_STATUS_DISCONNECTED: 0,
        FAILURE_TYPE_INTERNAL: 2,
        FAILURE_TYPE_COMMUNICATION: 1,
        FAILURE_TYPE_APPLICATION: 0,
        _connect: function(config, listener) {
            if (config) {
                window.launchbox.ACF.configure({
                    gatewayURL: config.gatewayUrl,
                    httpCapURL: config.httpCapUrl, // required by web implementation
                    defaultMode: config.defaultMode, // required by web implementation
                    masterConnectionOwner: {
                        id: launchbox.ApplicationManager.self.id,
                        version: launchbox.ApplicationManager.self.versionForAcf
                    }
                });
                window.launchbox.ACF.setCredentials({
                    userId: config.userId,
                    password: config.password,
                    deviceId: config.deviceId
                });
            }
            if (listener) {
                window.launchbox.ACF.addListener({
                    onAuthenticationFailure: function() {
                        // Do nothing, because original implementation did nothing here.
                    },
                    onReceiveFailure: function(failureType, info) {
                        if (listener && listener.onReceiveFailure) {
                            listener.onReceiveFailure(failureType, info);
                        }
                    },
                    onConnectionStatusChanged: function(status) {
                        if (listener && listener.onConnectionStatusChanged) {
                            listener.onConnectionStatusChanged(status);
                        }
                    },
                    onFailure: function(attributes, type, info) {
                        if (listener && listener.onFailure) {
                            listener.onFailure(attributes, type, info);
                        }
                    },
                    onResponse: function(message, messageSender) {
                        if (listener && listener.onResponse) {
                            listener.onResponse(message, new ResponseSender(messageSender));
                        }
                    },
                    onSuccess: function(attributes, info) {
                        if (listener && listener.onSuccess) {
                            listener.onSuccess(attributes, info);
                        }
                    },
                    onUnsolicited: function(message, messageSender) {
                        if (listener && listener.onUnsolicited) {
                            listener.onUnsolicited(message, new ResponseSender(messageSender));
                        }
                    }
                });
            }
            window.launchbox.ACF.start();
        },
        sendMessage: function(message, timers, callbacks) {
            var wrapper = {
                onResponse: function(msg, messageSender) {
                    if (callbacks && callbacks.onResponse) {
                        callbacks.onResponse(msg, new ResponseSender(messageSender));
                    }
                },
                onSuccess: function(info) {
                    if (callbacks && callbacks.onSuccess) {
                        callbacks.onSuccess(info);
                    }
                },
                onFailure: function(type, info) {
                    if (callbacks && callbacks.onFailure) {
                        callbacks.onFailure(type, info);
                    }
                }
            };
            window.launchbox.ACF.send(message, timers, wrapper);
        },
        sendCorrelatedMessage: function(refid, message, timers, callbacks) {
            var wrapper = {
                onResponse: function(msg, messageSender) {
                    if (callbacks && callbacks.onResponse) {
                        callbacks.onResponse(msg, new ResponseSender(messageSender));
                    }
                },
                onSuccess: function(info) {
                    if (callbacks && callbacks.onSuccess) {
                        callbacks.onSuccess(info);
                    }
                },
                onFailure: function(type, info) {
                    if (callbacks && callbacks.onFailure) {
                        callbacks.onFailure(type, info);
                    }
                }
            };
            window.launchbox.ACF.sendResponse(message, refid, timers, wrapper);
        },
        connectionStatus: function() {
            return window.launchbox.ACF.connectionStatus();
        },
        connect: function(config) {
            this._connect(config, null);
        },
        disconnect: function() {
            window.launchbox.ACF.stop();
        }
    };
};
messagingServiceCompatLayer();
var iLogCompatLayer = function () {
    window.com = window.com || {};
    window.com.antenna = window.com.antenna || {};
    window.com.antenna.api = window.com.antenna.api || {};
    window.com.antenna.api.LogLevel = {
        ERROR: 70,
        WARNING: 60,
        INFO: 50,
        CONFIG: 40,
        FINE: 30,
        FINER: 20,
        FINEST: 10
    };
    window.com.antenna.api.WebClientLog = function () {
        this.channelName = undefined;
        this.prefix = undefined;
        this._initChannel = function (parentLog, subchannel) {
            if (parentLog.channelName) {
                this.channelName = parentLog.channelName + '.' + subchannel;
            } else {
                this.channelName = subchannel;
            }
        };
        this._initPrefix = function (parentLog, prefix) {
            if (parentLog.prefix) {
                this.prefix = parentLog.prefix + ' ' + prefix;
            } else {
                this.prefix = prefix;
            }
        };
        this._enumToStr = function (level) {
            switch (level) {
                case com.antenna.api.LogLevel.ERROR:
                    return "ERROR";
                case com.antenna.api.LogLevel.WARNING:
                    return "WARNING";
                case com.antenna.api.LogLevel.INFO:
                    return "INFO";
                case com.antenna.api.LogLevel.CONFIG:
                    return "CONFIG";
                case com.antenna.api.LogLevel.FINE:
                    return "FINE";
                case com.antenna.api.LogLevel.FINER:
                    return "FINER";
                case com.antenna.api.LogLevel.FINEST:
                    return "FINEST";
                default:
                    return "INFO";
            }
        };
    };
    window.com.antenna.api.WebClientLog.prototype.println = function (level, statement, throwable) {
        if (!this.isPrintable(level)) {
            return;
        }
        var msg = new Date() + " ";
        if (this.channelName) {
            msg += this.channelName;
        }
        msg = msg + " <" + this._enumToStr(level) + ">";
        if (this.prefix) {
            msg += " [" + this.prefix + "]";
        }
        if (statement) {
            msg += " " + statement;
        }
        var t = throwable;
        var i = 0;
        while (t != null) {
            msg += i++ === 0 ? "\n" : "\nCaused by: ";
            msg += t.getClass().getName();
            if (t.getMessage() != null) {
                msg += ": " + t.getMessage();
            }
            var stacktrace = t.getStackTrace();
            for (var k = 0; k < stacktrace.length; k++) {
                msg += "\n\t" + stacktrace[k];
            }
            t = t.getCause();
        }
        switch (level) {
            case com.antenna.api.LogLevel.ERROR:
                console.error(msg);
                break;
            case com.antenna.api.LogLevel.WARNING:
                console.warn(msg);
                break;
            case com.antenna.api.LogLevel.INFO:
            case com.antenna.api.LogLevel.CONFIG:
                console.info(msg);
                break;
            case com.antenna.api.LogLevel.FINE:
            case com.antenna.api.LogLevel.FINER:
            case com.antenna.api.LogLevel.FINEST:
                console.debug(msg);
                break;
            default:
                console.log(msg);
                break;
        }
    };
    window.com.antenna.api.WebClientLog.prototype.isPrintable = function (level) {
        return level >= com.antenna.api.LOGGING_LEVEL;
    };
    window.com.antenna.api.WebClientLog.prototype.getSubLog = function (subchannel) {
        if (!subchannel) {
            return this;
        }
        var log = new com.antenna.api.WebClientLog();
        log._initChannel(this, subchannel);
        log.prefix = this.prefix;
        return log;
    };
    window.com.antenna.api.WebClientLog.prototype.addPrefix = function (prefix) {
        if (!prefix) {
            return this;
        }
        var log = new com.antenna.api.WebClientLog();
        log._initPrefix(this, prefix);
        log.channelName = this.channelName;
        return log;
    };
    window.com.antenna.api.ILog = {
        ERROR: com.antenna.api.LogLevel.ERROR,
        WARNING: com.antenna.api.LogLevel.WARNING,
        INFO: com.antenna.api.LogLevel.INFO,
        CONFIG: com.antenna.api.LogLevel.CONFIG,
        FINE: com.antenna.api.LogLevel.FINE,
        FINER: com.antenna.api.LogLevel.FINER,
        FINEST: com.antenna.api.LogLevel.FINEST,
        _log: new com.antenna.api.WebClientLog(),
        addPrefix: function (prefix) {
            return this._log.addPrefix(prefix);
        },
        getSubLog: function (subchannel) {
            return this._log.getSubLog(subchannel);
        },
        isPrintable: function (level) {
            return this._log.isPrintable(level);
        },
        println: function (level, statement, throwable) {
            this._log.println(level, statement, throwable);
        }
    };
    window.com.antenna.api.LOGGING_LEVEL = window.com.antenna.api.ILog.INFO;
    window.com.antenna.api.WebApi = window.com.antenna.api.WebApi || {};
    window.com.antenna.api.WebApi.getLog = function () {
        return window.com.antenna.api.ILog;
    };
};
iLogCompatLayer();
var iClientCompatLayer = function() {
    window.com = window.com || {};
    window.com.antenna = window.com.antenna || {};
    window.com.antenna.api = window.com.antenna.api || {};
    
    window.com.antenna.api.IClient = {
        // ClientState constants.
        STOPPED: -1,
        STARTING: 0,
        STOPPING: 1,
        STARTED: 2,
        LOGGED_OFF: 3,
        LOGGING_IN: 4,
        LOGGING_OUT: 5,
        LOGGED_IN: 6,
        _state: -1,
        _listeners: [],
        _updateState: function(newState) {
            var that = this;
            window.setTimeout(function() {
                var oldState = that._state;
                that._state = newState;
                for (var i = that._listeners.length - 1; i >= 0; i--) {
                    if (that._listeners[i].onState) {
                        that._listeners[i].onState(oldState, that._state, true);
                    }
                }
            }, 0);
        },
        start: function() {
            if (this._state !== this.STOPPED) {
                throw "Invalid IClient state " + this._state;
            }
            this._updateState(this.STARTING);
            this._updateState(this.STARTED);
        },
        stop: function() {
            if (this._state !== this.STARTED) {
                throw "Invalid IClient state " + this._state;
            }
            this._updateState(this.STOPPING);
            this._updateState(this.STOPPED);
        },
        getClientState: function() {
            return this._state;
        },
        
        addListener: function(listener) {
            this._listeners.push(listener);
        },
        
        removeListener: function(listener) {
            var index = this._listeners.indexOf(listener);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        },
        
        getApplication: function() {
            return window.com.antenna.api.IApplication;
        },
        
        isReady: function() {
            // TODO: add descriptor parsing and check if web app id is already parsed and available.
            return true;
        }
    };
    window.com.antenna.api.WebApi = window.com.antenna.api.WebApi || {};
    window.com.antenna.api.WebApi.getClient = function () {
        return window.com.antenna.api.IClient;
    };
};
iClientCompatLayer();
var iApplicationCompatLayer = function() {
    window.com = window.com || {};
    window.com.antenna = window.com.antenna || {};
    window.com.antenna.api = window.com.antenna.api || {};
    
    window.com.antenna.api.IApplication = {
        _pushListeners: [],
        _wasMessagingServiceAdded: false,
        getApplicationId: function() {
            return window.launchbox.ApplicationManager.self.id;
        },
        getApplicationVersion: function() {
            return window.launchbox.ApplicationManager.self.version;
        },
        getAMP4ApplicationId: function() {
            return this.getApplicationId() + '.' + this.getApplicationVersion();
        },
        
        registerForPushNotifications: function() {
            var that = this;
            window.launchbox.PushNotifications.register({
                onRegistrationSucceeded: function(token) {
                    for (var i = 0; i < that._pushListeners.length; ++i) {
                        if (that._pushListeners[i].onPushNotificationRegistrationSucceeded) {
                            that._pushListeners[i].onPushNotificationRegistrationSucceeded(token);
                        }
                    }
                },
                onRegistrationFailed: function(error) {
                    for (var i = 0; i < that._pushListeners.length; ++i) {
                        if (that._pushListeners[i].onPushNotificationRegistrationFailed) {
                            that._pushListeners[i].onPushNotificationRegistrationFailed(0, error.description);
                        }
                    }
                }
            });
        },
        
        unregisterFromPushNotifications: function() {
            for (var i = 0; i < this._pushListeners.length; ++i) {
                if (this._pushListeners[i].onPushNotificationRegistrationCancelled) {
                    this._pushListeners[i].onPushNotificationRegistrationCancelled();
                }
            }
        },
        
        getPushedData: function() {
            // TODO: Implement when push receiving is done.
            return null;
        },
        
        addPushNotificationListener: function(listener) {
            this._pushListeners.push(listener);
        },
        
        removePushNotificationListener: function(listener) {
            var index = this._pushListeners.indexOf(listener);
            if (index > -1) {
                this._pushListeners.splice(index, 1);
            }
        },
        
        addMessagingService: function(listener, config) {
            if (this._wasMessagingServiceAdded) {
                throw "addMessagingService can be called only once.";
            }
            this._wasMessagingServiceAdded = true;
            window.com.antenna.api.MessagingService._connect(config, listener);
            return window.com.antenna.api.MessagingService;
        },
        
        getMessagingService: function() {
            return window.com.antenna.api.MessagingService;
        }
    };
    if (window.launchbox.PushNotifications && window.launchbox.PushNotifications.addListener) {
        window.launchbox.PushNotifications.addListener({
            'onPushNotification': function(payload) {
                var that = window.com.antenna.api.IApplication;
                for (var i = 0; i < that._pushListeners.length; ++i) {
                    if (that._pushListeners[i].onPushedDataReceived) {
                        that._pushListeners[i].onPushedDataReceived(payload, 0);
                    }
                }
            }
        });
    }
};
iApplicationCompatLayer();

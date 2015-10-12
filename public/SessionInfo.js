Ext.define('MyApp.store.SessionInfo', {
    extend: 'Ext.data.Store',
     
    config: {
        model: 'MyApp.model.SessionInfo',
        autoLoad: true,
          
        proxy: {
         type: 'localstorage',
         id  : 'myApplicationKey'
        }
    }
});
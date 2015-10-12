Ext.define('MyApp.view.Home', {
    extend: 'Ext.Panel',
    alias : 'widget.homePage',
     
    config: {
      
     title: 'Home',
     layout: {
            type: 'vbox',
        },
        defaults: {
            margin: '5 5 5 5'
        },
   
        items: [{
            xtype: 'panel',
            id: 'welcomePanel',
            html: 'Welcome',
            margin: '5 5 20 5'
        }]
    }
   
});
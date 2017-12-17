Ext.define('MyApp.view.MainNavigation', {
    extend: 'Ext.navigation.View',
    alias : 'widget.mainNavigation',
    id: 'mainNavigation',
     
    requires: [
               'MyApp.view.Home',
               'MyApp.view.Login'
               ], 
     
    config: {
         
     navigationBar: {
            ui: 'dark',
            items: [{
                xtype: 'button',
                id: 'logoutUser',
                text: 'Logout',
                align: 'right',
                hidden: true,
                hideAnimation: Ext.os.is.Android ? false : {
                    type: 'fadeOut',
                    duration: 200
                },
                showAnimation: Ext.os.is.Android ? false : {
                    type: 'fadeIn',
                    duration: 200
                }
            }]
        },
         
        items: [{
         title: 'Home',
            items: [{
                xtype: 'login',
                flex: 1
            },{
                xtype: 'homePage',
                flex: 1,
                hidden: true
            }]
        }]
    }
     
   
});
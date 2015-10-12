Ext.define('MyApp.view.Login', {
    extend: 'Ext.form.Panel',
    alias : 'widget.login',
     
    config: {
      
     title: 'Home',
     height: 300,
     layout: {
            type: 'vbox',
        },
        defaults: {
            margin: '0 0 5 0'
        },
        items: [
            {
             xtype: 'fieldset',
                title: 'User Authentication',
                items: [
                    {
                        xtype: 'textfield',
                        label: 'User Id',
                        itemId: 'userId',
                        name: 'userId',
                        allowBlank: false,
                        autoCapitalize: false,
                        labelWidth: 100
                    },
                    {
                        xtype: 'passwordfield',
                        label: 'Password',
                        itemId: 'password',
                        name: 'password',
                        allowBlank: false,
                        labelWidth: 100
                    }
                ]
   },   
   {
                xtype: 'button',
                itemId: 'loginButton',
                text: 'Login',
                ui: 'action'
            }
        ]
    }
   
});
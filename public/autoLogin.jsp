<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
 
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<meta name="robots" content="noindex,nofollow"/>
<title>Programmers sample guide, help is on the way</title>
<link rel="stylesheet" href="/sencha-touch/resources/css-debug/sencha-touch.css" type="text/css">
<script type="text/javascript" src="/sencha-touch/sencha-touch-all-debug.js"></script>
<script type="text/javascript">
 
Ext.Loader.setConfig({ 
 enabled: true
});
 
Ext.application({
     
 name: 'MyApp',
 appFolder: '/Sencha_Touch/app/autoLogin',
  
 requires: [
               'MyApp.view.MainNavigation'
               ], 
                
    views : ['MainNavigation'],           
    controllers: ['AutoLoginDemo'],
     
    launch: function() {
     console.log('Application launch');
     Ext.create('Ext.Container', {
      fullscreen: true,
      layout: 'vbox',
         items: [{
          flex: 1,
          xtype: 'mainNavigation'
            }]
     });
    }
     
});
 
</script>
</head>
 
<body>
</body>
</html>
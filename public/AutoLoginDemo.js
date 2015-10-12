Ext.define('MyApp.controller.AutoLoginDemo', {
 extend : 'Ext.app.Controller',
 
 sessionId: null,
  
 config: {
  profile: Ext.os.deviceType.toLowerCase(),
  stores : ['SessionInfo'],
  models : ['SessionInfo'],
   
  refs: {
   myNavigationView: 'mainNavigation',
   myLoginPanel: 'login'
  },
   
  control: {
   'login button[itemId=loginButton]' : {
    tap : 'onUserAuthentication'
   },
   'mainNavigation button[itemId=logoutUser]' : {
    tap : 'onUserLogout'
   }
  }  
 
 },
  
 launch: function() {
     console.log('Launch for controller');
     var sessionInfo = Ext.getStore('SessionInfo');             
     if(null!=sessionInfo.getAt(0)){
      this.successfulLogin(sessionInfo.getAt(0).get('sessionId'));
        }
      
    },
     
    onUserAuthentication: function(button) {
     var fieldset = button.up('panel').down('fieldset');
     var userId = fieldset.getComponent('userId');
     var password = fieldset.getComponent('password');
     if(userId.getValue() && password.getValue()){
       
      button.setText('Please wait ...');
      button.setDisabled(true);
       
      Ext.Ajax.request({
             url : '../Login',
             method:'POST', 
             params : {
                 userId: userId.getValue(),
                 password: password.getValue()
             },
             scope : this,
             //method to call when the request is successful
             success : this.onLoginSuccess,
             //method to call when the request is a failure
             failure : this.onLoginFailure
      }); 
       
      password.setValue('');
       
     }
     else {
      Ext.Msg.alert('', 'Please enter User Id and/or Password', Ext.emptyFn);
       }
    },
     
    onUserLogout: function(button) {
      
     this.sessionId = null;
     var sessionInfo = Ext.getStore('SessionInfo');
     sessionInfo.removeAll();
     sessionInfo.sync();
      
     var logoutButton = Ext.getCmp('logoutUser');
     logoutButton.setHidden(true);
      
     var navigationView = this.getMyNavigationView();
     var loginPanel = navigationView.down('login');
  var homePage = navigationView.down('homePage');
  loginPanel.show(true);
  homePage.hide(true);
    },
     
    onLoginFailure : function(err) {
      
     var panel = this.getMyLoginPanel();
     var button = panel.getComponent('loginButton');
     button.setText('Login');
  button.setDisabled(false);
      
  Ext.Msg.alert('', 'Error connecting to server, please try after some time', Ext.emptyFn);
    },
 
    onLoginSuccess : function(response, opts) {
      
     var panel = this.getMyLoginPanel();
     var button = panel.getComponent('loginButton');
     button.setText('Login');
  button.setDisabled(false);
   
        response = Ext.decode(response.responseText);
        if(response.success){
         this.successfulLogin(response.sessionId);
        }
        else {
            Ext.Msg.alert('Login failed', response.message);
        }
    },
 
    successfulLogin: function(sessionId){
      
     this.sessionId = sessionId;
      
     var sessionInfo = Ext.getStore('SessionInfo');
     sessionInfo.removeAll();
     sessionInfo.sync();
     var newRecord = new MyApp.model.SessionInfo({
      sessionId: this.sessionId 
     });
     sessionInfo.add(newRecord);
     sessionInfo.sync();
      
     var navigationView = this.getMyNavigationView();
     var loginPanel = navigationView.down('login');
     var homePage = navigationView.down('homePage');
     var myHtml = "Welcome, <b>You are now logged in...</b>";
     Ext.getCmp('welcomePanel').setHtml(myHtml);
     loginPanel.hide(false);
     homePage.show(false);
      
     var logoutButton = Ext.getCmp('logoutUser');
     logoutButton.setHidden(false);
      
    },
     
 init: function() {
  console.log('Controller initialized');
 }
 
});